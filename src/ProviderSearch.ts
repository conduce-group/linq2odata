import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';
import { ExportMapping, getNestedElement, addIfNotNull } from './Helpers'
import { odpImportString, odpClassName } from './Constants'

type expressionTypes = "Import" | "MaybeClass" | "FncExp" | "Export" | "Other";
type estLineTypes = est.CallExpression | est.AssignmentExpression | est.MemberExpression | est.FunctionExpression | est.VariableDeclarator;

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
        let syntaxTree = esprima.parse(fileContent.toString()).body;
        debugger;
        let extendeeNames: string[] = [];
        let exportedExtendeeNames: string[] = [];
        for (var lineNum in syntaxTree)
        {
            let [lineClassification, line] = getLineType(syntaxTree[lineNum]);
            switch (lineClassification)
            {
                case "Import":
                    break;
                case "MaybeClass":
                    addIfNotNull(extendeeNames, getNameIfExportee(line as est.VariableDeclarator));
                    break;
                case "FncExp":

                    break;
                case "Export":
                    addIfNotNull(exportedExtendeeNames, getExporteeIfODPExtendee(line as est.AssignmentExpression, extendeeNames));
                    break;
                default:
                    break;
            }

        }
    }

    return oDataProviders;
}
//let [importName, importLine] = getNameAndLineODPImport(syntaxTree) as [string, number];
//if (importLine > -1)
//{
//    let [extendeeName, extendeeLine] = getNameAndLineOfODPExtendee(syntaxTree, importLine);
//    if (extendeeLine > 0)
//    {
//        let [exportName, exportLine] = checkODPExtendeeExported(syntaxTree, extendeeLine, extendeeName);
//        if (exportLine > 0)
//        {
//            oDataProviders.push({ filePath: directory + files[index], className: exportName })
//        }
//    }
//}

function getExporteeIfODPExtendee(line: est.AssignmentExpression, oDPExtendeeNames: string[]): string | null
{
    let exportName = getNestedElement(line, ["right", "name"]);
    for (var index in oDPExtendeeNames)
    {
        if (exportName === oDPExtendeeNames[index])
        {
            return ((line.left as est.MemberExpression).object as est.Identifier).name;
        }
    }
    return null;
}

function getNameIfExportee(line: est.VariableDeclarator): string | null
{
    if (
        getNestedElement(line, ["id", "type"]) === "Identifier" &&
        getNestedElement(line, ["init", "arguments", "0", "value"]) === odpImportString
    )
    {
        return ((line as est.VariableDeclarator).id as est.Identifier).name;
    }
    return null;
}

function getLineType(line: est.Statement | est.ModuleDeclaration | est.Expression): [expressionTypes, estLineTypes]
{
    let lineType = ["Other", null] as [expressionTypes, estLineTypes];
    // Import statement
    if (getNestedElement(line, ["declarations", "0", "init", "callee", "name"]) === 'require')
    {
        lineType = ["Import", getNestedElement(line, ["declarations", "0", "init"]) as est.CallExpression];
    }
    // MaybeClass Expressions
    else if (
        getNestedElement(line, ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression' &&
        getNestedElement(line, ["declarations", "0", "init", "arguments", "length"]) > 0
    )
    {
        lineType = ["MaybeClass", getNestedElement(line, ["declarations", "0"]) as est.VariableDeclarator];
    }
    // FncExp Expressions
    else if (getNestedElement(line, ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression')
    {
        lineType = ["FncExp", getNestedElement(line, ["declarations", "0", "init", "callee"]) as est.VariableDeclarator];
    }
    else if (getNestedElement(line, ["type"]) === 'FunctionExpression')
    {
        lineType = ["FncExp", line as est.FunctionExpression];
    }
    else if (getNestedElement(line, ["expression", "right", "type"]) === 'FunctionExpression')
    {
        lineType = ["FncExp", getNestedElement(line, ["expression", "right"]) as est.FunctionExpression];
    }
    // Export Expression
    else if (getNestedElement(line, ["expression", "left", "object", "name"]) === "exports")
    {
        lineType = ["Export", getNestedElement(line, ["expression"]) as est.AssignmentExpression];
    }
    return lineType;
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
