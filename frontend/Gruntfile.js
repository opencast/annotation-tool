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
                sources : '',
                target  : '../opencast-backend/annotation-tool/src/main/resources/ui/',
                config  : 'build/profiles/integration/annotation-tool-configuration.js'
            },

            local: {
                sources: '<source src=\"/resources/aav1.mp4\" type=\"video/mp4\" />\n \
                          <source src=\"/resources/aav1.webm\" type=\"video/webm\" />\n \
                          <source src=\"/resources/aav1.ogv\" type=\"video/ogg\" /> ',
                target : '<%= webServerDir %>',
                config : 'build/profiles/local/annotation-tool-configuration.js'
            },

            build: {
                sources: '<source src=\"/resources/Annotations_Video.mp4\" type=\"video/mp4\" />\n \
                          <source src=\"/resources/Annotations_Video.webm\" type=\"video/webm\" />\n \
                          <source src=\"/resources/Annotations_Video.theora.ogv\" type=\"video/ogg\" /> ',
                target : '<%= buildDir %>',
                config : 'build/profiles/local/annotation-tool-configuration.js'
            },

            demo: {
                sources: '<source src=\"/annotation/resources/sinteltrailer.mp4\" type=\"video/mp4\" />\n \
                          <source src=\"/annotation/resources/sinteltrailer.ogv\" type=\"video/ogg\" /> ',
                target : '/var/www/html/annotation/',
                config : 'build/profiles/local/annotation-tool-configuration.js'
            }
        },

        currentProfile: { sources: 'test' },

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
                    dest: 'target'
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
                processContentExclude: ['img/**/*', 'resources/**/*']
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
                    src     : ['js/**/*', 'img/**/*', 'style/**/.svg', 'style/**/*.png', 'style/**/*.css', 'resources/*', 'tests/**/*'],
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
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css', 'resources/*', 'tests/**/*'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            // ... all the files for an optimized build
            'build': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['img/**/*', 'style/**/*.svg', 'style/**/*.png', 'style/**/*.css', 'resources/*', 'js/libs/**/*'],
                    dest: '<%= currentProfile.target %>'
                }]
            },
            // ... all the files for the demo
            'demo': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.svg', 'style/**/*.png',  'resources/*', 'style/**/*.css', 'tests/**/*'],
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
                src: ['js/views/*.js', 'js/collections/*.js', 'js/models/*.js', 'js/prototypes/*.js'],
                options: {
                    destination: '<%= currentProfile.target %>/doc',
                    template: 'node_modules/ink-docstrap/template'
                }
            }
        },


        /** Task to run tasks in parrallel */
        concurrent: {
            dev: {
                tasks: ['watch:js', 'watch:html', 'watch:less', 'watch:templates', 'watch:locales', 'watch:www', 'connect:dev'],
                options: {
                    logConcurrentOutput: true,
                    limit: 7
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
                    version: '<%= pkg.version %>',
                    sources: '<%= currentProfile.sources %>'
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

        /** Optimisation through requireJS */
        requirejs: {
            compile: {
                options: {
                    baseUrl                    : './js',
                    mainConfigFile             : './js/libs/require/config/config-build.js',
                    name                       : 'main',
                    optimizeAllPluginResources : false,
                    preserveLicenseComments    : false,
                    optimize                   : 'none',
                    useStrict                  : true,
                    findNestedDependencies     : true,
                    out                        : '<%= currentProfile.target %>/optimized.js'
                }
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
            i18next: function () {
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

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.loadNpmTasks('grunt-blanket-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
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
    //grunt.registerTask('baseBUILD', ['blanket_qunit', 'jsdoc', 'less', 'copy:build', 'processhtml:build', 'copy:config', 'requirejs']);
    grunt.registerTask('baseBUILD', [/*'blanket_qunit', */'jsdoc', 'handlebars:temp', 'less', 'copy:build', 'processhtml:build', 'copy:config', 'copy:locales', 'requirejs']);
    grunt.registerTask('baseINTEGRATION', ['handlebars:all', 'less', 'copy:integration', 'processhtml:dev', 'copy:config', 'copy:locales']);
    grunt.registerTask('baseINTEGRATIONMINIFIED', ['blanket_qunit', 'handlebars:temp', 'less', 'copy:integration', 'processhtml:build', 'copy:config', 'copy:locales', 'requirejs']);

    grunt.registerTaskWithProfile = function (name, description, defaultProfile) {
        grunt.registerTask(name, description, function () {
            var profileName = grunt.option('profile') || defaultProfile,
                profileConfig;

            if (grunt.option('cv')) {
                console.log('With version ' + grunt.option('cv'));
                grunt.config.set('pkg.version', grunt.option('cv'));
            }

            // If no profile name given, use the default one
            if (typeof profileName == 'undefined') {
                profileName = grunt.config.get('profiles.default');
                grunt.option('profile', profileName);
                grunt.log.writeln('No profile name given as option, use default one.');
            }

            // Get the profile configuration
            profileConfig = grunt.config.get('profiles.' + profileName);

            // Check if the profile exist
            if (typeof profileConfig == 'undefined') {
                grunt.fail.fatal('The profile "' + profileName + '" does not exist in the Gruntfile.');
            }

            grunt.log.writeln(name + ' task with profile "' + profileName + '" started! ');

            // Configure the tasks with given profiles
            grunt.config.set('currentProfile', profileConfig);

//            if (name.toUpperCase() === "DEMO") {
//                grunt.config.set('currentProfile.target', grunt.config.get('currentProfile.target') + grunt.config.get('pkg.version'));
//            }

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
