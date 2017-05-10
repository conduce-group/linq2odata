"use strict";
exports.__esModule = true;
var esprima = require("esprima");
var fs = require("fs");
var Helpers_1 = require("./Helpers");
var Constants_1 = require("./Constants");
function getODataProviders(directory) {
    var oDataProviders = [];
    var files = fs.readdirSync(directory);
    for (var index in files) {
        var fileContent = fs.readFileSync(directory + files[index]);
        var syntaxTree = esprima.parse(fileContent.toString());
        var _a = getNameAndLineODPImport(syntaxTree), importName = _a[0], importLine = _a[1];
        if (importLine > -1) {
            var _b = getNameAndLineOfODPExtendee(syntaxTree, importLine), extendeeName = _b[0], extendeeLine = _b[1];
            if (extendeeLine > 0) {
                var _c = checkODPExtendeeExported(syntaxTree, extendeeLine, extendeeName), exportName = _c[0], exportLine = _c[1];
                if (exportLine > 0) {
                    oDataProviders.push({ filePath: directory + files[index], className: exportName });
                }
            }
        }
    }
    return oDataProviders;
}
exports.getODataProviders = getODataProviders;
function getNameAndLineODPImport(st) {
    for (var lineNum in st.body) {
        if (Helpers_1.getNestedElement(st.body[lineNum], ["declarations", "0", "id", "type"]) === "Identifier" &&
            Helpers_1.getNestedElement(st.body[lineNum], ["declarations", "0", "init", "arguments", "0", "value"]) === Constants_1.odpImportString) {
            return [
                st.body[lineNum].declarations[0].id.name,
                Number(lineNum)
            ];
        }
    }
    return ["", -1];
}
function getNameAndLineOfODPExtendee(st, currentlineNum) {
    for (var lineNum = currentlineNum; lineNum < st.body.length; lineNum++) {
        if (Helpers_1.getNestedElement(st.body[lineNum], ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression' &&
            Helpers_1.getNestedElement(st.body[lineNum], ["declarations", "0", "init", "arguments", "0", "property", "name"]) === Constants_1.odpClassName) {
            return [
                st.body[lineNum].declarations[0].id.name,
                lineNum
            ];
        }
    }
    return ["", -1];
}
function checkODPExtendeeExported(st, currentlineNum, oDPExtendeeName) {
    for (var lineNum = currentlineNum; lineNum < st.body.length; lineNum++) {
        if (Helpers_1.getNestedElement(st.body[lineNum], ["expression", "right", "name"]) === oDPExtendeeName &&
            Helpers_1.getNestedElement(st.body[lineNum], ["expression", "left", "object", "name"]) === "exports") {
            return [
                st.body[lineNum].expression.left.object.name,
                lineNum
            ];
        }
    }
    return ["", -1];
}
