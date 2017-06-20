import { Observable } from 'rxjs/Rx';
import { IODataProvider } from './IODataProvider';
export declare abstract class ODataProvider<T> implements IODataProvider<T> {
    private queryResource;
    Where: (predicate: (value?: T) => boolean) => IODataProvider<T>;
    get(): Observable<any>;
    protected abstract getFromQuery(query: string): Observable<any>;
    private getQuery();
    filter(filterQuery: string): ODataProvider<T>;
    top(topQuery: number): ODataProvider<T>;
    skip(skipQuery: number): ODataProvider<T>;
    count(): ODataProvider<T>;
    orderby(field: string): ODataProvider<T>;
}
