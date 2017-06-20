export declare function getNestedElement(object: any, properties: string[]): any;
export declare function addIfNotNull(array: any[], toAdd: any): any;
export declare function arrayContains(array: any[], toCheck: any): boolean;
export declare class ExportMapping {
    filePath: string;
    className: string;
}
export declare class PossibleODPClass {
    exportedName: string;
    extendsName: string;
    extendsFile: string;
}
