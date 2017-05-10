"use strict";
exports.__esModule = true;
var esprima = require("esprima");
var fs = require("fs");
var odpImportString = "linq2odata/dist/ODataProvider";
var odpClassName = "ODataProvider";
var ExportMapping = (function () {
    function ExportMapping() {
    }
    return ExportMapping;
}());
exports.ExportMapping = ExportMapping;
function getODataProviders(directory) {
    var oDataProviders = [];
    var files = fs.readdirSync(directory);
    for (var index in files) {
        var fileContent = fs.readFileSync(directory + files[index]);
        var syntaxTree = esprima.parse(fileContent.toString());
        debugger;
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
function getNestedElement(object, properties) {
    for (var index in properties) {
        if (object[properties[index]]) {
            object = object[properties[index]];
        }
        else {
            return null;
        }
    }
    return object;
}
function getNameAndLineODPImport(st) {
    for (var lineNum in st.body) {
        if (getNestedElement(st.body[lineNum], ["declarations", "0", "id", "type"]) === "Identifier" &&
            getNestedElement(st.body[lineNum], ["declarations", "0", "init", "arguments", "0", "value"]) === odpImportString) {
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
        if (getNestedElement(st.body[lineNum], ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression' &&
            getNestedElement(st.body[lineNum], ["declarations", "0", "init", "arguments", "0", "property", "name"]) === odpClassName) {
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
        if (getNestedElement(st.body[lineNum], ["expression", "right", "name"]) === oDPExtendeeName &&
            getNestedElement(st.body[lineNum], ["expression", "left", "object", "name"]) === "exports") {
            return [
                st.body[lineNum].expression.left.object.name,
                lineNum
            ];
        }
    }
    return ["", -1];
}
function replaceWhereWithFilter(directory, odps) {
    var files = fs.readdirSync(directory);
    for (var index in files) {
        var fileContent = fs.readFileSync(directory + files[index]);
        var syntaxTree = esprima.parse(fileContent.toString());
    }
}
exports.replaceWhereWithFilter = replaceWhereWithFilter;
