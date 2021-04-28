module.exports = function (grunt) {

    /** ================================================
     *  Project configuration
     ==================================================*/
    grunt.initConfig({
        /** Local directory for the tests */

        /** Paths for the different types of ressource */
        srcPath: 'js/**/*.js',
        destPath: '../opencast-backend/annotation-tool/src/main/resources/ui/',

        clean: {
            options: {
                force: true
            },
            target: '<%= destPath %>'
        },

        /** Compile the less files into a CSS file */
        less: {
            options: {
                paths: 'style',
                syncImport: true,
                compress: true,
                sourceMap: true,
                sourceMapURL: 'style/style.css.map',
                sourceMapBasepath: 'style'
            },
            '<%= destPath %>/style/style.css': 'style/style.less'
        },

        /** Pre-compile the handlebars templates */
        handlebars: {
            options: {
                namespace: false,
                amd: ['handlebars', 'handlebarsHelpers']
            },
            compile: {
                files: [{
                    ext: '.js',
                    expand: true,
                    src: 'templates/*.tmpl',
                    dest: '<%= destPath %>'
                }]
            }
        },

        /** Copy .. */
        copy: {
            target: {
                files: [{
                    expand: true,
                    src: [
                        'index.html',
                        '<%= srcPath %>',
                        'img/**/*',
                        'style/**/*.svg',
                        'style/**/*.png',
                        'style/**/*',
                        'locales/**/*.json'
                    ],
                    dest: '<%= destPath %>'
                }, {
                    src: `build/integration/${grunt.option('integration') || 'search'}.js`,
                    dest: '<%= destPath %>/js/annotation-tool-integration.js'
                }, {
                    src: 'build/config/annotation-tool-configuration.js',
                    dest: '<%= destPath %>/js/annotation-tool-configuration.js'
                }]
            }
        },

        amdcheck: {
            options: {
                strict: true,
                removeUnusedDependencies: false,
                exceptsPaths: [
                    // Loaded for side-effects only
                    'localstorage',
                    'jquery.colorPicker',
                    'slider',
                    'bootstrap',
                    "filesaver"
                ]
            },
            all: {
                expand: true,
                src: ['<%= srcPath %>', '!js/libs/**'],
                dest: '.'
            }
        }
    });

    require('jit-grunt')(grunt);

    /** ================================================
     *  Register custom tasks
     ==================================================*/

    grunt.registerTask('default', ['clean', 'amdcheck', 'handlebars', 'less', 'copy']);
};
