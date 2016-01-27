const Promise = require('bluebird');
const request = require('request');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mime = require('./mimeType');

const apiUrl = 'https://identity.api.rackspacecloud.com/v2.0/tokens';

function auth(json) {

  const url = json.access.serviceCatalog
    .filter((row) => row.name === 'cloudFiles')[0].endpoints
    .filter((row) => row.region === 'ORD')[0].publicURL;

  return {
    token: json.access.token.id,
    url: url
  };
}

function init(config) {
  return new Promise((resolve, reject) => {
    request(
      {
        method: 'POST',
        url: apiUrl,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({auth: {'RAX-KSKEY:apiKeyCredentials': {username: config.username, apiKey: config.apiKey}}})
      },
      (error, response, body) => {
        if (error || response.statusCode !== 200)
          reject(error || response.statusCode);
        else
          resolve(Object.assign(config, auth(JSON.parse(body))));
      }
    );
  });
}

function getObjectMetadata(config, file, fileId) {
  return new Promise((resolve, reject) => {
    request(
      {
        method: 'HEAD',
        url: objectUrl(config, file, fileId),
        headers: {'X-Auth-Token': config.token}
      },
      (error, response) => {
        if (error)
          reject(error);
        else
          resolve(response.statusCode);
      }
    );
  });
}

function uploadObject(config, file, fileId) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file).pipe(request(
      {
        method: 'PUT',
        url: objectUrl(config, file, fileId),
        headers: {
          'X-Auth-Token': config.token,
          'Content-Type': mime.getMimeTypeByExtension(path.extname(file).substr(1))
        }
      },
      (error, response, body) => {
        if (error)
          reject(error);
        else
          resolve(response.statusCode);
      }
    ));
  });
}

function objectUrl(config, file, fileId) {
  return config.url + '/' + config.container + '/' + fileId + path.extname(file);
}

function objectPublicUrl(config, file, fileId) {
  return url.resolve(config.publicUrl, '/' + fileId + path.extname(file));
}

module.exports = {
  init,
  getObjectMetadata,
  uploadObject,
  objectPublicUrl
};
