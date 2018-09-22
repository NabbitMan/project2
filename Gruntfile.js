module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    var config = {
        mkdir: {
            tmp: {
                options: {
                    create: ['tmp']
                }
            }
        },
        gitclone: {
            hterm: {
                options: {
                    cwd: './tmp',
                    repository: 'https://chromium.googlesource.com/apps/libapps'
                }
            }
        },
        shell: {
            build_hterm: {
                command: 'LIBDOT_SEARCH_PATH=$(pwd) ./libdot/bin/concat.sh -i ./hterm/concat/hterm_all.concat -o ../../public/wetty/hterm_all.js',
                options: {
                    execOptions: {
                        cwd: './tmp/libapps'
                    }
                }
            }
        },
        clean: ['./tmp'],
        copy: {
            js: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['node_modules/bootstrap/dist/js/*'],
                        dest: 'public/wetty/bootstrap/js/' 
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['node_modules/jquery/dist/*'],
                        dest: 'public/wetty/jquery/' 
                    }
                ]
            },
            css: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['node_modules/bootstrap/dist/css/*'],
                        dest: 'public/wetty/bootstrap/css/'
                    }
                ]
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask('update-hterm', ['mkdir:tmp', 'gitclone:hterm', 'shell:build_hterm', 'clean']);

    grunt.loadNpmTasks('grunt-contrib-copy');
};
