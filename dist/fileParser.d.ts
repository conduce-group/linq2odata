export declare class WhereRange {
    startArgument: number;
    endArgument: number;
    startWhereKeyword: number;
    endWhereKeyword: number;
}
export declare class ExportMapping {
    filePath: string;
    className: string;
}
export declare function getODataProviders(directory: string): ExportMapping[];
export declare function replaceWhereWithFilter(directory: string, odps: ExportMapping[]): void;
