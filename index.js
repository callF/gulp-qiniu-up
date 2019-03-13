'use strict';

const through = require('through2');
const PluginError = require('gulp-util').PluginError;
const colors = require('gulp-util').colors;
const log = require('gulp-util').log;
const qn = require('qn');
const merge = require('merge');
const path = require('path');
const async = require('async');

module.exports = function(options) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    options = merge({
      prefix: ''
    }, options);

    if (!options.qiniu) {
      return callback(null, file);
    }

    const qiniuConfig = options.qiniu;

    const origin = qiniuConfig.domain || qiniuConfig.origin || '';
    if (!origin) {
      log('Error', colors.red(new PluginError('gulp-qn-upload', new Error('`gulp-qn-upload` package: The lost qiniu.domain argument.')).message));
      return callback(null, file);
    }

    const client = qn.create(options.qiniu);
    const fileName = path.basename(file.path);
    const fileKey = options.prefix+"/"+fileName;

    async.auto({
      stat: function(cb) {
        client.stat(fileKey, function(err, stat) {
          if (err) {
            cb(null, true);
          } else {
            const joinPath = origin + '/' + fileKey;
            file.path = joinPath;
            file.websitePath = joinPath;
            log('Skip:', colors.gray(fileName));
            cb(null, false);
          }
        })
      },
      upload: ['stat', function (results, cb) {
        if (results.stat) {
          client.uploadFile(file.path, {
            key: fileKey,
          }, function (err, result) {
            if (err) {
              cb(err);
            } else {
              log('Upload: ', colors.green(result.url));
              file.path = result.url;
              file.websitePath = result.url;
              cb(null, result);
            }
          })
        } else {
          cb(null);
        }
      }]
    }, function(err) {
      if (err) {
        log('Error', colors.red(new PluginError('gulp-qn-upload', err).message));
      }

      callback(null, file);
    })
  });
};
