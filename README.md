# Linq 2 OData  
A script to replace your TypeScript written linq with odata filter.  
See Section 'How' why you should not use this yet.

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
Currently, messily. This should not be used in any serious projects in it's current state due to the relative unsafe nature of how it assumes class files are separated, named and used.
