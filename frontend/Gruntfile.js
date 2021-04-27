module.exports = function (grunt) {

    /** ================================================
     *  Project configuration
     ==================================================*/
    grunt.initConfig({
        /** Local directory for the tests */

        /** Paths for the different types of ressource */
        srcPath: {
            js: 'js/**/*.js',
            less: 'style/**/*.less',
            html: '**/*.html',
            tmpl: 'templates/*.tmpl',
            locales: 'locales/**/*.json'
        },

        profiles: {
            // Default profile if no one is given
            default: 'integration',

            integration: {
                target: '../opencast-backend/annotation-tool/src/main/resources/ui/',
                integration: `build/integration/${grunt.option('integration') || 'search'}.js`
            },
        },

        currentProfile: {},

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
            options: {
                namespace: false,
                amd: true
            },
            compile: {
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
            // ... all the tool files for the current profile
            'all': {
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

    grunt.registerTask('baseINTEGRATION', ['amdcheck', 'handlebars', 'less', 'copy:all', 'copy:config', 'copy:integration', 'copy:locales', 'copy:index']);

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
