//import * as esprima from 'esprima';
//import * as est from 'estree';
//var est = require('estree');
var esprima = require('esprima');

class LINQOData
{
    static operatorMapping(input)
    {
        let opmap = {
        "==": "eq",
        "!=": "ne",
        ">": "gt",
        ">=": "ge",
        "<": "lt",
        "<=": "le"
        };
        if(opmap.hasOwnProperty(input))
        {
            return opmap[input];
        }
        return null;
    }

    //predicate: (value?: T, index?: number, list?: T[]) => boolean
    static Where(predicate) //: string
    {
        let predicateSource = predicate.toString().replace("function (", "function predicate(");
        var syntax = esprima.parse(predicateSource);
        let toTraverse = (syntax.body[0]["body"]["body"][0]).argument;
        //console.log(JSON.stringify(toTraverse, null, 4));

        let newFncBody = LINQOData.traverse(toTraverse);
        return newFncBody;
    }

    static traverse(toTraverse) //: est.Literal | est.Expression)
    {
        let result; //: string;
        switch (toTraverse.type)
        {
            case "Identifier": 
                result = LINQOData.identifier((toTraverse).name);
                break;
            case "Literal":
                result = LINQOData.literal((toTraverse).value);
                break;
            case "MemberExpression":
                result = LINQOData.memberExpression((toTraverse).property);
                break;
            case "BinaryExpression":
                result = LINQOData.binaryExpression(
                    toTraverse.operator,
                    toTraverse.left,
                    toTraverse.right
                );
                break;
            default:
                throw "Unknown Node type: " + toTraverse.type;
        }
        return result;
    }

    //(operator: string, left: any, right: any): string
    static binaryExpression(operator, left, right)
    {
        return " (" + LINQOData.traverse(left) + ") " + LINQOData.mapOperator(operator)
            + " (" + LINQOData.traverse(right) + ") ";
    }
    
    //(rawValue: string | boolean | number | null | RegExp): string
    static literal(rawValue)
    {
        if (typeof rawValue == 'RegExp')
        {
            throw "RegExp not accepted";
        }

        return typeof rawValue == 'string' ? "'" + rawValue + "'" : rawValue.toString();
    }

    //(name: string ): string
    static identifier(name)
    {
        //need to know type of identifier
        return "\"+" + name + "+\"";
    }
    
    //(property: est.Expression): string
    static memberExpression(property)
    {
        if (property.type == 'Identifier')
        {
            return (property).name;
        }
        else
        {
            throw "Unaccepted expression type for property: " + (property).type;
        }
    }

    //(operator: string): string 
    static mapOperator(operator)
    {
        var mapping = this.operatorMapping(operator);
        if (mapping)
        {
            return mapping;
        }
        else
        {
            throw "Unknown operator: " + operator;
        }
    }
}

module.exports.LINQOData = LINQOData;
