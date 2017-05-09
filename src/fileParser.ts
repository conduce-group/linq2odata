import * as esprima from 'esprima';
import * as est from 'estree';
import * as fs from 'fs';

// ODP = ODataProvider

let odpImportString: string = "linq2odata/dist/ODataProvider";

export function getODataProviders(directory: string): string[]
{
    let filesProvidingOData: string[] = [];
    let classExtensionMapping = [];

    let files = fs.readdirSync(directory);
    for (var index in files)
    {
        let fileContent = fs.readFileSync(directory + files[index]);
        let thing = fileContent.toString();
        let syntaxTree = esprima.parse(thing);
        debugger;
        let [importName, lineNum] = getNameAndLineODPImport(syntaxTree);
        if (lineNum > 0)
        {
            let [extendeeName, lineNum] = getNameAndLineODPImport(syntaxTree);
            if (lineNum > 0)
            {
                   
            }
        }
    }

    return filesProvidingOData;
}

function getNameAndLineODPImport(st: est.Program): [string, number]
{
    for (var lineNum in st.body)
    {
        if (
            //Check types as no elvis operator... [yet?]
            st.body[lineNum].type == "VariableDeclaration" &&
            (st.body[lineNum] as est.VariableDeclaration).declarations &&
            (st.body[lineNum] as est.VariableDeclaration).declarations[0].type == "VariableDeclarator" &&
            ((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).id.type == "Identifier" &&
            ((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init.type == "CallExpression" &&
            (((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression).arguments[0].type == "Literal" &&
            //Check that the import is for linq2odata
            ((((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression)
                .arguments[0] as est.Literal).value == odpImportString
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

function getNameAndLineOfODPExtendee(st: est.Program, lineNum :number): [string, number]
{
    for (var index = lineNum; index < st.body.length; index++)
    {
        if (
            st.body[lineNum].type == "VariableDeclaration" &&
            (st.body[lineNum] as est.VariableDeclaration).declarations &&
            (st.body[lineNum] as est.VariableDeclaration).declarations[0].type == "VariableDeclarator" &&
            ((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).id.type == 'Identifier' &&
            ((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init.type == "CallExpression" &&
            (((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression).callee.type == 'FunctionExpression' &&
            (((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression).arguments[0].type == 'MemberExpression' &&
            ((((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression).arguments[0] as est.MemberExpression).property.type == 'Identifier' &&
            getNestedElement(body[lineNum], {"declarations","0","init","arguments","0","property","name"})
            (((((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).init as est.CallExpression).arguments[0] as est.MemberExpression).property as est.Identifier).name == "ODataProvider"
            )
        {
            return [
                (((st.body[lineNum] as est.VariableDeclaration).declarations[0] as est.VariableDeclarator).id as est.Identifier).name,
                lineNum
            ]
        }
    }
    return ["", -1];
}

function getNameAndLineOfODPExtendee(st: est.Program, lineNum: number): [string, number]
{
    for (var index = lineNum; index < st.body.length; index++)
    {
        if (
            )
        {

        }
    }
}