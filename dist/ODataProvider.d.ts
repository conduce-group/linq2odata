import { Observable } from 'rxjs/Rx';
export declare abstract class ODataProvider<T> {
    private queryResource;
    Where: (predicate: (value?: T, index?: number, list?: T[]) => boolean) => void;
    get(): Observable<any>;
    protected abstract getFromQuery(query: string): Observable<any>;
    private getQuery();
    filter(filterQuery: string): ODataProvider<T>;
    top(topQuery: number): ODataProvider<T>;
    skip(skipQuery: number): ODataProvider<T>;
    count(): ODataProvider<T>;
    orderby(field: string): ODataProvider<T>;
}
