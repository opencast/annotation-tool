/**
 *  Copyright 2012, Entwine GmbH, Switzerland
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */

/**
 * Module containing the tool configuration
 * @module annotation-tool-configuration
 */
define(["jquery",
        "underscore",
        "backbone",
        "collections/users",
        "views/login",
        "player_adapter_HTML5",
        "localstorage"
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],

    function ($, _, Backbone, Users, LoginView, HTML5PlayerAdapter) {

        "use strict";

        var users = new Users();

        /**
         * Provide a default implementation of {@link module:Backbone.Collection.localStorage}
         * to generate the local storage container for every collection based on its URL.
         * @see module:Backbone.LocalStorage
         */
        Backbone.Collection.prototype.localStorage = function () {
            return new Backbone.LocalStorage(_.result(this, "url"));
        };

        /**
         * Annotations tool configuration object
         * @alias module:annotation-tool-configuration.Configuration
         */
        var Configuration =  {

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
                    annotate : true,
                    loop     : false
                }
            },

            /**
             * The maximal number of tracks visible in the timeline at the same time
             * @type {Number}
             */
            MAX_VISIBLE_TRACKS: 0,

            /**
             * The minmal duration used for annotation representation on timeline
             * @alias module:annotation-tool-configuration.Configuration.MINIMAL_DURATION
             * @memberOf module:annotation-tool-configuration.Configuration
             * @type {Object}
             */
            MINIMAL_DURATION: 5,

            /**
             * Define the number of categories pro tab in the annotate box. Bigger is number, thinner will be the columns for the categories.
             * @alias module:annotation-tool-configuration.Configuration.CATEGORIES_PER_TAB
             * @memberOf module:annotation-tool-configuration.Configuration
             * @type {Number}
             */
            CATEGORIES_PER_TAB: 7,

            /**
             * Define if the localStorage should be used or not
             * @alias module:annotation-tool-configuration.Configuration.localStorage
             * @type {boolean}
             * @readOnly
             */
            localStorage: true,

            /**
             * Array of tracks to import by default
             * @type {?object[]}
             */
            tracksToImport: undefined,

            /**
             * Get the tool layout configuration
             * @return {object} The tool layout configuration
             */
            getLayoutConfiguration: function () {
                return this.LAYOUT_CONFIGURATION.DEFAULT;
            },

            /**
             * Define if the structured annotations are or not enabled
             * @alias module:annotation-tool-configuration.Configuration.isStructuredAnnotationEnabled
             * @return {boolean} True if this feature is enabled
             */
            isStructuredAnnotationEnabled: function () {
                return true;
            },

            /**
             * Define if the private-only mode is enabled
             * @alias module:annotation-tool-configuration.Configuration.isPrivateOnly
             * @return {boolean} True if this mode is enabled
             */
            isPrivateOnly: false,

            /**
             * Define if the free text annotations are or not enabled
             * @alias module:annotation-tool-configuration.Configuration.isFreeTextEnabled
             * @return {boolean} True if this feature is enabled
             */
            isFreeTextEnabled: function () {
                return true;
            },

            /**
             * Get the current video id (video_extid)
             * @alias module:annotation-tool-configuration.Configuration.getVideoExtId
             * @return {string} video external id
             */
            getVideoExtId: function () {
                return $("video")[0].id;
            },

            /**
             * Returns the time interval between each timeupdate event to take into account.
             * It can improve a bit the performance if the amount of annotations is important. 
             * @alias module:annotation-tool-configuration.Configuration.getTimeupdateIntervalForTimeline
             * @return {number} The interval
             */
            getTimeupdateIntervalForTimeline: function () {
                // TODO Check if this function should be linear
                return Math.max(500, annotationTool.getAnnotations().length * 3);

            },

            /**
             * Sets the behavior of the timeline. Enable it to follow the playhead.
             * @alias module:annotation-tool-configuration.Configuration.timelineFollowPlayhead
             * @type {Boolean}
             */
            timelineFollowPlayhead: true,

            /**
             * Get the external parameters related to video. The supported parameters are now the following:
             *     - video_extid: Required! Same as the value returned by getVideoExtId
             *     - title: The title of the video
             *     - src_owner: The owner of the video in the system
             *     - src_creation_date: The date of the course, when the video itself was created.
             * @alias module:annotation-tool-configuration.Configuration.getVideoExtId
             * @example
             * {
             *     video_extid: 123, // Same as the value returned by getVideoExtId
             *     title: "Math lesson 4", // The title of the video
             *     src_owner: "Professor X", // The owner of the video in the system
             *     src_creation_date: "12-12-1023" // The date of the course, when the video itself was created.
             * }
             * @return {Object} The literal object containing all the parameters described in the example.
             */
            getVideoParameters: function () {
                return {
                    video_extid: this.getVideoExtId(),
                    title: $("video")[0].currentSrc.split("/").pop().split(".")[0],
                    src_owner: $("video").first().attr("data-owner"),
                    src_creation_date:  $("video").first().attr("data-date")
                };
            },

            /**
             * Authenticate the user
             * @alias module:annotation-tool-configuration.Configuration.authenticate
             */
            authenticate: function () {
                users.fetch().then(_.bind(function () {
                    var currentUser = localStorage.currentUser;
                    if (currentUser) {
                        this.user = users.get(currentUser);
                        this.trigger(this.EVENTS.USER_LOGGED);
                    } else {
                        var loginView = new LoginView();
                        loginView.once(LoginView.EVENTS.LOGIN, function (user, remember) {
                            this.user = users.get(user);
                            if (this.user) {
                                this.user.set(user.attributes);
                            } else {
                                this.user = users.create(user);
                            }
                            if (remember) {
                                localStorage.currentUser = this.user.id;
                            }
                            loginView.hide();
                            this.trigger(this.EVENTS.USER_LOGGED);
                        }, this);
                        loginView.show();
                    }
                }, this));
            },

            /**
             * Log out the current user
             * @alias module:annotation-tool-configuration.Configuration.logout
             */
            logout: function () {
                delete localStorage.currentUser;
                window.location.reload();
            },

            /**
             * Function to load the video
             * @alias module:annotation-tool-configuration.Configuration.loadVideo
             */
            loadVideo: function () {
                this.playerAdapter = new HTML5PlayerAdapter($("video")[0]);
            }
        };

        return Configuration;
    }
);
