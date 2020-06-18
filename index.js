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
      return callback();
    }

    options = merge({
      prefix: ''
    }, options);

    if (!options.qiniu) {
      return callback();
    }

    const qiniuConfig = options.qiniu;

    const origin = qiniuConfig.domain || qiniuConfig.origin || '';
    if (!origin) {
      log('Error', colors.red(new PluginError('gulp-qn-upload', new Error('`gulp-qn-upload` package: The lost qiniu.domain argument.')).message));
      return callback();
    }

    const client = qn.create(options.qiniu);
    const fileName = path.basename(file.path);
    const fileKey = path.join(options.prefix, fileName);

    async.auto({
      stat: function(cb) {
        client.stat(fileKey, function(err, stat) {
          if (err) {
            cb();
          } else {
            file.path = origin + '/' + fileKey;
            log('Skip:', colors.gray(fileName));
            cb();
          }
        })
      },
      upload: ['stat', function (results, cb) {
        if (results.stat) {
          client.uploadFile(file.path, {
            key: fileKey,
          }, function (err, result) {
            if (err) {
              cb();
            } else {
              log('Upload: ', colors.green(result.url));
              file.path = result.url;
              cb();
            }
          })
        } else {
          cb();
        }
      }]
    }, function(err) {
      if (err) {
        log('Error', colors.red(new PluginError('gulp-qn-upload', err).message));
      }

      callback();
    })
  });
};
