gulp = require 'gulp'
$ = require('gulp-load-plugins')()


gulp.task "default", ["browser:sync"], ->
  gulp.watch "*.coffee", ["make"]
  gulp.start [
    "make"
  ]


gulp.task "make", ->
  gulp
  .src "*.coffee"
  .pipe $.coffee()
  .pipe gulp.dest "."
