"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
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
exports.getNestedElement = getNestedElement;
function recurseFolders(dir, filelist) {
    var files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = recurseFolders(dir + file + '/', filelist);
        }
        else if (file.match(/.*\.js$/)) {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
}
exports.recurseFolders = recurseFolders;
;
function addIfNotNull(array, toAdd) {
    if (toAdd) {
        array.push(toAdd);
    }
    return toAdd;
}
exports.addIfNotNull = addIfNotNull;
function arrayContains(array, toCheck) {
    for (var index in array) {
        if (toCheck === array[index]) {
            return true;
        }
    }
    return false;
}
exports.arrayContains = arrayContains;
