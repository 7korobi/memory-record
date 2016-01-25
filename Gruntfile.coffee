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
      files: ['{src,test}/**/*.coffee']
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

    "mocha-chai-sinon":
      build:
        src: ['test/**/*.coffee']
        options:
          ui: 'bdd'
          reporter: 'list'

  config.coffee.src.files["#{pkg.name}.js"] =  ["src/**/_*.coffee", "src/**/*.coffee"]
  config.uglify.js.files["#{pkg.name}.min.js"] = ["#{pkg.name}.js"]
  config.usebanner.js.files.src = ["#{pkg.name}.js"]
  grunt.initConfig config


  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-banner'
  grunt.loadNpmTasks "grunt-mocha-chai-sinon"

  grunt.task.registerTask "default", ["make", "spec", "watch"]
  grunt.task.registerTask "make", ["coffee", "uglify", "usebanner"]
  grunt.task.registerTask "spec", ["mocha-chai-sinon"]
