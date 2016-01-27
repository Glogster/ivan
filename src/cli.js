#!/usr/bin/env node

const yargs = require('yargs');
const ivan = require('./index');

if (yargs.argv._.length === 0) {
  console.error('ivan');
  console.error(' --username=<username>');
  console.error(' --apiKey=<apiKey>');
  console.error(' --container=<container>');
  console.error(' --publicUrl=<publicUrl>');
  console.error(' <dir or file>');
  process.exit(0);
}

ivan.artifacts.apply(null, [yargs.argv].concat(yargs.argv._))
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error('An error occurred:');
    console.error(error);
  });
