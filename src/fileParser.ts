import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';
import * as path from 'path';
import { LINQOData } from './LINQOData';
import { getNestedElement } from './Helpers'

const odpImportString: string = "linq2odata/dist/ODataProvider";
const odpClassName: string = "ODataProvider";
const filterKeyword: string = "filter(";

export class WhereRange
{
    public startArgument: number;
    public endArgument: number;

    public startWhereKeyword: number;
    public endWhereKeyword: number;
}

export class ExportMapping
{
    public filePath: string;
    public className: string;
}

type expressionTypes = "Import" | "FncExp" | "Decorator" | "Where" | "Other";
type estLineTypes = est.CallExpression | est.FunctionExpression | est.ExpressionStatement;

/**
 * Checks a directory for files defining ODataProvider (ODP), assuming only one definition per file
 * @param {string} directory
 * @return {ExportMapping[]} all odataproviders in the directory
 */
export function getODataProviders(directory: string): ExportMapping[] 
{
    let oDataProviders: ExportMapping[] = [];

    let files = fs.readdirSync(directory);
    for (var index in files)
    {
        let fileContent = fs.readFileSync(directory + files[index]);
        let syntaxTree = esprima.parse(fileContent.toString());
        let [importName, importLine] = getNameAndLineODPImport(syntaxTree) as [string, number];
        if (importLine > -1)
        {
            let [extendeeName, extendeeLine] = getNameAndLineOfODPExtendee(syntaxTree, importLine);
            if (extendeeLine > 0)
            {
                let [exportName, exportLine] = checkODPExtendeeExported(syntaxTree, extendeeLine, extendeeName);
                if (exportLine > 0)
                {
                    oDataProviders.push({ filePath: directory + files[index], className: exportName })
                }
            }
        }
    }

    return oDataProviders;
}

function getNameAndLineODPImport(st: est.Program): [string, number]
{
    for (var lineNum in st.body)
    {
        if (
            getNestedElement(st.body[lineNum], ["declarations", "0", "id", "type"]) === "Identifier" &&
            getNestedElement(st.body[lineNum], ["declarations", "0", "init", "arguments", "0", "value"]) === odpImportString
        )
        {
            return [
                (((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).id as est.Identifier).name,
                Number(lineNum)
            ];
        }
    }
    return ["", -1];
}

function getNameAndLineOfODPExtendee(st: est.Program, currentlineNum: number): [string, number]
{
    for (var lineNum = currentlineNum; lineNum < st.body.length; lineNum++)
    {
        if (
            getNestedElement(st.body[lineNum], ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression' &&
            getNestedElement(st.body[lineNum], ["declarations", "0", "init", "arguments", "0", "property", "name"]) === odpClassName
        )
        {
            return [
                (((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).id as est.Identifier).name,
                lineNum
            ];
        }
    }
    return ["", -1];
}

function checkODPExtendeeExported(st: est.Program, currentlineNum: number, oDPExtendeeName: string): [string, number]
{
    for (var lineNum = currentlineNum; lineNum < st.body.length; lineNum++)
    {
        if (
            getNestedElement(st.body[lineNum], ["expression", "right", "name"]) === oDPExtendeeName &&
            getNestedElement(st.body[lineNum], ["expression", "left", "object", "name"]) === "exports"
        )
        {
            return [
                ((((st.body[lineNum] as est.ExpressionStatement).expression as est.AssignmentExpression).left as est.MemberExpression).object as est.Identifier).name,
                lineNum
            ];
        }
    }
    return ["", -1];
}





export function replaceWhereWithFilter(directory: string, odps: ExportMapping[]): void
{
    let files = fs.readdirSync(directory);
    for (var index in files)
    {
        let fileContent = fs.readFileSync(directory + files[index]).toString();
        let syntaxTree = esprima.parse(fileContent, { range: true, loc: true });
        let fileWheres = getWheresInBody(syntaxTree.body, directory, odps);
        for (var whereIndex in fileWheres)
        {
            let newFilter = LINQOData.FilterFromWhereArgument(
                fileContent.substring(fileWheres[whereIndex].startArgument, fileWheres[whereIndex].endArgument)
            );
            let newFileContent =
                fileContent.substr(0, fileWheres[whereIndex].startWhereKeyword)
                + filterKeyword 
                + newFilter
                + fileContent.substr(fileWheres[whereIndex].endArgument);

            console.log(newFileContent);
        }
    }
}

function getWheresInBody(body: Array<est.Statement | est.ModuleDeclaration>, directory: string, odps: ExportMapping[]): WhereRange[]
{
    let wheres = [] as WhereRange[];
    for (var lineNum in body)
    {
        let [lineClassification, line] = getLineType(body[lineNum]);
        switch (lineClassification)
        {
            case "Import":
                let odpclass = getODPClassIfODPFile(line as est.CallExpression, directory, odps);

                break;
            case "FncExp":
                wheres = wheres.concat(getWheresInBody(getFunctionBody(line as est.FunctionExpression), directory, odps));
                break;
            case "Decorator":

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

    return wheres;
}

function getLineType(line: est.Statement | est.ModuleDeclaration | est.Expression): [expressionTypes, estLineTypes]
{
    let lineType = ["Other", null] as [expressionTypes, estLineTypes];
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

function getODPClassIfODPFile(line: est.CallExpression, directory: string, odps: ExportMapping[]): string
{
    var className = null;
    let odpClassName = getODPClassIfInODPs(
        path.resolve(directory, getNestedElement(line, ["arguments", "0", "value"])),
        odps
    );
    if (odpClassName)
    {
        className = odpClassName;
    }

    return className;

    function getODPClassIfInODPs(fileName: string, odps: ExportMapping[]): string
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
        possibleRanges =  {
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