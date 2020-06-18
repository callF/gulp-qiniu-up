'use strict';

const gulp = require('gulp');
const qn = require('../');
gulp.task('default', function () {
  return gulp.src('./js/*')
    .pipe(qn({
      qiniu: {
        accessKey: '',
        secretKey: '',
        bucket: '',
        origin: '7sbph3.com1.z0.glb.clouddn.com',
      },
      prefix: 'static',
    }));
});