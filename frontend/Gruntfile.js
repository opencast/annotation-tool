module.exports = function (grunt) {

    /** ================================================
     *  Project configuration
     ==================================================*/
    grunt.initConfig({
        /** Load informations from package.json */
        pkg: grunt.file.readJSON('package.json'),

        /** The current target file for the watch tasks */
        currentWatchFile: '',

        /** Local directory for the tests */
        webServerDir: 'www',

        buildDir: 'target',
        tempDir: '<%= buildDir %>/temp',

        /** Paths for the different types of ressource */
        srcPath: {
            js      : 'js/**/*.js',
            test_js : 'tests/js/**/*.js',
            less    : 'style/**/*.less',
            html    : '**/*.html',
            tmpl    : 'templates/*.tmpl',
            tests   : 'tests/',
            www     : '<%= webServerDir %>/**/*',
            locales : 'locales/**/*.json'
        },

        profiles: {
            // Default profile if no one is given
            default: 'local',

            integration: {
                target  : '../opencast-backend/annotation-tool/src/main/resources/ui/',
                config  : 'build/profiles/integration/annotation-tool-configuration.js'
            },

            local: {
                target : '<%= webServerDir %>',
                config : 'build/profiles/local/annotation-tool-configuration.js'
            },

            build: {
                target : '<%= buildDir %>',
                config : 'build/profiles/local/annotation-tool-configuration.js'
            },

            demo: {
                target : '/var/www/html/annotation/',
                config : 'build/profiles/local/annotation-tool-configuration.js'
            }
        },

        currentProfile: {},

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all    : ['Gruntfile.js', '<%= srcPath.js %>'],
            watch  : '<%= currentWatchFile %>'
        },

        /** Task to watch src files and process them */
        watch: {
            options: {
                nospawn: true
            },
            // Watch Javascript files
            js: {
                files: ['<%= srcPath.js %>', '<%= srcPath.test_js %>'],
                tasks: ['copy:target']
            },
            // Watch configuration files
            config: {
                files: ['<%= currentProfile.config %>'],
                tasks: ['copy:config']
            },
            // Watch Templates files
            templates: {
                files: ['<%= srcPath.tmpl %>'],
                tasks: ['handlebars:target']
            },
            // Watch HTML files
            html: {
                files: ['<%= srcPath.html %>'],
                tasks: ['processhtml:dev']
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
                version: 'node_modules/less',
                syncImport: true,
                compress: true,
                sourceMap: { outputSourceFiles: true },
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
                    flatten : false,
                    expand  : true,
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
                    flatten : false,
                    expand  : true,
                    src: 'templates/*.tmpl',
                    dest: '<%= currentProfile.target %>'
                }]
            },

            temp: {
                options: {
                    namespace: false,
                    amd: true
                },
                files: [{
                    ext: '.js',
                    flatten : false,
                    expand  : true,
                    src: 'templates/*.tmpl',
                    dest: '<%= tempDir %>'
                }]
            }
        },

        /** Copy .. */
        copy: {
            options: {
                processContent: function (content, srcPath) {
                    if (srcPath === 'js/version.js') {
                        return grunt.template.process(content, { data: { version: grunt.config.get('pkg').version } });
                    }
                    return content;
                },
                processContentExclude: ['img/**/*']
            },
            // ... a single file locally
            'target': {
                files: [{
                    flatten : false,
                    expand  : true,
                    src     : '<%= currentWatchFile %>',
                    dest    : '<%= currentProfile.target %>',
                    filter  : 'isFile'
                }]
            },
            // ... all the tool files locally
            'local-all': {
                files: [{
                    flatten : false,
                    expand  : true,
                    src     : ['js/**/*', 'img/**/*', 'style/**/.svg', 'style/**/*.png', 'style/**/*.css', 'tests/**/*'],
                    dest    : '<%= currentProfile.target %>'
                }]
            },
            // ... the index locally
            'local-index': {
                src: 'index.html',
                dest: '<%= webServerDir %>/index.html'
            },
            // ... all the tool files for the current profile
            'all': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css', 'tests/**/*'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            // ... all the files for an optimized build
            'build': {
                files: [{
                    flatten: false,
                    expand: true,
                    // TODO Do we need to copy libs here?
                    src: ['img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css', 'js/libs/**/*'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            // ... all the files for the demo
            'demo': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css', 'tests/**/*'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            'integration': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css', 'tests/**/*'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            // ... the index locally
            'index': {
                options: {
                    processContent: function (content) {
                        return grunt.template.process(content);
                    }
                },
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
            // ... the configuration
            'config': {
                src: '<%= currentProfile.config %>',
                dest: '<%= currentProfile.target %>/js/annotation-tool-configuration.js'
            },
            // ... code for further processing
            'temp': {
                expand: true,
                src: '<%= srcPath.js %>',
                dest: '<%= tempDir %>'
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

        blanket_qunit: {
            all: {
                options: {
                    urls: [
                        '<%= srcPath.tests %>loop.html?coverage=true&gruntReport',
                        '<%= srcPath.tests %>collections.html?coverage=true&gruntReport',
                        '<%= srcPath.tests %>models.html?coverage=true&gruntReport'
                    ],
                    threshold: 10,
                    globalThreshold: 10
                }
            }
        },

        jsdoc : {
            dist : {
                src: ['<%= srcPath.js %>', '!js/libs/**'],
                options: {
                    destination: 'doc',
                    template: 'node_modules/ink-docstrap/template'
                }
            }
        },


        /** Task to run tasks in parrallel */
        concurrent: {
            dev: {
                tasks: [
                    'watch:js',
                    'watch:config',
                    'watch:html',
                    'watch:less',
                    'watch:templates',
                    'watch:locales',
                    'watch:www',
                    'connect:dev'
                ],
                options: {
                    logConcurrentOutput: true,
                    limit: 8
                }
            }
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
            },
            build: {
                options: {
                    port: 9001,
                    base: '<%= buildDir %>',
                    keepalive: true,
                    livereload: true
                }
            }
        },

        /** Preprocess file with right context */
        processhtml: {
            options: {
                data: {
                    version: '<%= pkg.version %>'
                },
                process: true
            },
            dev: {
                files: {
                    '<%= currentProfile.target %>/index.html': ['index.html']
                }
            },
            build: {
                files: {
                    '<%= currentProfile.target %>/index.html': ['index.html']
                }
            }
        },

        /** Bundling through RequireJS */
        requirejs: {
            compile: {
                options: {
                    baseUrl                    : '<%= tempDir %>/js',
                    mainConfigFile             : './js/require.config.js',
                    name                       : 'main',
                    optimizeAllPluginResources : false,
                    preserveLicenseComments    : false,
                    optimize                   : 'none',
                    useStrict                  : true,
                    findNestedDependencies     : true,
                    out                        : '<%= currentProfile.target %>/bundle.js'
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

        mkdir: {
            demo: {
                options: {
                    create: ['<%= currentProfile.target %>']
                }
            }
        },

        gulp: {
            i18next: () => {
                const gulp = require('gulp');
                const i18next = require('i18next-parser');
                return gulp.src([
                    'index.html',
                    grunt.config.get('srcPath.js'),
                    grunt.config.get('srcPath.tmpl'),
                    '!js/libs/**/*',
                    '!js/handlebarsHelpers.js'
                ]).pipe(i18next({
                    locales: ['en', 'de'],
                    ignoreVariables: true
                })).pipe(gulp.dest('locales'));
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
            grunt.fail.fatal('The profile "' + profileName + '" does not exist in the Gruntfile.');
        }
        grunt.config.set('currentProfile', config);
        grunt.option('profile', profile);
    }
    var profile = grunt.option('profile');
    if (profile) setProfile(profile);

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.loadNpmTasks('grunt-blanket-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-gulp');
    grunt.loadNpmTasks('assemble-less');


    /** ================================================
     *  Register custom tasks
     ==================================================*/

    // Default task
    grunt.registerTask('default', ['jshint:all', 'less', 'copy:local-all', 'copy:local-index']);
    grunt.registerTask('baseDEV', ['handlebars:all', 'less', 'copy:all', 'processhtml:dev', 'copy:less', 'copy:config', 'copy:locales', 'concurrent:dev']);
    grunt.registerTask('baseDEMO', ['mkdir:demo', 'handlebars:all', 'less', 'copy:demo', 'processhtml:dev', 'copy:config', 'copy:locales']);
    grunt.registerTask('baseBUILD', [/*'blanket_qunit', */'jsdoc', 'handlebars:temp', 'less', 'copy:build', 'processhtml:build', 'copy:config', 'copy:locales', 'copy:temp', 'requirejs', 'uglify']);
    grunt.registerTask('baseINTEGRATION', ['handlebars:all', 'less', 'copy:integration', 'processhtml:dev', 'copy:config', 'copy:locales']);
    grunt.registerTask('baseINTEGRATIONMINIFIED', [/*'blanket_qunit', */'handlebars:temp', 'less', 'copy:integration', 'processhtml:build', 'copy:config', 'copy:locales', 'copy:temp', 'requirejs', 'uglify']);

    grunt.registerTaskWithProfile = function (name, description, profile) {
        grunt.registerTask(name, description, function () {

            if (grunt.option('cv')) {
                console.log('With version ' + grunt.option('cv'));
                grunt.config.set('pkg.version', grunt.option('cv'));
            }

            // Configure the tasks with given profiles
            if (!profile) profile = grunt.config.get("profiles.default");
            setProfile(profile);
            grunt.log.writeln(name + ' task with profile "' + profile + '" started! ');

            // Run the tasks
            grunt.task.run('base' + name.toUpperCase());
        });
    };

    grunt.registerTaskWithProfile('build', 'Build task', 'build');
    grunt.registerTaskWithProfile('demo', 'Generate build for demo', 'demo');
    grunt.registerTaskWithProfile('integration', 'Deploy webapp in Opencast backend', 'integration');
    grunt.registerTaskWithProfile('integrationminified', 'Deploy webapp in Opencast backend as minified version', 'integration');
    grunt.registerTaskWithProfile('dev', 'Development workflow');


    /** ================================================
     *  Listerers
     ==================================================*/

    // on watch events configure jshint:watch to only run on changed file
    grunt.event.on('watch', function (action, filepath, target) {

        // Set the current file processed for the different tasks
        grunt.config.set('currentWatchFile', [filepath]);

        // Configure the tasks with given profiles
        grunt.config.set('currentProfile', grunt.config.get('profiles.' + grunt.option('profile')));

        if (target == 'multiple') {
            // If the watch target is multiple,
            // we manage the tasks to run following the touched file extension
            var ext = filepath.split('.').pop();

            switch (ext) {
                case 'js':
                    grunt.task.run('jshint:watch');
                    grunt.task.run('blanket_qunit');
                    break;
                case 'less':
                    grunt.task.run('less');
                    grunt.task.run('copy:less');
                    break;
            }
        }
    });
};
