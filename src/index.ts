#!/usr/bin/env node
import { Logger } from './Structure/Logger';
import { getODataProviders } from './Operations/ProviderSearch';
import { replaceWhereWithFilter } from './Operations/Replace';

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
        default: 0,
        describe: 'Console verbosity: 0 - only errors, 1 - file by file replacement summaries, 2 - ODPs found and file by file changes'
    })
    .option('d', {
        type: 'boolean',
        alias: 'dry-run',
        default: false,
        describe: 'Run making no changes to files, you should set verbosity to 2 in order to see a useful output'
    })
    .help('h')
    .alias('h', 'help')
    .argv;

let dryRun: boolean = argv.d ? true : false;

if (typeof (argv.v) !== "number" || isNaN(argv.v) )
{
    console.log("Verbosity must be a number");
    process.exit(-1);
}

let logger: Logger = new Logger(argv.v);

var providers = getODataProviders(argv.o, logger);
replaceWhereWithFilter(argv.s, providers, logger, dryRun);

process.exit(0);