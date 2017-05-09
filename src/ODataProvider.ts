import { Observable } from 'rxjs/Rx';

export abstract class ODataProvider<T>
{
    let queryResource : string[] = [];
    
    public Where<T> : (predicate: (value?: T, index?: number, list?: T[]) => boolean) => void;

    public  get() : Observable<T[]>
    {
        return getFrom(this.getQuery());
    }

    private abstract getFrom(query : string) : Observable<T[]>;

    private getQuery() : string
    {
        let query : string = "";
        if(queryResource.length > 0)
            query = "?";
        for(index in queryResource)
        {
            if(index != 0)
                query += "&";
            query += queryResource[index];
        }
    }
    
    public filter (filterQuery : string) : void
    {
        this.resource.push("filter=" + filterQuery);
    }

    public top (topQuery : number) : void
    {
        this.resource.push("top=" + topQuery);
    }

}
