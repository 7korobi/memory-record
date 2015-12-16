gulp = require 'gulp'
$ = require('gulp-load-plugins')()

pkg = require './package.json'
banner = """
/**
 <%= pkg.name %> - <%= pkg.description %>
 @version v<%= pkg.version %>
 @link <%= pkg.repository.url %>
 @license <%= pkg.license %>
**/


"""

gulp.task "default", ["browser:sync"], ->
  gulp.watch "src/*.coffee", ["make"]
  gulp.start [
    "make"
  ]

gulp.task "make", ->
  gulp
  .src "src/*.coffee"
  .pipe $.coffee()
  .pipe $.concat "memory-record.js"
  .pipe $.header banner, {pkg}
  .pipe gulp.dest "."
