import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';

const odpImportString: string = "linq2odata/dist/ODataProvider";
const odpClassName: string = "ODataProvider";

export class ExportMapping
{
    public filePath: string;
    public className: string;
}


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
        debugger;
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

/**
 * Safely gets a nested property, due to typescripts current abscence of elevis operators, null if not possible
 * @param {any} object
 * @param {string[]} properties
 * @return {any} nested property
 */
function getNestedElement(object: any, properties: string[]): any
{
    for (var index in properties)
    {
        if (object[properties[index]])
        {
            object = object[properties[index]];
        }
        else
        {
            return null;
        }

    }
    return object;
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
        let fileContent = fs.readFileSync(directory + files[index]);
        let syntaxTree = esprima.parse(fileContent.toString());
    }
}