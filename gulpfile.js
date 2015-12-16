(function() {
  var $, gulp;

  gulp = require('gulp');

  $ = require('gulp-load-plugins')();

  gulp.task("default", ["browser:sync"], function() {
    gulp.watch("*.coffee", ["make"]);
    return gulp.start(["make"]);
  });

  gulp.task("make", function() {
    return gulp.src("*.coffee").pipe($.coffee()).pipe(gulp.dest("."));
  });

}).call(this);
