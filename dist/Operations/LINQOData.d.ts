import * as est from 'estree';
export declare class LINQOData {
    static FilterFromWhereArgument<T>(predicate: string): string;
    static traverse(toTraverse: est.Literal | est.Expression): string;
    static binaryExpression(operator: string, left: any, right: any): string;
    static literal(rawValue: string | boolean | number | null | RegExp): string;
    static identifier(name: string): string;
    static memberExpression(property: est.Expression): string;
    static mapOperator(operator: string): string;
}
