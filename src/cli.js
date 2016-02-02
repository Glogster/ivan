#!/usr/bin/env node

const argv = require('yargs')
  .count('verbose')
  .alias('v', 'verbose')
  .argv;
const ivan = require('./index');

if (argv._.length === 0) {
  console.error('ivan');
  console.error(' -v');
  console.error(' --username=<username>');
  console.error(' --apiKey=<apiKey>');
  console.error(' --container=<container>');
  console.error(' --publicUrl=<publicUrl>');
  console.error(' <dir or file>');
  process.exit(0);
}

ivan.artifacts.apply(null, [argv].concat(argv._))
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error('An error occurred:');
    console.error(error);
  });
