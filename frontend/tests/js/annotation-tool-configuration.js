define(['domReady',
        'jquery',
        'underscore'
        // 'player_adapter_HTML5'
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],

    function (domReady, $, _) {



        /**
         * Annotations tool configuration
         */
        window.annotationTool = {

            /** Define if the localStorage should be used or not */
            localStorage: true,


            /**
             * List of possible layout configuration
             * @alias module:annotation-tool-configuration.Configuration.LAYOUT_CONFIGURATION
             * @memberOf module:annotation-tool-configuration.Configuration
             * @type {Object}
             */
            LAYOUT_CONFIGURATION: {
                /** default configuration */
                DEFAULT: {
                    timeline : true,
                    list     : true,
                    annotate : true
                }
            },

            /** Url from the annotations Rest Endpoints */
            restEndpointsUrl: "../../../extended-annotations",

            /**
             * Get the tool layout configuration
             * @return {object} The tool layout configuration
             */
            getLayoutConfiguration: function () {
                return this.LAYOUT_CONFIGURATION.DEFAULT;
            },


            /* Function to get the current video id (video_extid) */
            getVideoExtId: function () {
                return $('video')[0].id;
            },

            /* Function to get the user id from the current context (user_extid) */
            getUserExtId: function () {
                return "default";
            },

            /* Function to load the video */
            loadVideo: function () {

            },

            user: {
                get: function (id) {
                    return 8;
                }
            },

            onWindowResize: function () {
                // Function without content -> nothing to do for test
            }
        };

        domReady(function () {
            /* Player adapter implementation to use for the annotations tool */
            // window.annotationTool.playerAdapter = new HTML5PlayerAdapter($('video')[0]);
        });

        return window.annotations;
});
