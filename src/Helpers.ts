
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

export class ExportMapping
{
    public filePath: string;
    public className: string;
}


