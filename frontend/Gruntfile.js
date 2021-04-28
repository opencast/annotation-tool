module.exports = function (grunt) {

    /** ================================================
     *  Project configuration
     ==================================================*/
    grunt.initConfig({
        /** Local directory for the tests */

        /** Paths for the different types of ressource */
        srcPath: 'js/**/*.js',

        profiles: {
            // Default profile if no one is given
            default: 'integration',

            integration: {
                target: '../opencast-backend/annotation-tool/src/main/resources/ui/',
                integration: `build/integration/${grunt.option('integration') || 'search'}.js`
            },
        },

        currentProfile: {},

        clean: {
            options: {
                force: true
            },
            target: '<%= currentProfile.target %>'
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
            '<%= currentProfile.target %>/style/style.css': 'style/style.less'
        },

        /** Pre-compile the handlebars templates */
        handlebars: {
            options: {
                namespace: false,
                amd: true
            },
            compile: {
                files: [{
                    ext: '.js',
                    expand: true,
                    src: 'templates/*.tmpl',
                    dest: '<%= currentProfile.target %>'
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
                    dest: '<%= currentProfile.target %>'
                }, {
                    src: '<%= currentProfile.integration %>',
                    dest: '<%= currentProfile.target %>/js/annotation-tool-integration.js'
                }, {
                    src: 'build/config/annotation-tool-configuration.js',
                    dest: '<%= currentProfile.target %>/js/annotation-tool-configuration.js'
                }]
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
                src: ['<%= srcPath %>', '!js/libs/**'],
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

    grunt.registerTask('baseINTEGRATION', ['clean', 'amdcheck', 'handlebars', 'less', 'copy']);

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
};
