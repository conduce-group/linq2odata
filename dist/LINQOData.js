"use strict";
exports.__esModule = true;
var esprima = require("esprima");
var Helpers_1 = require("./Helpers");
var operatorMapping = {
    "==": "eq",
    "!=": "ne",
    ">": "gt",
    ">=": "ge",
    "<": "lt",
    "<=": "le"
};
var LINQOData = (function () {
    function LINQOData() {
    }
    LINQOData.FilterFromWhereArgument = function (predicate) {
        var predicateSource = predicate.replace("function (", "function predicate(");
        debugger;
        var syntax = esprima.parse(predicateSource);
        var toTraverse = Helpers_1.getNestedElement(syntax, ["body", "0", "body", "body", "0"]).argument;
        var newFncBody = "";
        if (toTraverse != null) {
            newFncBody = "\"" + LINQOData.traverse(toTraverse) + "\"";
        }
        return newFncBody;
    };
    LINQOData.traverse = function (toTraverse) {
        var result;
        switch (toTraverse.type) {
            case "Identifier":
                result = LINQOData.identifier(toTraverse.name);
                break;
            case "Literal":
                result = LINQOData.literal(toTraverse.value);
                break;
            case "MemberExpression":
                result = LINQOData.memberExpression(toTraverse.property);
                break;
            case "BinaryExpression":
                result = LINQOData.binaryExpression(toTraverse.operator, toTraverse.left, toTraverse.right);
                break;
            default:
                throw "Unknown Node type: " + toTraverse.type;
        }
        return result;
    };
    LINQOData.binaryExpression = function (operator, left, right) {
        return " (" + LINQOData.traverse(left) + ") " + LINQOData.mapOperator(operator)
            + " (" + LINQOData.traverse(right) + ") ";
    };
    LINQOData.literal = function (rawValue) {
        if (rawValue != null) {
            if (typeof (rawValue) == "object") {
                throw "RegExp not accepted";
            }
            return typeof rawValue == 'string' ? "'" + rawValue + "'" : rawValue.toString();
        }
        else {
            throw "Null raw value from literal";
        }
    };
    LINQOData.identifier = function (name) {
        return "\"+" + name + "+\"";
    };
    LINQOData.memberExpression = function (property) {
        if (property.type == 'Identifier') {
            return property.name;
        }
        else {
            throw "Unaccepted expression type for property: " + property.type;
        }
    };
    LINQOData.mapOperator = function (operator) {
        if (operatorMapping.hasOwnProperty(operator)) {
            return (operatorMapping[operator]);
        }
        else {
            throw "Unknown operator: " + operator;
        }
    };
    return LINQOData;
}());
exports.LINQOData = LINQOData;
