#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var Logger_1 = require("./Structure/Logger");
var ProviderSearch_1 = require("./Operations/ProviderSearch");
var Replace_1 = require("./Operations/Replace");
var argv = require('yargs')
    .usage('Usage: linq2odata -o [dir] -s [dir]')
    .option('o', {
    type: 'string',
    alias: 'odata-dir',
    describe: 'OData providers directory',
    demand: true
})
    .option('s', {
    type: 'string',
    alias: 'scour-dir',
    describe: 'Directory to scour and replace in',
    demand: true
})
    .option('v', {
    type: 'number',
    alias: 'verbosity',
    "default": 0,
    describe: 'Console verbosity: 0 - only errors, 1 - file by file replacement summaries, 2 - ODPs found and file by file changes'
})
    .option('d', {
    type: 'boolean',
    alias: 'dry-run',
    "default": false,
    describe: 'Run making no changes to files, you should set verbosity to 2 in order to see a useful output'
})
    .help('h')
    .alias('h', 'help')
    .argv;
var dryRun = argv.d ? true : false;
if (typeof (argv.v) !== "number" || isNaN(argv.v)) {
    console.log("Verbosity must be a number");
    process.exit(-1);
}
var logger = new Logger_1.Logger(argv.v);
var providers = ProviderSearch_1.getODataProviders(argv.o, logger);
Replace_1.replaceWhereWithFilter(argv.s, providers, logger, dryRun);
process.exit(0);
