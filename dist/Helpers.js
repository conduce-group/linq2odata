"use strict";
exports.__esModule = true;
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
var ExportMapping = (function () {
    function ExportMapping() {
    }
    return ExportMapping;
}());
exports.ExportMapping = ExportMapping;
var PossibleODPClass = (function () {
    function PossibleODPClass() {
    }
    return PossibleODPClass;
}());
exports.PossibleODPClass = PossibleODPClass;
