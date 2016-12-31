banner = """
  /**
   <%= pkg.name %> - <%= pkg.description %>
   @version v<%= pkg.version %>
   @link <%= pkg.repository.url %>
   @license <%= pkg.license %>
  **/


"""

module.exports = (grunt)->
  pkg = grunt.file.readJSON 'package.json'
  config =
    pkg: pkg

    watch:
      files: ['{src,test}/**/*.coffee', 'package.json']
      tasks: ['make', 'spec']

    coffee:
      src:
        options:
          bare: false
        files: {}

    usebanner:
      js:
        options:
          position: "top"
          banner: banner
          linebreak: true
        files:
          src: []

    uglify:
      js:
        options:
          banner: banner
          compress:
            dead_code: false
          sourceMap: true
        files: {}

    mochaTest:
      test:
        options:
          reporter: "min"
          require: "intelli-espower-loader"
        src: ["test-espower/**/*.js"]

  config.coffee.src.files["#{pkg.name}.js"] = ["src/**/*.coffee"]
  config.coffee.src.files["test-espower/mocha.js"] = ["test/**/*.coffee"]

  config.uglify.js.files["#{pkg.name}.min.js"] = ["#{pkg.name}.js"]
  config.usebanner.js.files.src = ["#{pkg.name}.js"]
  grunt.initConfig config

  for task, ver of pkg.devDependencies when task[..5] == "grunt-"
    grunt.loadNpmTasks task

  grunt.task.registerTask "default", ["make", "spec", "watch"]
  grunt.task.registerTask "make", ["coffee", "uglify", "usebanner"]
  grunt.task.registerTask "spec", ["mochaTest"]
