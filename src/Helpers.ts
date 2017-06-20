
/**
 * Safely gets a nested property, due to typescripts current abscence of elevis operators, null if not possible
 * @param {any} object
 * @param {string[]} properties
 * @return {any} nested property
 */
export function getNestedElement(object: any, properties: string[]): any
{
    for (var index in properties)
    {
        if (object[properties[index]])
        {
            object = object[properties[index]];
        }
        else
        {
            return null;
        }

    }
    return object;
}

export function addIfNotNull(array: any[], toAdd: any): any
{
    if (toAdd)
    {
        array.push(toAdd);
    }

    return toAdd;
}

export function arrayContains(array: any[], toCheck: any): boolean
{
    for (var index in array)
    {
        if (toCheck === array[index])
        {
            return true;
        }
    }

    return false;
}

export class ExportMapping
{
    public filePath: string;
    public className: string;
}

export class PossibleODPClass
{
    public exportedName: string;
    public extendsName: string;
    public extendsFile: string
}