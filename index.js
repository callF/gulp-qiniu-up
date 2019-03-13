'use strict';

const through = require('through2');
const PluginError = require('gulp-util').PluginError;
const colors = require('gulp-util').colors;
const log = require('gulp-util').log;
const qn = require('qn');
const merge = require('merge');
const path = require('path');
const async = require('async');

module.exports = function (options) {
  return through.obj(function (file, enc, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    options = merge({
      prefix: '',
      forceUpload: false
    }, options);

    if (!options.qiniu) {
      return callback(null, file);
    }

    const qiniuConfig = options.qiniu;

    const origin = qiniuConfig.domain || qiniuConfig.origin || '';
    if (!origin) {
      log('Error', colors.red(new PluginError('gulp-qiniu-up', new Error('`gulp-qiniu-up` package: The lost qiniu.domain argument.')).message));
      return callback(null, file);
    }

    const client = qn.create(options.qiniu);
    const fileName = path.basename(file.path);
    const fileKey = options.prefix + fileName;
    const forceUpload = options.forceUpload;

    if (forceUpload) {
      async.auto({
        delete: function (cb) {
          client.delete(fileKey, function (err) {
            if (err) {
							cb(null, false)
							log('Deleting file seems not completed (this file might not exist on Qiniu): '+colors.red(fileKey))
            } else {
              log('Start forcing upload file: ', colors.green(fileKey));
              cb(null, true)
            }
          })
        },
        upload: ['delete', function (results, cb) {
          client.uploadFile(file.path, {
            key: fileKey,
          }, function (err, result) {
            if (err) {
              cb(err);
            } else {
              log('Force Uploaded: ', colors.green(result.url));
              file.path = result.url;
              file.websitePath = result.url;
              cb(null, result);
            }
          })
        }]
      }, function (err) {
        if (err) {
          log('Error', colors.red(new PluginError('gulp-qiniu-upload', err).message));
        }
        callback(null, file);
      });
    } else {
      async.auto({
        stat: function (cb) {
          client.stat(fileKey, function (err, stat) {
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
                log('Uploaded: ', colors.green(result.url));
                file.path = result.url;
                file.websitePath = result.url;
                cb(null, result);
              }
            })
          } else {
            cb(null);
          }
        }]
      }, function (err) {
        if (err) {
          log('Error', colors.red(new PluginError('gulp-qiniu-upload', err).message));
        }
        callback(null, file);
      });
    }
  });
};