import { Observable } from 'rxjs/Rx';
export declare abstract class ODataProvider<T> {
    private queryResource;
    Where: (predicate: (value?: T, index?: number, list?: T[]) => boolean) => void;
    get(): Observable<T[]>;
    protected abstract getFrom(query: string): Observable<T[]>;
    private getQuery();
    filter(filterQuery: string): void;
    top(topQuery: number): void;
}
