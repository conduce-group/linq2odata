#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: linq2odata -o [dir] -s [dir]')
  .demandOption(['o','s'])
  .alias('o', 'odata-dir')
  .alias('s', 'scour-dir')
  .describe('o', 'OData providers directory')
  .describe('s', 'Directory to scour and replace in')
  .nargs('out-file', 1)
  .nargs('out-dir', 1)
  .help('h')
  .alias('h', 'help')
  .argv;

var getODataProviders = require('../dist/ProviderSearch').getODataProviders;
var replaceWhereWithFilter = require('../dist/Replace').replaceWhereWithFilter;

var providers = getODataProviders(argv.o);
replaceWhereWithFilter(argv.s, providers);


//var parser = require("shift-parser").parseScript;
//var scoper = require("shift-scope");
//var fs = require( 'fs');


//function scopeIT(directory)
//{
//    let files = fs.readdirSync(directory);
//    for (var index in files)
//    {
//        let fileContent = fs.readFileSync(directory + files[index]).toString();
//        let scopeTree = scoper.analyze(parser(fileContent));
//        debugger;
    
//    }

//}
//scopeIT(argv.o);