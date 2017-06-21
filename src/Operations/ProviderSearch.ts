import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';
import * as path from 'path';
import { PossibleODPClass, ExportMapping } from '../Structure/Classes'
import { Logger } from '../Structure/Logger'
import { recurseFolders, resolveImport, getNestedElement, addIfNotNull, arrayContains } from '../Structure/Helpers'
import { odpImportString, odpClassName, defaultExtension, iODPImportString, iODPClassName } from '../Structure/Constants'

type expressionTypes = "Import" | "MaybeClass" | "FncExp" | "Export" | "Other";
type estLineTypes = est.CallExpression | est.AssignmentExpression | est.MemberExpression | est.FunctionExpression | est.VariableDeclarator | est.VariableDeclaration | "Other";

/**
 * Checks a directory for files defining ODataProvider (ODP), assuming only one definition per file
 * @param {string} directory
 * @return {ExportMapping[]} all odataproviders in the directory
 */
export function getODataProviders(directory: string, logger: Logger): ExportMapping[] 
{
    let files: string[] = recurseFolders(directory, []);
    let odpDictionary: { [file: string]: string[] } = {};
    odpDictionary[odpImportString] = [odpClassName];
    odpDictionary[iODPImportString] = [iODPClassName];
    let possibleODP: { [file: string]: PossibleODPClass[] } = {};

    for (var index in files)
    {
        let filename = path.resolve("./", files[index]);
        let fileContent = fs.readFileSync(filename);
        let syntaxTree = esprima.parse(fileContent.toString()).body;
        let imports: { [importName: string]: string } = {};
        let extendees: { [extendeeName: string]: [string, string] } = {};
        let exportedClasses: { [exportName: string]: string } = {};

        for (var lineNum in syntaxTree)
        {
            let [lineClassification, line] = getLineType(syntaxTree[lineNum]);
            switch (lineClassification)
            {
                case "Import":
                    let importResult = getImportName(line as est.VariableDeclaration);
                    if (importResult)
                    {
                        let [importFile, importVariableName] = importResult;
                        let fileDirectory = path.parse(filename).dir;
                        importFile = resolveImport(fileDirectory, importFile);

                        imports[importVariableName] = importFile;
                    }
                    break;
                case "MaybeClass":
                    let classResult = getClassAndParentName(line as est.VariableDeclarator);
                    if (classResult)
                    {
                        let [className, parentName] = classResult;
                        extendees[className] = parentName;
                    }
                    break;
                case "Export":
                    let exportResult = getExporteeIfODPExtendee(line as est.AssignmentExpression, Object.keys(extendees));
                    if (exportResult)
                    {
                        let [className, exportName] = exportResult;
                        exportedClasses[className] = exportName;
                    }
                    break;
                default:
                    break;
            }
        }

        possibleODP[filename] = populatePossibleODPS(exportedClasses, extendees, imports);
    }
    odpDictionary = recurseODPImplementors(odpDictionary, possibleODP);
    let oDataProviders: ExportMapping[] = dictionaryToExportMapping(odpDictionary);

    return oDataProviders;
}

function populatePossibleODPS(exportedClasses: { [exportName: string]: string }, extendees: { [extendeeName: string]: [string, string] }, imports: { [importName: string]: string }): PossibleODPClass[] 
{
    let possibleODPs: PossibleODPClass[] = [];

    for (var exportClassName in exportedClasses)
    {
        if (extendees[exportClassName])
        {
            let [parentFileAlias, parentClass]: [string, string] = extendees[exportClassName];
            if (imports[parentFileAlias])
            {
                possibleODPs.push
                    ({
                        exportedName: exportClassName,
                        extendsName: parentClass,
                        extendsFile: imports[parentFileAlias]
                    } as PossibleODPClass);
            }
        }
        else
        {
            // insert method to deal with multiple classes in one file here
        }
    }

    return possibleODPs;
}

function dictionaryToExportMapping(odpDictionary: { [file: string]: string[] }): ExportMapping[]
{
    let result: ExportMapping[] = [];

    for (var filename in odpDictionary)
    {
        for (var classNameIndex in odpDictionary[filename])
        {
            result.push({
                filePath: filename,
                className: odpDictionary[filename][classNameIndex]
            } as ExportMapping);
        }
    }

    return result;
}

/**
 * Given possible ODPs, returns those which are based off of what classes extended - done recursively to allow for class extending classes extending classes
 * Iterates over diminishing list of possible ODPs, if one is found to be an ODP it is added to the list, removed from the list for the next iteration and the fact that a change occurred in the lists is noted in the change variable
 * @param {{[file: string]: string[]}} odpDictionary
 * @param {{[file: string]: PossibleODPClass[]}} odpDictionary
 * @param {boolean} change - was there a change in previous list
 * @return {{ [file: string]: string[] } ]} all the ODP
 */
function recurseODPImplementors(odpDictionary: { [file: string]: string[] }, possibleODP: { [file: string]: PossibleODPClass[] }, change: boolean = true): { [file: string]: string[] } 
{
    if (!change)
    {
        return odpDictionary;
    }

    let nextPossibleODPs: { [file: string]: PossibleODPClass[] } = {};
    let thisChange: boolean = false;

    for (var filename in possibleODP)
    {
        nextPossibleODPs[filename] = [];

        for (var exportIndex in possibleODP[filename])
        {
            if (extendsODP(possibleODP[filename][exportIndex], odpDictionary))
            {
                if (!odpDictionary[filename])
                {
                    odpDictionary[filename] = [];
                }
                odpDictionary[filename].push(possibleODP[filename][exportIndex].exportedName);
                thisChange = true;
            }
            else
            {
                nextPossibleODPs[filename].push(possibleODP[filename][exportIndex]);
            }
        }
    }

    return recurseODPImplementors(odpDictionary, nextPossibleODPs, thisChange);
}

function extendsODP(testClass: PossibleODPClass, odpDictionary: { [file: string]: string[] }): boolean
{
    return arrayContains(odpDictionary[testClass.extendsFile], testClass.extendsName);
}

function getImportName(line: est.VariableDeclaration): [string, string] | null
{
    if (
        getNestedElement(line, ["declarations", "0", "id", "type"]) === "Identifier" &&
        getNestedElement(line, ["declarations", "0", "init", "arguments", "0", "value"])
    )
    {
        return [
            (((((line as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression).arguments[0] as est.Literal).value as string),
            (((line as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).id as est.Identifier).name
        ];
    }

    return null;
}

function getExporteeIfODPExtendee(line: est.AssignmentExpression, oDPExtendeeNames: string[]): [string, string] | null
{
    let exportName = getNestedElement(line, ["right", "name"]);

    if (arrayContains(oDPExtendeeNames, exportName))
    {
        return [
            ((line.left as est.MemberExpression).property as est.Identifier).name,
            exportName
        ];
    }

    return null;
}

function isExtendee(line: est.VariableDeclarator): boolean
{
    let result: boolean = false;

    if (
        getNestedElement(line, ["id", "type"]) === "Identifier" &&
        getNestedElement(line, ["init", "arguments", "0", "value"])
    )
    {
        result = true;
    }

    return result;
}

function getClassNameIfExtendee(line: est.VariableDeclarator, importedODPs: string[]): string | null
{
    let parentName = getNestedElement(line, ["init", "arguments", "0", "value"]);

    if (arrayContains(importedODPs, parentName))
    {
        return ((line as est.VariableDeclarator).id as est.Identifier).name;
    }

    return null;
}

function getClassAndParentName(line: est.VariableDeclarator): [string, [string, string]] | null
{
    if (
        getNestedElement(line, ["id", "type"]) === "Identifier" &&
        getNestedElement(line, ["init", "arguments", "0", "object", "name"])
    )
    {
        let parentFileAndClass: [string, string] = [
            getNestedElement(line, ["init", "arguments", "0", "object", "name"]),
            getNestedElement(line, ["init", "arguments", "0", "property", "name"])
        ];
        return [
            ((line as est.VariableDeclarator).id as est.Identifier).name,
            parentFileAndClass
        ];
    }
    return null;
}

function getLineType(line: est.Statement | est.ModuleDeclaration | est.Expression): [expressionTypes, estLineTypes]
{
    let lineType = ["Other", "Other"] as [expressionTypes, estLineTypes];
    // Import statement
    if (getNestedElement(line, ["declarations", "0", "init", "callee", "name"]) === 'require')
    {
        lineType = ["Import", line as est.VariableDeclaration];
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
