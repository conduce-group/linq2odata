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
