import { Observable } from 'rxjs/Rx';
export declare class ODataProvider<T> {
    Where<T>(predicate: (value?: T, index?: number, list?: T[]) => boolean): Observable<T[]>;
    filter: (query: string) => Observable<T[]>;
}