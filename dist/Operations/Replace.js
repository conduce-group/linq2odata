"use strict";
exports.__esModule = true;
var esprima = require("esprima");
var fs = require("fs");
var path = require("path");
var LINQOData_1 = require("./LINQOData");
var Constants_1 = require("../Structure/Constants");
var Helpers_1 = require("../Structure/Helpers");
var WhereRange = (function () {
    function WhereRange() {
    }
    return WhereRange;
}());
exports.WhereRange = WhereRange;
function replaceWhereWithFilter(directory, odps, logger, dryRun) {
    var files = Helpers_1.recurseFolders(directory, []);
    var changeOccurred = false;
    for (var index in files) {
        var filename = files[index];
        var fileDirectory = path.parse(filename).dir;
        var fileContent = fs.readFileSync(filename).toString();
        var syntaxTree = esprima.parse(fileContent, { range: true, loc: true });
        var fileWheres = getWheresInBody(syntaxTree.body, fileDirectory, odps);
        for (var whereIndex in fileWheres) {
            var newFilter = LINQOData_1.LINQOData.FilterFromWhereArgument(fileContent.substring(fileWheres[whereIndex].startArgument, fileWheres[whereIndex].endArgument));
            logger.debug("Changing line: " + fileContent.substr(fileWheres[whereIndex].startWhereKeyword, fileWheres[whereIndex].endArgument));
            logger.debug("    to: " + Constants_1.filterKeyword + newFilter);
            fileContent =
                fileContent.substr(0, fileWheres[whereIndex].startWhereKeyword)
                    + Constants_1.filterKeyword
                    + newFilter
                    + fileContent.substr(fileWheres[whereIndex].endArgument);
            if (!dryRun) {
                fs.writeFileSync(filename, fileContent);
            }
        }
        if (fileWheres.length > 0) {
            logger.info(fileWheres.length + " replacements for " + filename);
        }
    }
    if (!changeOccurred) {
        logger.info("No files found which import ODataProvider class and use a Where statement");
    }
}
exports.replaceWhereWithFilter = replaceWhereWithFilter;
function getWheresInBody(body, directory, odps, hasImport) {
    if (hasImport === void 0) { hasImport = false; }
    var wheres = [];
    for (var lineNum in body) {
        var _a = getLineType(body[lineNum]), lineClassification = _a[0], line = _a[1];
        switch (lineClassification) {
            case "Import":
                var odpclass = getODPClassIfODPFile(line, directory, odps);
                if (odpclass) {
                    hasImport = true;
                }
                break;
            case "FncExp":
                wheres = wheres.concat(getWheresInBody(getFunctionBody(line), directory, odps, hasImport));
                break;
            case "Decorator":
                break;
            case "Where":
                var whereRange = getWhere(line);
                if (whereRange) {
                    wheres.push(whereRange);
                }
                break;
            default:
                break;
        }
    }
    return hasImport ? wheres : [];
}
function getLineType(line) {
    var lineType = ["Other", "Other"];
    if (Helpers_1.getNestedElement(line, ["declarations", "0", "init", "callee", "name"]) === 'require') {
        lineType = ["Import", Helpers_1.getNestedElement(line, ["declarations", "0", "init"])];
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
    else if (Helpers_1.getNestedElement(line, ["expression", "callee", "property", "name"]) === 'Where') {
        lineType = ["Where", Helpers_1.getNestedElement(line, ["expression"])];
    }
    else if (Helpers_1.getNestedElement(line, ["expression", "right", "callee", "name"]) === '__decorate') {
        lineType = ["Decorator", line];
    }
    return lineType;
}
function getODPClassIfODPFile(line, directory, odps) {
    var className = null;
    var odpClassName = getODPClassIfInODPs(Helpers_1.resolveImport(directory, Helpers_1.getNestedElement(line, ["arguments", "0", "value"])), odps);
    if (odpClassName) {
        className = odpClassName;
    }
    return className;
    function getODPClassIfInODPs(fileName, odps) {
        for (var index in odps) {
            if (fileName === odps[index].filePath) {
                return odps[index].className;
            }
        }
        return null;
    }
}
function getODPParamTypes(line) {
}
function getWhere(fnc) {
    var possibleRanges = null;
    var possibleRangeArgument = Helpers_1.getNestedElement(fnc, ["arguments", "0", "range"]);
    var possibleRangeKeyword = Helpers_1.getNestedElement(fnc, ["callee", "property", "range"]);
    if (possibleRangeArgument && possibleRangeKeyword) {
        possibleRanges = {
            startArgument: possibleRangeArgument[0],
            endArgument: possibleRangeArgument[1],
            startWhereKeyword: possibleRangeKeyword[0],
            endWhereKeyword: possibleRangeKeyword[1]
        };
    }
    return possibleRanges;
}
function getFunctionBody(fnc) {
    var result = Helpers_1.getNestedElement(fnc, ["body", "body"]);
    if (!result) {
        result = [];
    }
    return result;
}
