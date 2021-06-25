module.exports = function (grunt) {

    grunt.initConfig({

        destPath: './src/main/resources/ui',

        clean: {
            options: {
                force: true
            },
            target: '<%= destPath %>'
        },

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

        handlebars: {
            options: {
                namespace: false,
                amd: ['handlebars', 'handlebars-helpers']
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

        copy: {
            target: {
                files: [{
                    expand: true,
                    src: [
                        'index.html',
                        'js/**/*.js',
                        'img/**/*',
                        'style/**/*.svg',
                        'style/**/*.png',
                        'style/**/*',
                        'locales/**/*.json',
                        '{js,style}/**/*.map'
                    ],
                    dest: '<%= destPath %>'
                }, {
                    src: `js/integrations/${grunt.option('integration') || 'search'}.js`,
                    dest: '<%= destPath %>/js/integration.js'
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
                    'filesaver'
                ]
            },
            all: {
                expand: true,
                src: ['js/**/*.js', '!js/lib/**/*'],
                dest: '.'
            }
        },

        eslint: {
            options: {
                maxWarnings: 0,
                failOnError: true,
                maxWarnings: grunt.option('maxWarnings'),
                fix: grunt.option('fix')
            },
            files: ['js/**/*.js', './{,.}*.js', '!js/libs/**/{,.}*']
        }
    });

    require('jit-grunt')(grunt);

    grunt.registerTask('default', [
        'clean',
        'amdcheck',
        'eslint',
        'handlebars',
        'less',
        'copy'
    ]);
};
