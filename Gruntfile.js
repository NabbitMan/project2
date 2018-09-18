module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    var config = {        
        copy: {
            js: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['node_modules/bootstrap/dist/js/*'],
                        dest: 'public/wetty/js/' 
                    }
                ]
            },
            css: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['node_modules/bootstrap/dist/css/*'],
                        dest: 'public/wetty/css/' 
                    }
                ]
            }
        }
    };

    grunt.initConfig(config);
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['copy:js', 'copy:css']);

    
};
