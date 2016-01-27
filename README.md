# Иван

> Immutable assets

## Installation

```bash
$ npm i git+ssh://git@github.com:Glogster/ivan.git
```

## Usage

From command line:

```bash
# to upload artifacts
$ ./node_modules/.bin/ivan
```

From javascript:

```javascript
const ivan = require('ivan');

// to upload artifacts
ivan.artifacts(config, './assets', './docs').then(...);

// to assign variables
ivan.assign('hi, {$foo}', {foo: 'bar'});

// to assign variables in file (will modify!)
ivan.assignInFile('./template', {foo: 'bar'}).then(...);
```
