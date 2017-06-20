import { ExportMapping } from '../Structure/Classes';
export declare class WhereRange {
    startArgument: number;
    endArgument: number;
    startWhereKeyword: number;
    endWhereKeyword: number;
}
export declare function replaceWhereWithFilter(directory: string, odps: ExportMapping[]): void;
