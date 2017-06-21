export class Logger
{
    private logLevel: number;
    constructor(
        inLevel : number
    )
    {
        this.logLevel = inLevel ? inLevel : 0;
    }

    public info(msg: string)
    {
        if (this.logLevel >= 1)
        {
            console.log(msg);
        }
    }

    public debug(msg: string)
    {
        if (this.logLevel >= 2)
        {
            console.log(msg);
        }
    }
}
