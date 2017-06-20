///<reference path="../node_modules/rxjs/Observable.d.ts"/>
///<reference path="../node_modules/rxjs/operator/toPromise.d.ts"/>
import { Observable } from 'rxjs/Rx';

export abstract class ODataProvider<T>
{
    private queryResource: string[] = [];

    public Where: (predicate: (value?: T) => boolean) => void;

    public get(): Observable<any>
    {
        return this.getFromQuery(this.getQuery());
    }

    protected abstract getFromQuery(query: string): Observable<any>;

    private getQuery(): string
    {
        let query: string = "";
        if (this.queryResource.length > 0)
        {
            query = "?";
        }
        for (var index = 0; index < this.queryResource.length; index++)
        {
            if (index != 0)
            {
                query += "&";
            }
            query += this.queryResource[index];
        }

        this.queryResource = [];

        return query;
    }

    public filter(filterQuery: string): ODataProvider<T>
    {
        this.queryResource.push("$filter=" + filterQuery);
        return this;
    }

    public top(topQuery: number): ODataProvider<T>
    {
        this.queryResource.push("$top=" + topQuery);
        return this;
    }

    public skip(skipQuery: number): ODataProvider<T>
    {
        this.queryResource.push("$skip=" + skipQuery);
        return this;
    }

    public count(): ODataProvider<T>
    {
        this.queryResource.push("$count=true");
        return this;
    }

    public orderby(field: string): ODataProvider<T>
    {
        this.queryResource.push("$orderby=" + field);
        return this;
    }
}
