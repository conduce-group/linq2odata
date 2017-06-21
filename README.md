# Linq 2 OData  
A simplistic script to replace your TypeScript written linq with odata filter.  

## How  
0. Put in your `package.json` :  `"linq2odata": "conduce-group/linq2odata"`
1. Import ODataProvider to your class 
	+ [Implementing the `GetFromQuery(query :string)` method (this should do the request to your OData Endpoint, adding query to the end of your request)]
2. You're ready to use most of the functionality!

### For use of `Where` and Predicates  
As part of your build process run:  
   `node ./node_modules/.bin/linq2odata -o <ODataProvider/Extendees/Directory> -s <Directory/Using/ODataProviders>`  
   `-h` for help


## Features  
+ `filter(filterQuery: string)`
+ `top(topQuery: number)`
+ `skip(skipQuery: number)`
+ `count()`
+ `orderby(field: string)`
+ `Where(predicate: {(T) => boolean})`
    - `==`
    - `!=`
    - `>`
    - `>=`
    - `<`
    - `<=`

## Why
Easier to type Linq than lookup filter protocol, no? 

### But why as a macro for Where  
Two reasons:
1. Linq requires compilation/transpilation, starting a compiler/esprima at runtime ain't great on the ol' CPU  
2. As you need some dynamic scoping to access those variables that you can get to in the linq via closure, if it wasn't done compile time you'd need some runtime eval like so:  
```
let titleIWant : string = "someTitle";
let newFnc = new Function(Linq2OData.Where<SomeModel>(x => x.Title == titleIWant));
var g_ = eval("(" + String(newFnc) + ")");
g_();
```

## How is it done
It looks over the `-o` folder recursively finding all those who extend ODataProvider, or who extend and extendee or who extendee an extendee of an extendee etc.. Then it'll search over `-s` folder recursively looking for those who import an extendee and use `.Where` on __any__ variable. These will be replaced by `.filter()` statements.

### Assumptions
0. That everything is in scope always. Yeah, that's bad - make a pull request. So naming another variable the same name with the same `Where` will get linq2odata confused
1. Constants:
    - Import `ODataProvider` from 'linq2odata/dist/ODataProvider' [see Constants.ts to change]
    - Use require to import into a variable that is used [used in `FileParser::getNameAndLineODPImport`]
    - Default file ending of `.js` [see Constants.ts to change]
3. That relative file imports are done starting with "./" or "../"
4. Currently, that your ODataProvider is injected via by Angular2 method
5. Currently, that you do not use multiple declarations of classes on one line

## Todo
- [ ] Deal with multiple definitions in same file
- [ ] ensure replacement on correct object type 
    - [ ] Test non Angular2 Where replacement
- [ ] better checking of lines
  + iterate over all declarations instead of assuming it's in first one of line
  + ensure that a class has class-y things in it
- [ ] null checking TS
