# gulp-qiniu-up

## 概述 Summary

该工具允许你在Gulp中上传文件至七牛对象存储。
This tool allow you upload your files to Qiniu OSS in gulp.

修复了原工具gulp-qn-upload的一个会造成路径错误的问题。
Fixed a bug in the original tool gulp-qn-upload that caused a path error.

## 用法 Usage

```javascript
gulp.task('taskname', function(){
    return gulp.src('filePath')
        .pipe(qn({
            qiniu: {
                accessKey: '',
                secretKey: '',
                bucket: 'bucket-name',
                origin: 'bucket-domain',
                uploadURL: 'upload-zone-url',
            },
            prefix: 'your prefix'
        }));
});
```
