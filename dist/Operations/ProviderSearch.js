"use strict";
exports.__esModule = true;
var esprima = require("esprima");
var fs = require("fs");
var path = require("path");
var Helpers_1 = require("../Structure/Helpers");
var Constants_1 = require("../Structure/Constants");
function getODataProviders(directory) {
    var files = Helpers_1.recurseFolders(directory, []);
    var odpDictionary = {};
    odpDictionary[Constants_1.odpImportString] = [Constants_1.odpClassName];
    var possibleODP = {};
    for (var index in files) {
        var filename = files[index];
        var fileContent = fs.readFileSync(filename);
        var syntaxTree = esprima.parse(fileContent.toString()).body;
        var imports = {};
        var extendees = {};
        var exportedClasses = {};
        for (var lineNum in syntaxTree) {
            var _a = getLineType(syntaxTree[lineNum]), lineClassification = _a[0], line = _a[1];
            switch (lineClassification) {
                case "Import":
                    var importResult = getImportName(line);
                    if (importResult) {
                        var importFile = importResult[0], importVariableName = importResult[1];
                        if (importFile.indexOf("./") == 0 || importFile.indexOf("../") == 0) {
                            importFile = path.resolve(directory, importFile);
                            var fileExtensionRegex = /.*\/*.*\..+/g;
                            var result = importFile.match(fileExtensionRegex);
                            if (result === null) {
                                importFile += Constants_1.defaultExtension;
                            }
                        }
                        imports[importVariableName] = importFile;
                    }
                    break;
                case "MaybeClass":
                    var classResult = getClassAndParentName(line);
                    if (classResult) {
                        var className = classResult[0], parentName = classResult[1];
                        extendees[className] = parentName;
                    }
                    break;
                case "Export":
                    var exportResult = getExporteeIfODPExtendee(line, Object.keys(extendees));
                    if (exportResult) {
                        var className = exportResult[0], exportName = exportResult[1];
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
    var oDataProviders = dictionaryToExportMapping(odpDictionary);
    return oDataProviders;
}
exports.getODataProviders = getODataProviders;
function populatePossibleODPS(exportedClasses, extendees, imports) {
    var possibleODPs = [];
    for (var exportClassName in exportedClasses) {
        if (extendees[exportClassName]) {
            var _a = extendees[exportClassName], parentFileAlias = _a[0], parentClass = _a[1];
            if (imports[parentFileAlias]) {
                possibleODPs.push({
                    exportedName: exportClassName,
                    extendsName: parentClass,
                    extendsFile: imports[parentFileAlias]
                });
            }
        }
        else {
        }
    }
    return possibleODPs;
}
function dictionaryToExportMapping(odpDictionary) {
    var result = [];
    for (var filename in odpDictionary) {
        for (var classNameIndex in odpDictionary[filename]) {
            result.push({
                filePath: filename,
                className: odpDictionary[filename][classNameIndex]
            });
        }
    }
    return result;
}
function recurseODPImplementors(odpDictionary, possibleODP, change) {
    if (change === void 0) { change = true; }
    if (!change) {
        return odpDictionary;
    }
    var nextPossibleODPs = {};
    var thisChange = false;
    for (var filename in possibleODP) {
        nextPossibleODPs[filename] = [];
        for (var exportIndex in possibleODP[filename]) {
            if (extendsODP(possibleODP[filename][exportIndex], odpDictionary)) {
                if (!odpDictionary[filename]) {
                    odpDictionary[filename] = [];
                }
                odpDictionary[filename].push(possibleODP[filename][exportIndex].exportedName);
                thisChange = true;
            }
            else {
                nextPossibleODPs[filename].push(possibleODP[filename][exportIndex]);
            }
        }
    }
    return recurseODPImplementors(odpDictionary, nextPossibleODPs, thisChange);
}
function extendsODP(testClass, odpDictionary) {
    return Helpers_1.arrayContains(odpDictionary[testClass.extendsFile], testClass.extendsName);
}
function getImportName(line) {
    if (Helpers_1.getNestedElement(line, ["declarations", "0", "id", "type"]) === "Identifier" &&
        Helpers_1.getNestedElement(line, ["declarations", "0", "init", "arguments", "0", "value"])) {
        return [
            line.declarations[0].init.arguments[0].value,
            line.declarations[0].id.name
        ];
    }
    return null;
}
function getExporteeIfODPExtendee(line, oDPExtendeeNames) {
    var exportName = Helpers_1.getNestedElement(line, ["right", "name"]);
    if (Helpers_1.arrayContains(oDPExtendeeNames, exportName)) {
        return [
            line.left.property.name,
            exportName
        ];
    }
    return null;
}
function isExtendee(line) {
    var result = false;
    if (Helpers_1.getNestedElement(line, ["id", "type"]) === "Identifier" &&
        Helpers_1.getNestedElement(line, ["init", "arguments", "0", "value"])) {
        result = true;
    }
    return result;
}
function getClassNameIfExtendee(line, importedODPs) {
    var parentName = Helpers_1.getNestedElement(line, ["init", "arguments", "0", "value"]);
    if (Helpers_1.arrayContains(importedODPs, parentName)) {
        return line.id.name;
    }
    return null;
}
function getClassAndParentName(line) {
    if (Helpers_1.getNestedElement(line, ["id", "type"]) === "Identifier" &&
        Helpers_1.getNestedElement(line, ["init", "arguments", "0", "object", "name"])) {
        var parentFileAndClass = [
            Helpers_1.getNestedElement(line, ["init", "arguments", "0", "object", "name"]),
            Helpers_1.getNestedElement(line, ["init", "arguments", "0", "property", "name"])
        ];
        return [
            line.id.name,
            parentFileAndClass
        ];
    }
    return null;
}
function getLineType(line) {
    var lineType = ["Other", "Other"];
    if (Helpers_1.getNestedElement(line, ["declarations", "0", "init", "callee", "name"]) === 'require') {
        lineType = ["Import", line];
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
