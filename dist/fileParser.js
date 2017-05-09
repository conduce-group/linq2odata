"use strict";
exports.__esModule = true;
var esprima = require("esprima");
var fs = require("fs");
function getODataProviders(directory) {
    var filesProvidingOData = [];
    var classExtensionMapping = [];
    var files = fs.readdirSync(directory);
    for (var index in files) {
        var fileContent = fs.readFileSync(directory + files[index]);
        var thing = fileContent.toString();
        debugger;
        var syntax = esprima.parse(thing);
        console.log("parsed");
    }
    return filesProvidingOData;
}
exports.getODataProviders = getODataProviders;
