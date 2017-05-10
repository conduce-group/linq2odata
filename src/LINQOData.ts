import * as esprima from 'esprima';
import * as est from 'estree';
import { getNestedElement } from './Helpers'

interface IOpMap 
{
    [key: string]: string;
}

const operatorMapping: IOpMap =
{
    "==": "eq",
    "!=": "ne",
    ">": "gt",
    ">=": "ge",
    "<": "lt",
    "<=": "le"
}

export class LINQOData
{
    public static FilterFromWhereArgument<T>(predicate:string): string
    {
        let predicateSource = predicate.replace("function (", "function predicate(");
        var syntax = esprima.parse(predicateSource);
        let toTraverse = (getNestedElement(syntax, ["body", "0", "body", "body", "0"]) as est.ReturnStatement).argument;

        let newFncBody = "\"" + LINQOData.traverse(toTraverse) + "\"";
        return newFncBody;
    }

    static traverse(toTraverse: est.Literal | est.Expression)
    {
        let result: string;
        switch (toTraverse.type)
        {
            case "Identifier":
                result = LINQOData.identifier((toTraverse as est.Identifier).name);
                break;
            case "Literal":
                result = LINQOData.literal((toTraverse as est.Literal).value);
                break;
            case "MemberExpression":
                result = LINQOData.memberExpression((toTraverse as est.MemberExpression).property);
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

    static binaryExpression(operator: string, left: any, right: any): string
    {
        return " (" + LINQOData.traverse(left) + ") " + LINQOData.mapOperator(operator)
            + " (" + LINQOData.traverse(right) + ") ";
    }

    static literal(rawValue: string | boolean | number | null | RegExp): string
    {
        //if (typeof rawValue == 'RegExp')
        //{
        //    throw "RegExp not accepted";
        //}

        return typeof rawValue == 'string' ? "'" + rawValue + "'" : rawValue.toString();
    }

    static identifier(name: string): string
    {
        //need to know type of identifier
        return "\"+" + name + "+\"";
    }

    static memberExpression(property: est.Expression): string
    {
        if (property.type == 'Identifier')
        {
            return (property as est.Identifier).name;
        }
        else
        {
            throw "Unaccepted expression type for property: " + (property as est.Expression).type;
        }
    }

    static mapOperator(operator: string): string
    {
        if (operatorMapping.hasOwnProperty(operator))
        {
            return (operatorMapping[operator]);
        }
        else
        {
            throw "Unknown operator: " + operator;
        }
    }
}