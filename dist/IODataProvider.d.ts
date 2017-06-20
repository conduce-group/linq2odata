import { Observable } from 'rxjs/Rx';
export declare abstract class IODataProvider<T> {
    abstract get(): Observable<any>;
    abstract Where(predicate: (value?: T) => boolean): IODataProvider<T>;
    abstract filter(filterQuery: string): IODataProvider<T>;
    abstract top(topQuery: number): IODataProvider<T>;
    abstract skip(skipQuery: number): IODataProvider<T>;
    abstract count(): IODataProvider<T>;
    abstract orderby(field: string): IODataProvider<T>;
}
