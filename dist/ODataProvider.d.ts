/// <reference path="../node_modules/rxjs/Observable.d.ts" />
/// <reference path="../node_modules/rxjs/operator/toPromise.d.ts" />
import { Observable } from 'rxjs/Rx';
export declare abstract class ODataProvider<T> {
    private queryResource;
    Where: (predicate: (value?: T) => boolean) => void;
    get(): Observable<any>;
    protected abstract getFromQuery(query: string): Observable<any>;
    private getQuery();
    filter(filterQuery: string): ODataProvider<T>;
    top(topQuery: number): ODataProvider<T>;
    skip(skipQuery: number): ODataProvider<T>;
    count(): ODataProvider<T>;
    orderby(field: string): ODataProvider<T>;
}
