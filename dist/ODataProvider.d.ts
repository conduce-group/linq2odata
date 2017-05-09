import { Observable } from 'rxjs/Rx';
export declare abstract class ODataProvider<T> {
    Where<T>(predicate: (value?: T, index?: number, list?: T[]) => boolean): Observable<T[]>;
    filter: (query: string) => Observable<T[]>;
}
