import * as fs from 'fs';
import * as path from 'path';
import {  defaultExtension } from '../Structure/Constants'

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

export function resolveImport(fileDirectory: string, importFile: string): string
{
    if (importFile.indexOf("./") == 0 || importFile.indexOf("../") == 0)
    {
        importFile = path.resolve(fileDirectory, importFile);

        var fileExtensionRegex = /.*\/*.*\..+/g;
        var result = importFile.match(fileExtensionRegex);
        if (result === null)
        {
            importFile += defaultExtension;
        }
    }

    return importFile;
}

export function recurseFolders(dir : string, filelist: string[]) : string[]
{
    let files :string[] = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file : string)
    {
        if (fs.statSync(dir + file).isDirectory())
        {
            filelist = recurseFolders(dir + file + '/', filelist);
        }
        else if (file.match(/.*\.js$/))
        {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

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

