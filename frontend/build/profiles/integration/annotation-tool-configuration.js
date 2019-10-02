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
        "util",
        "models/user",
        "roles",
        "player_adapter_HTML5",
        "localstorage"
        // Add the files (PlayerAdapter, ...) required for your configuration here
        ],

    function ($, _, Backbone, util, User, ROLES, HTML5PlayerAdapter) {

        "use strict";

        var backboneSync = Backbone.sync;

        /**
         * Synchronize models with an annotation tool backend
         */
        Backbone.sync = function (method, model, options) {

            // The backend expects `application/x-www-form-urlencoded data
            // with anything nested deeper than one level transformed to a JSON string
            options.processData = true;

            options.data = options.attrs || model.toJSON(options);

            // Some models (marked with `mPOST`) need to always be `PUT`, i.e. never be `POST`ed
            if (model.noPOST && method === "create") {
                method = "update";
            }

            options.beforeSend = function () {
                this.url = "../../extended-annotations" + this.url;
            };

            return backboneSync.call(this, method, model, options);
        };

        // Initiate loading the video metadata from Opencast
        var mediaPackageId = util.queryParameters.id;
        $.support.cors = true;
        var searchResult = $.ajax({
            url: "/search/episode.json",
            crossDomain: true,
            data: "id=" + mediaPackageId + "&limit=1",
            dataType: "json"
        }).then(function (data) {
            return data["search-results"].result;
        });
        // TODO Error handling!
        var mediaPackage = searchResult.then(function (result) {
            return result.mediapackage;
        });
        // Get user data from Opencast
        var user = $.ajax({
            url: "/info/me.json",
            dataType: "json"
        });
        // Find out which roles should have admin rights
        var adminRoles = mediaPackage.then(function (mediaPackage) {
            // First we need to find the proper XACML file
            var attachments = util.array(mediaPackage.attachments.attachment);
            var selectedXACML = function () {
                var seriesXACML;
                for (var i = 0; i < attachments.length; i++) {
                    var attachment = attachments[i];
                    if (attachment.type === "security/xacml+episode") {
                        // Immediately return an XACML belonging to this specific episode
                        return attachment;
                    }
                    if (attachment.type === "security/xacml+series") {
                        // Remember any series XACML on the way,
                        //   so we can return that as a fallback
                        seriesXACML = attachment;
                    }
                }
                return seriesXACML;
            }();
            // TODO What if nothing was found?!
            return $.ajax({
                url: selectedXACML.url,
                crossDomain: true,
                dataType: "xml"
            });
        }).then(function (xacmlData) {
            // Then we need to extract the appropriate rules
            return $(xacmlData).find("Rule").filter(function (index, rule) {
                return $(rule).find("Action AttributeValue").text() === "annotate-admin";
            }).map(function (index, rule) {
                return $(rule).find("Condition AttributeValue").text();
            }).toArray();
        });

        /**
         * Annotations tool configuration object
         * @alias module:annotation-tool-configuration.Configuration
         */
        var Configuration = {
            /**
             * The minmal duration used for annotation representation on timeline
             * @alias module:annotation-tool-configuration.Configuration.MINIMAL_DURATION
             * @memberOf module:annotation-tool-configuration.Configuration
             * @type {Object}
             */
            MINIMAL_DURATION: 5,

            /**
             * Define the number of categories per tab in the annotate box.
             * The bigger this number, the thinner the columns for the categories.
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
            localStorage: false,

            /**
             * Offer the user a spreadsheet version of the annotations for download.
             * @alias module:annotation-tool-configuration.Configuration.export
             * @param {Video} video The video to export
             * @param {Track[]} tracks The tracks to include in the export
             * @param {Category[]} categories The tracks to include in the export
             */
            export: function (video, tracks, categories) {
                window.location.href = "../extended-annotations/videos/" + video.id + "/export.csv?" +
                    _.map(tracks, function (track) {
                        return "track=" + track.id;
                    }).join("&") +
                    "&" +
                    _.map(categories, function (category) {
                        return "category=" + category.id;
                    }).join("&") +
                    "freetext=" + this.freeTextVisible;
            },

            tracksToImport: undefined,

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
             * @type {boolean}
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
             * @return {Promise.<string>} video external id
             */
            getVideoExtId: function () {
                return $.when(mediaPackageId);
            },

            /**
             * Returns the time interval between each timeupdate event to take into account.
             * It can improve a bit the performance if the amount of annotations is important.
             * @alias module:annotation-tool-configuration.Configuration.getTimeupdateIntervalForTimeline
             * @return {number} The interval
             */
            getTimeupdateIntervalForTimeline: function () {
                // TODO Check if this function should be linear
                return Math.max(500, this.getAnnotations().length * 3);

            },

            /**
             * Sets the behavior of the timeline. Enable it to follow the playhead.
             * @alias module:annotation-tool-configuration.Configuration.timelineFollowPlayhead
             * @type {Boolean}
             */
            timelineFollowPlayhead: true,

            /**
             * Get the external parameters related to video. The supported parameters are now the following:
             *     - title: The title of the video
             *     - src_owner: The owner of the video in the system
             *     - src_creation_date: The date of the course, when the video itself was created.
             * @alias module:annotation-tool-configuration.Configuration.getVideoParameters
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
                return searchResult.then(function (result) {
                    return {
                        title: result.dcTitle,
                        src_owner: result.dcCreator,
                        src_creaton_date: result.dcCreated
                    };
                });
            },

            /**
             * Maps a list of roles of the external user to a corresponding user role
             * @alias module:annotation-tool-configuration.Configuration.getUserRoleFromExt
             * @param {string[]} roles The roles of the external user
             * @return {Promise.<ROLE>} The corresponding user role in the annotations tool
             */
            getUserRoleFromExt: function (roles) {
                return adminRoles.then(function (adminRoles) {
                    if (_.some(adminRoles.concat(['ROLE_ADMIN']), function (adminRole) {
                        return _.contains(roles, adminRole);
                    })) {
                        return ROLES.ADMINISTRATOR;
                    } else {
                        return ROLES.USER;
                    }
                });
            },

            /**
             * Authenticate the user
             * @alias module:annotation-tool-configuration.Configuration.authenticate
             */
            authenticate: function () {
                user.then(function (userData) {
                    return $.when(userData.user, this.getUserRoleFromExt(userData.roles));
                }.bind(this)).then(function (user, role) {
                    this.user = new User({
                        user_extid: user.username,
                        nickname: user.username,
                        email: user.email,
                        role: role
                    });
                    return this.user.save();
                }.bind(this)).then(function () {
                    this.trigger(this.EVENTS.USER_LOGGED);
                }.bind(this));
            },

            /**
             * Log out the current user
             * @alias module:annotation-tool-configuration.Configuration.logout
             */
            logout: function () {
                window.location = "/j_spring_security_logout";
            },

            /**
             * Function to load the video
             * @alias module:annotation-tool-configuration.Configuration.loadVideo
             * @param {HTMLElement} container The container to create the video player in
             */
            loadVideo: function (container) {
                mediaPackage.then(function (mediaPackage) {
                    var videos = util.array(mediaPackage.media.track)
                        .filter(_.compose(
                            RegExp.prototype.test.bind(/application\/.*|video\/.*/),
                            _.property("mimetype")
                        ));
                    videos.sort(
                        util.lexicographic([
                            util.firstWith(_.compose(
                                RegExp.prototype.test.bind(/presenter\/.*/),
                                _.property("type")
                            )),
                            util.firstWith(_.compose(
                                RegExp.prototype.test.bind(/presentation\/.*/),
                                _.property("type")
                            ))
                        ])
                    );

                    var videoElement = document.createElement("video");
                    container.appendChild(videoElement);
                    this.playerAdapter = new HTML5PlayerAdapter(
                        videoElement,
                        videos.map(function (track) {
                            return {
                                src: track.url,
                                type: track.mimetype
                            };
                        })
                    );
                    this.trigger(this.EVENTS.VIDEO_LOADED);
                }.bind(this));
            }
        };

        return Configuration;
    }
);
