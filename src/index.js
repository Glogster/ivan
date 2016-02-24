const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const md5File = require('md5-file');
const walk = require('walk');
const cdn = require('./cdn');

const encoding = 'utf8';
const error = Symbol('ERROR');

function log(verboseLevel, minVerboseLevel, message) {
  if (verboseLevel >= minVerboseLevel)
    console.error(message);
}

function defaultKeyMaker(key) {
  return '{$' + key + '}';
}

function defaultValueMaker(value) {
  return value;
}

function assign(template, assigns, keyMaker, valueMaker) {
  keyMaker = keyMaker || defaultKeyMaker;
  valueMaker = valueMaker || defaultValueMaker;

  return Array.isArray(assigns)
    ? assigns.reduce(
        (template, assign) => template.replace(keyMaker(assign[0]), valueMaker(assign[1])),
        template
      )
    : Object.keys(assigns).reduce(
        (template, key) => template.replace(keyMaker(key), valueMaker(assigns[key])),
        template
      );
};

function assignInFile(file, assigns, keyMaker, valueMaker) {
  return fs.readFileAsync(file, encoding)
    .then((content) => assign(content, assigns, keyMaker, valueMaker))
    .then((content) => fs.writeFileAsync(file, content, encoding));
}

function md5FileHash(file) {
  return new Promise((resolve, reject) => {
    md5File(file, (error, hash) => {
      if (error)
        reject(error);
      else
        resolve(hash);
    });
  });
}

function artifacts(config) {

  const args = Array.prototype.slice.call(arguments);
  const verbose = config.verbose;

  return new Promise((resolve, reject) => {

    const dirs = args.slice(1);

    var dirsWalked = 0;
    var files = {};
    var success = 0;
    var errors = 0;

    function complete() {
      if (dirs.length === dirsWalked
        && success + errors === Object.keys(files).length) {
        errors === 0
          ? resolve(files)
          : reject(files)
      }
    }

    cdn.init(config)
      .then((config) => {
        dirs.forEach((dir) => {
          const walker = walk.walk(dir);
          walker.on('file', (root, stats, next) => {
            const file = path.join(root, stats.name);
            files[file] = null;
            log(verbose, 2, 'File ' + file + ' started processing.');

            md5FileHash(file)
              .then((hash) => {
                return cdn.getObjectMetadata(config, file, hash)
                  .then((status) => {
                    if (status === 200) {
                      log(verbose, 2, 'file ' + file + ' already exists, skipping.');
                      return hash;
                    }
                    if (status === 404) {
                      log(verbose, 2, 'File ' + file + ' doesn\'t exist, uploading.');
                      return cdn.uploadObject(config, file, hash)
                        .then((status) => {
                          if (status === 201) {
                            log(verbose, 1, 'File ' + file + ' uploaded.');
                            return hash;
                          }
                          return error;
                        });
                    }
                    return error;
                  });
              })
              .then((result) => {
                if (result === error) {
                  log(verbose, 2, 'File ' + file + ' errored.');
                  errors = errors + 1;
                } else {
                  log(verbose, 2, 'File ' + file + ' successfully processed.');
                  success = success + 1;
                  files[file] = cdn.objectPublicUrl(config, file, result);
                }

                complete();
              })
              .catch(() => {
                log(verbose, 2, 'File ' + file + ' errored.');
                errors = errors + 1;
                complete();
              });

            next();
          });
          walker.on('end', () => {
            dirsWalked++;
            complete();
          });
        });
      })
      .catch(reject);
  });

}

module.exports = {
  assign,
  assignInFile,
  artifacts
};
