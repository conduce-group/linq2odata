import { Observable } from 'rxjs/Rx';

export abstract class IODataProvider<T>
{
    public abstract get(): Observable<any>;

    public abstract Where(predicate: (value?: T) => boolean): IODataProvider<T>;

    public abstract filter(filterQuery: string): IODataProvider<T>;

    public abstract top(topQuery: number): IODataProvider<T>;

    public abstract skip(skipQuery: number): IODataProvider<T>;

    public abstract count(): IODataProvider<T>;

    public abstract orderby(field: string): IODataProvider<T>;
}
