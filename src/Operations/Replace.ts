import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';
import * as path from 'path';
import { LINQOData } from './LINQOData';
import { filterKeyword } from '../Structure/Constants';
import { ExportMapping } from '../Structure/Classes'
import { resolveImport, getNestedElement, recurseFolders } from '../Structure/Helpers'

export class WhereRange
{
    public startArgument: number;
    public endArgument: number;

    public startWhereKeyword: number;
    public endWhereKeyword: number;
}
type expressionTypes = "Import" | "FncExp" | "Decorator" | "Where" | "Other";
type estLineTypes = est.CallExpression | est.FunctionExpression | est.ExpressionStatement | "Other";


export function replaceWhereWithFilter(directory: string, odps: ExportMapping[]): void
{
    let files = recurseFolders(directory, []);
    for (var index in files)
    {
        let filename: string = files[index];
        let fileDirectory = path.parse(filename).dir;
        let fileContent = fs.readFileSync(filename).toString();
        let syntaxTree = esprima.parse(fileContent, { range: true, loc: true });
        let fileWheres = getWheresInBody(syntaxTree.body, fileDirectory, odps);

        for (var whereIndex in fileWheres)
        {
            let newFilter = LINQOData.FilterFromWhereArgument(
                fileContent.substring(fileWheres[whereIndex].startArgument, fileWheres[whereIndex].endArgument)
            );
            fileContent =
                fileContent.substr(0, fileWheres[whereIndex].startWhereKeyword)
                + filterKeyword
                + newFilter
                + fileContent.substr(fileWheres[whereIndex].endArgument);
            fs.writeFileSync(filename, fileContent);
        }
        if (fileWheres.length > 0)
        {
            console.log(fileContent);
            console.log(fileWheres.length + " replacement for " + filename);
        }
    }
}

function getWheresInBody(body: Array<est.Statement | est.ModuleDeclaration>, directory: string, odps: ExportMapping[], hasImport: boolean = false): WhereRange[]
{
    let wheres = [] as WhereRange[];

    for (var lineNum in body)
    {
        let [lineClassification, line] = getLineType(body[lineNum]);
        switch (lineClassification)
        {
            case "Import":
                let odpclass = getODPClassIfODPFile(line as est.CallExpression, directory, odps);
                if (odpclass)
                {
                    hasImport = true;
                }
                break;
            case "FncExp":
                wheres = wheres.concat(getWheresInBody(getFunctionBody(line as est.FunctionExpression), directory, odps, hasImport));
                break;
            case "Decorator":
                //check  types of arguments
                break;
            case "Where":
                let whereRange = getWhere(line as est.CallExpression);
                if (whereRange)
                {
                    wheres.push(whereRange);
                }
                break;
            default:
                break;
        }
    }

    return hasImport ? wheres : [];
}

function getLineType(line: est.Statement | est.ModuleDeclaration | est.Expression): [expressionTypes, estLineTypes]
{
    let lineType = ["Other", "Other"] as [expressionTypes, estLineTypes];
    // Import statement
    if (getNestedElement(line, ["declarations", "0", "init", "callee", "name"]) === 'require')
    {
        lineType = ["Import", getNestedElement(line, ["declarations", "0", "init"]) as est.CallExpression];
    }
    // Function Expressions
    else if (getNestedElement(line, ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression')
    {
        lineType = ["FncExp", getNestedElement(line, ["declarations", "0", "init", "callee"]) as est.FunctionExpression];
    }
    else if (getNestedElement(line, ["type"]) === 'FunctionExpression')
    {
        lineType = ["FncExp", line as est.FunctionExpression];
    }
    else if (getNestedElement(line, ["expression", "right", "type"]) === 'FunctionExpression')
    {
        lineType = ["FncExp", getNestedElement(line, ["expression", "right"]) as est.FunctionExpression];
    }
    // Where memberExpression
    else if (getNestedElement(line, ["expression", "callee", "property", "name"]) === 'Where')
    {
        lineType = ["Where", getNestedElement(line, ["expression"]) as est.CallExpression];
    }
    // Decoration
    else if (getNestedElement(line, ["expression", "right", "callee", "name"]) === '__decorate')
    {
        lineType = ["Decorator", line as est.ExpressionStatement];
    }
    return lineType;
}

function getODPClassIfODPFile(line: est.CallExpression, directory: string, odps: ExportMapping[]): string | null
{
    var className = null;
    let odpClassName = getODPClassIfInODPs(
        resolveImport(directory, getNestedElement(line, ["arguments", "0", "value"])),
        odps
    );
    if (odpClassName)
    {
        className = odpClassName;
    }

    return className;

    function getODPClassIfInODPs(fileName: string, odps: ExportMapping[]): string | null
    {
        for (var index in odps)
        {
            if (fileName === odps[index].filePath)
            {
                return odps[index].className;
            }
        }
        return null;
    }
}

function getODPParamTypes(line: est.ExpressionStatement)
{

}

function getWhere(fnc: est.CallExpression): WhereRange | null
{
    let possibleRanges = null;

    let possibleRangeArgument = getNestedElement(fnc, ["arguments", "0", "range"]);
    let possibleRangeKeyword = getNestedElement(fnc, ["callee", "property", "range"]);
    if (possibleRangeArgument && possibleRangeKeyword)
    {
        possibleRanges = {
            startArgument: possibleRangeArgument[0],
            endArgument: possibleRangeArgument[1],
            startWhereKeyword: possibleRangeKeyword[0],
            endWhereKeyword: possibleRangeKeyword[1]
        };
    }

    return possibleRanges;
}

function getFunctionBody(fnc: est.FunctionExpression): Array<est.Statement | est.ModuleDeclaration>
{
    let result: Array<est.Statement | est.ModuleDeclaration> =
        getNestedElement(fnc, ["body", "body"]);
    if (!result)
    {
        result = [];
    }

    return result;
}