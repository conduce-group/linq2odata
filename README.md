# Linq 2 OData  
A simplistic script to replace your TypeScript written linq with odata filter.  
See Section 'How is it done' why you should not use this yet.

## Why?  
Easier to type Linq than lookup filter protocol, no?

### But why as a macro  
Two reasons:
1. Linq requires compilation/transpilation, starting a compiler/esprima at runtime ain't great on the ol' CPU  
2. As you need some dynamic scoping to access those variables that you can get to in the linq via closure, if it wasn't done compile time you'd need some runtime eval like so:  
```
let titleIWant : string = "someTitle";
let newFnc = new Function(Linq2OData.Where<SomeModel>(x => x.Title == titleIWant));
var g_ = eval("(" + String(newFnc) + ")");
g_();
```

## How  
Import ODataProvider to your class and implement the `GetFromQuery(query :string)` method to do the request to your OData Endpoint, adding query to the end of your request.

## Features  
- ==
- !=
- >
- >=
- <
- <=

## How is it done
Currently, messily. This should not be used in any serious projects in it's current state due to the relative unsafe nature of how it assumes class files are separated, named and used.

## Assumptions
0. That everything is in scope always. Yeah, that's bad - make a pull request. So naming another variable the same naem with the same Where will get linq2odata confused
1. You import `ODataProvider` from 'linq2odata/dist/ODataProvider' [see FileParser.ts constants to change]
2. You use require to import into a variable that is used [used in `FileParser::getNameAndLineODPImport`]
3. Currently, that your ODataProvider is injected via by Angular2 method
4. Currently, that you do not extend to use parent's definition of an ODP

## Todo
- [ ] MVP
  + [ ] Replace Where clause at least once
  + [ ] Add basic querying options, top, count, etc
  + [ ] split out file parsers
- [ ] Non Angular2 Where replacement
- [ ] allow parent extending
- [ ] lazy eval??
