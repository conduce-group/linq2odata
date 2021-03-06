import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';
import * as path from 'path';
import { LINQOData } from './LINQOData';
import { Logger } from '../Structure/Logger'
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
type expressionTypes = "Import" | "FncExp" | "Decorator" | "Where" | "VarDeclarations" | "GeneralExpression" | "CallExpression" | "Other";
type estLineTypes = est.CallExpression | est.FunctionExpression | est.ExpressionStatement | est.Expression | est.VariableDeclaration | null;

export function replaceWhereWithFilter(directory: string, odps: ExportMapping[], logger: Logger, dryRun: boolean): void
{
    let files = recurseFolders(directory, []);
    let changeOccurred: boolean = false;
    for (var index in files)
    {
        let filename: string = files[index];
        let fileDirectory = path.parse(filename).dir;
        let fileContent = fs.readFileSync(filename).toString();
        let syntaxTree = esprima.parse(fileContent, { range: true, loc: true });

        let fileWheres = getWheresInBody(syntaxTree.body, fileDirectory, odps, false);

        if (fileWheres.length > 0)
        {
            logger.info(fileWheres.length + " replacements for " + filename);
            changeOccurred = true;
        }
        else
        {
            logger.debug("No replacements for Where statement found in " + filename);
        }

        for (var whereIndex in fileWheres)
        {
            let predicate: string =
                fileContent.substring(fileWheres[whereIndex].startArgument, fileWheres[whereIndex].endArgument);
            let predicateAndWhere: string =
                fileContent.substring(fileWheres[whereIndex].startWhereKeyword, fileWheres[whereIndex].endArgument)

            let newFilter = LINQOData.FilterFromWhereArgument(predicate);

            logger.debug("  Changing line: " + predicateAndWhere);
            logger.debug("             to: " + filterKeyword + newFilter);

            fileContent =
                fileContent.substr(0, fileWheres[whereIndex].startWhereKeyword)
                + filterKeyword
                + newFilter
                + fileContent.substr(fileWheres[whereIndex].endArgument);

            if (!dryRun)
            {
                fs.writeFileSync(filename, fileContent);
            }
        }
    }

    if (!changeOccurred)
    {
        logger.info("No files found which import ODataProvider class and use a Where statement");
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
            case "VarDeclarations":
                let varDeclarations = getNestedElement(line, ["declarations"]);
                for (var declarationIndex in varDeclarations)
                {
                    let currentDeclarationInitialisation = getNestedElement(varDeclarations[declarationIndex], ["init"]) as est.Statement | est.ModuleDeclaration;
                    wheres = wheres.concat(
                        getWheresInBody([currentDeclarationInitialisation], directory, odps, hasImport)
                    );
                }
                break;
            case "CallExpression":
                wheres = wheres.concat(
                    getWheresInCallExpression(line as est.CallExpression, directory, odps, hasImport)
                );
                break;
            case "GeneralExpression":
                wheres = wheres.concat(
                    getWheresInBody(getExpression(line as est.ExpressionStatement), directory, odps, hasImport)
                );
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

function getWheresInCallExpression(line: est.CallExpression, directory: string, odps: ExportMapping[], hasImport: boolean = false): WhereRange[]
{
    let wheres = [] as WhereRange[];

    let calleeObject = getNestedElement(line, ["callee", "object"]);
    if (calleeObject)
    {
        wheres = wheres.concat(getWheresInBody([calleeObject], directory, odps, hasImport));
    }

    let callArguments = getNestedElement(line, ["arguments"]);
    for (var argumentIndex in callArguments)
    {
        let currentArgument = callArguments[argumentIndex] as est.Statement | est.ModuleDeclaration;
        wheres = wheres.concat(getWheresInBody([currentArgument], directory, odps, hasImport));
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
    else if (getNestedElement(line, ["callee", "property", "name"]) === 'Where')
    {
        lineType = ["Where", line as est.CallExpression];
    }
    // Decoration
    else if (getNestedElement(line, ["expression", "right", "callee", "name"]) === '__decorate')
    {
        lineType = ["Decorator", line as est.ExpressionStatement];
    }
    // Non Where CallExpression
    else if (getNestedElement(line, ["type"]) === 'CallExpression')
    {
        lineType = ["CallExpression", line as est.CallExpression];
    }
    // ExpressionStatement
    else if (getNestedElement(line, ["type"]) === 'ExpressionStatement')
    {
        lineType = ["GeneralExpression", line as est.Expression];
    }
    //VarDeclarations
    else if (getNestedElement(line, ["type"]) === 'VariableDeclaration')
    {
        lineType = ["VarDeclarations", line as est.VariableDeclaration];
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

function getExpression(fnc: est.ExpressionStatement): Array<est.Statement | est.ModuleDeclaration>
{
    let result: Array<est.Statement | est.ModuleDeclaration> =
        [getNestedElement(fnc, ["expression"])];
    if (!result)
    {
        result = [];
    }

    return result;
}