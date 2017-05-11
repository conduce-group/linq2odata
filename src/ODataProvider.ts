import { Observable } from 'rxjs/Rx';

export abstract class ODataProvider<T>
{
    private queryResource: string[] = [];

    public Where: (predicate: (value?: T, index?: number, list?: T[]) => boolean) => void;

    public get(): Observable<T[]>
    {
        return this.getFromQuery(this.getQuery());
    }

    protected abstract getFromQuery(query: string): Observable<T[]>;

    private getQuery(): string
    {
        let query: string = "";
        if (this.queryResource.length > 0)
            query = "?";
        for (var index = 0; index < this.queryResource.length; index++)
        {
            if (index != 0)
                query += "&";
            query += this.queryResource[index];
        }

        return query;
    }

    public filter(filterQuery: string): void
    {
        this.queryResource.push("$filter=" + filterQuery);
    }

    public top(topQuery: number): void
    {
        this.queryResource.push("$top=" + topQuery);
    }

    public skip(skipQuery: number): void
    {
        this.queryResource.push("$skip=" + skipQuery);
    }

    public count(): void
    {
        this.queryResource.push("$count=true");
    }

    public orderby(field: string): void
    {
        this.queryResource.push("$orderby=" + field);
    }
}
