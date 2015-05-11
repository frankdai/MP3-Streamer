module.exports = function(grunt) {
  grunt.initConfig({
    concat:{
      option:{
        separator:";"
      },
      dist:{
        src:['./asset/zepto.js','./asset/underscore.js','./asset/backbone.js'],
        dest:'./asset/resources.js'
      }
    },
    uglify:{
      build:{
        files:{
          './asset/app.min.js':'./asset/app.js'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['concat','uglify']);
};