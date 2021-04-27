module.exports = function (grunt) {

    /** ================================================
     *  Project configuration
     ==================================================*/
    grunt.initConfig({
        /** The current target file for the watch tasks */
        currentWatchFile: '',

        /** Local directory for the tests */
        webServerDir: 'www',

        tempDir: 'target/temp',

        /** Paths for the different types of ressource */
        srcPath: {
            js: 'js/**/*.js',
            less: 'style/**/*.less',
            html: '**/*.html',
            tmpl: 'templates/*.tmpl',
            www: '<%= webServerDir %>/**/*',
            locales: 'locales/**/*.json'
        },

        profiles: {
            // Default profile if no one is given
            default: 'local',

            integration: {
                target: '../opencast-backend/annotation-tool/src/main/resources/ui/',
                integration: `build/integration/${grunt.option('integration') || 'search'}.js`
            },

            local: {
                target: '<%= webServerDir %>',
                integration: 'build/integration/local.js'
            },
        },

        currentProfile: {},

        /** Task to watch src files and process them */
        watch: {
            options: {
                nospawn: true
            },
            // Watch Javascript files
            js: {
                files: ['<%= srcPath.js %>'],
                tasks: ['copy:target']
            },
            // Watch configuration files
            config: {
                files: ['build/config/annotation-tool-configuration.js'],
                tasks: ['copy:config']
            },
            // Watch integration files
            integration: {
                files: ['<%= currentProfile.integration %>'],
                tasks: ['copy:integration']
            },
            // Watch Templates files
            templates: {
                files: ['<%= srcPath.tmpl %>'],
                tasks: ['handlebars:target']
            },
            // Watch HTML files
            html: {
                files: ['<%= srcPath.html %>'],
                tasks: ['processhtml:index']
            },
            // Watch LESS files
            less: {
                files: ['<%= srcPath.less %>'],
                tasks: ['less', 'copy:less']
            },
            // Watch the LESS, Javascript, Templates and HTML at the same times
            // Use it for single core processor. It could stop working with an important number of files
            multiple: {
                files: ['<%= srcPath.less %>', '<%= srcPath.js %>', '<%= srcPath.html %>', '<%= srcPath.tmpl %>'],
                tasks: ['copy:target']
            },
            locales: {
                files: ['<%= srcPath.locales %>'],
                tasks: ['copy:locales']
            },
            // Watch file on web server for live reload
            www: {
                options: {
                    livereload: true,
                    nospawn: true
                },
                files: ['<%= srcPath.www %>']
            }
        },

        /** Compile the less files into a CSS file */
        less: {
            options: {
                paths: 'style',
                syncImport: true,
                compress: true,
                sourceMap: true,
                sourceMapURL: '/style/style.css.map',
                sourceMapBasepath: 'style'
            },
            files: {
                src: 'style/style.less',
                dest: '<%= currentProfile.target %>/style/style.css'
            }
        },

        /** Pre-compile the handlebars templates */
        handlebars: {
            target: {
                options: {
                    namespace: false,
                    amd: true
                },
                files: [{
                    ext: '.js',
                    flatten: false,
                    expand: true,
                    src: '<%= currentWatchFile %>',
                    dest: '<%= currentProfile.target %>',
                    filter: 'isFile'
                }]
            },

            all: {
                options: {
                    namespace: false,
                    amd: true
                },
                files: [{
                    ext: '.js',
                    flatten: false,
                    expand: true,
                    src: 'templates/*.tmpl',
                    dest: '<%= currentProfile.target %>'
                }]
            }
        },

        /** Copy .. */
        copy: {
            // ... a single file locally
            'target': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: '<%= currentWatchFile %>',
                    dest: '<%= currentProfile.target %>',
                    filter: 'isFile'
                }]
            },
            // ... all the tool files for the current profile
            'all': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            'backend': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            // ... the index locally
            'index': {
                src: 'index.html',
                dest: '<%= currentProfile.target %>/index.html'
            },
            // ... the less sources for the sourcemaps to reference during development
            'less': {
                files: [{
                    src: '<%= srcPath.less %>',
                    dest: '<%= currentProfile.target %>',
                    expand: true
                }]
            },
            // ... the integration
            'integration': {
                src: '<%= currentProfile.integration %>',
                dest: '<%= currentProfile.target %>/js/annotation-tool-integration.js'
            },
            // ... the configuration
            'config': {
                src: 'build/config/annotation-tool-configuration.js',
                dest: '<%= currentProfile.target %>/js/annotation-tool-configuration.js'
            },
            // ... the translations
            'locales': {
                files: [{
                    src: '<%= srcPath.locales %>',
                    dest: '<%= currentProfile.target %>',
                    expand: true
                }]
            }
        },

        jsdoc: {
            dist: {
                src: ['<%= srcPath.js %>', '!js/libs/**'],
                options: {
                    destination: 'doc',
                    template: 'node_modules/ink-docstrap/template'
                }
            }
        },


        /** Task to run tasks in parrallel */
        concurrent: {
            dev: (function () {
                var tasks = [
                    'watch:js',
                    'watch:config',
                    'watch:integration',
                    'watch:html',
                    'watch:less',
                    'watch:templates',
                    'watch:locales',
                    'watch:www',
                    'connect:dev'
                ];
                return {
                    tasks: tasks,
                    options: {
                        logConcurrentOutput: true,
                        limit: tasks.length
                    }
                };
            })()
        },

        /** Web server */
        connect: {
            dev: {
                options: {
                    port: 9001,
                    base: '<%= webServerDir %>',
                    keepalive: true,
                    livereload: true
                }
            }
        },

        /** Preprocess file with right context */
        processhtml: {
            index: {
                files: {
                    '<%= currentProfile.target %>/index.html': ['index.html']
                }
            }
        },

        /** Bundling through RequireJS */
        requirejs: {
            compile: {
                options: {
                    baseUrl: '<%= tempDir %>/js',
                    mainConfigFile: './js/require.config.js',
                    name: 'main',
                    optimizeAllPluginResources: false,
                    preserveLicenseComments: false,
                    optimize: 'none',
                    useStrict: true,
                    findNestedDependencies: true,
                    out: '<%= currentProfile.target %>/bundle.js'
                }
            }
        },

        /** Optimization through UglifyJS */
        uglify: {
            minify: {
                src: '<%= currentProfile.target %>/bundle.js',
                dest: '<%= currentProfile.target %>/bundle.min.js'
            }
        },

        amdcheck: {
            options: {
                strict: true,
                removeUnusedDependencies: false,
                exceptsPaths: [
                    // Loaded for side-effects only
                    'handlebarsHelpers',
                    'localstorage',
                    'jquery.colorPicker',
                    'slider',
                    'bootstrap',
                    "filesaver"
                ]
            },
            all: {
                expand: true,
                src: ['<%= srcPath.js %>', '!js/libs/**'],
                dest: '.'
            }
        }
    });

    /**
     * Set the profile in the configuration but also as a command line option,
     * so that any child processes like those spawned by the `concurrent` task
     * can pick it up, too.
     */
    function setProfile(profile) {
        var config = grunt.config.get('profiles')[profile];
        if (!config) {
            grunt.fail.fatal('The profile "' + profile + '" does not exist in the Gruntfile.');
        }
        grunt.config.set('currentProfile', config);
        grunt.option('profile', profile);
    }
    var profile = grunt.option('profile');
    if (profile) setProfile(profile);

    require('jit-grunt')(grunt);

    /** ================================================
     *  Register custom tasks
     ==================================================*/

    grunt.registerTask('baseDEV', ['handlebars:all', 'less', 'copy:all', 'processhtml:index', 'copy:less', 'copy:config', 'copy:integration', 'copy:locales', 'concurrent:dev']);
    grunt.registerTask('baseINTEGRATION', ['amdcheck', 'handlebars:all', 'less', 'copy:backend', 'processhtml:index', 'copy:config', 'copy:integration', 'copy:locales']);

    grunt.registerTaskWithProfile = function (name, description, profile) {
        grunt.registerTask(name, description, function () {

            // Configure the tasks with given profiles
            if (!profile) profile = grunt.config.get("profiles.default");
            setProfile(profile);
            grunt.log.writeln(name + ' task with profile "' + profile + '" started! ');

            // Run the tasks
            grunt.task.run('base' + name.toUpperCase());
        });
    };

    grunt.registerTaskWithProfile('integration', 'Deploy webapp in Opencast backend', 'integration');
    grunt.registerTaskWithProfile('dev', 'Development workflow');


    /** ================================================
     *  Listerers
     ==================================================*/

    // on watch events configure tasks to only run on changed file
    grunt.event.on('watch', function (action, filepath, target) {

        // Set the current file processed for the different tasks
        grunt.config.set('currentWatchFile', [filepath]);

        // Configure the tasks with given profiles
        grunt.config.set('currentProfile', grunt.config.get('profiles.' + grunt.option('profile')));

        if (target == 'multiple') {
            // If the watch target is multiple,
            // we manage the tasks to run following the touched file extension
            var ext = filepath.split('.').pop();

            if (ext === 'less') {
                grunt.task.run('less');
                grunt.task.run('copy:less');
            }
        }
    });
};
