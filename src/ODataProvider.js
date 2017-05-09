import { Observable } from 'rxjs/Rx';

export class ODataProvider<T>
{
    public Where<T>(predicate: (value?: T, index?: number, list?: T[]) => boolean) : Observable<T[]>
    { return null;}
    
    public filter : (query : string) => Observable<T[]>
}
