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
        var syntaxTree = esprima.parse(fileContent.toString()).body;
        debugger;
        var extendeeNames = [];
        var exportedExtendeeNames = [];
        for (var lineNum in syntaxTree) {
            var _a = getLineType(syntaxTree[lineNum]), lineClassification = _a[0], line = _a[1];
            switch (lineClassification) {
                case "Import":
                    break;
                case "MaybeClass":
                    Helpers_1.addIfNotNull(extendeeNames, getNameIfExportee(line));
                    break;
                case "FncExp":
                    break;
                case "Export":
                    Helpers_1.addIfNotNull(exportedExtendeeNames, getExporteeIfODPExtendee(line, extendeeNames));
                    break;
                default:
                    break;
            }
        }
    }
    return oDataProviders;
}
exports.getODataProviders = getODataProviders;
function getExporteeIfODPExtendee(line, oDPExtendeeNames) {
    var exportName = Helpers_1.getNestedElement(line, ["right", "name"]);
    for (var index in oDPExtendeeNames) {
        if (exportName === oDPExtendeeNames[index]) {
            return line.left.object.name;
        }
    }
    return null;
}
function getNameIfExportee(line) {
    if (Helpers_1.getNestedElement(line, ["id", "type"]) === "Identifier" &&
        Helpers_1.getNestedElement(line, ["init", "arguments", "0", "value"]) === Constants_1.odpImportString) {
        return line.id.name;
    }
    return null;
}
function getLineType(line) {
    var lineType = ["Other", null];
    if (Helpers_1.getNestedElement(line, ["declarations", "0", "init", "callee", "name"]) === 'require') {
        lineType = ["Import", Helpers_1.getNestedElement(line, ["declarations", "0", "init"])];
    }
    else if (Helpers_1.getNestedElement(line, ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression' &&
        Helpers_1.getNestedElement(line, ["declarations", "0", "init", "arguments", "length"]) > 0) {
        lineType = ["MaybeClass", Helpers_1.getNestedElement(line, ["declarations", "0"])];
    }
    else if (Helpers_1.getNestedElement(line, ["declarations", "0", "init", "callee", "type"]) === 'FunctionExpression') {
        lineType = ["FncExp", Helpers_1.getNestedElement(line, ["declarations", "0", "init", "callee"])];
    }
    else if (Helpers_1.getNestedElement(line, ["type"]) === 'FunctionExpression') {
        lineType = ["FncExp", line];
    }
    else if (Helpers_1.getNestedElement(line, ["expression", "right", "type"]) === 'FunctionExpression') {
        lineType = ["FncExp", Helpers_1.getNestedElement(line, ["expression", "right"])];
    }
    else if (Helpers_1.getNestedElement(line, ["expression", "left", "object", "name"]) === "exports") {
        lineType = ["Export", Helpers_1.getNestedElement(line, ["expression"])];
    }
    return lineType;
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
