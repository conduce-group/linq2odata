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

var getODataProviders = require('./scourer').getODataProviders;
var substituteInFilter = require('./scourer').substituteInFilter;

var providers = getODataProviders(argv.o);
substituteInFilter(argv.s, providers);