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
        "util",
        "roles",
        "player_adapter_HTML5"
        // Add the files (PlayerAdapter, ...) required for your configuration here
        ],

    function ($, _, util, ROLES, HTML5PlayerAdapter) {

        "use strict";

        var video_title,
            video_creator,
            video_creation_date,
            video_extid,
            annotate_admin_roles = [],
            /**
             * Annotations tool configuration object
             * @alias module:annotation-tool-configuration.Configuration
             * @enum
             */
            Configuration =  {

                /**
                 * List of possible layout configuration
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
                 * The default tracks at startup
                 * @type {{@link this.TRACKS}}
                 */
                getDefaultTracks: function () {
                    return {
                        name: "mine",
                        filter: function (track) {
                            return track.get("isMine");
                        }
                    };
                },

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
                * The maximal number of tracks visible in the timeline at the same time
                * @type {Number}
                */
                MAX_VISIBLE_TRACKS: 0,

                /**
                 * Define if the localStorage should be used or not
                 * @alias module:annotation-tool-configuration.Configuration.localStorage
                 * @type {boolean}
                 * @readOnly
                 */
                localStorage: false,

                /**
                 * Url from the annotations Rest Endpoints
                 * @alias module:annotation-tool-configuration.Configuration.restEndpointsUrl
                 * @type {string}
                 * @readOnly
                 */
                restEndpointsUrl: "../../extended-annotations",

                /**
                 * Url for redirect after the logout
                 * @alias module:annotation-tool-configuration.Configuration.logoutUrl
                 * @type {string}
                 * @readOnly
                 */
                logoutUrl: "/j_spring_security_logout",

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
                        }).join("&");
                },

                /**
                 * Player adapter implementation to use for the annotations tool
                 * @alias module:annotation-tool-configuration.Configuration.playerAdapter
                 * @type {module:player-adapter.PlayerAdapter}
                 */
                playerAdapter: undefined,

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
                 * @return {string} video external id
                 */
                getVideoExtId: function () {
                    return video_extid;
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
                        video_extid       : this.getVideoExtId(),
                        title             : video_title,
                        src_owner         : video_creator,
                        src_creation_date : video_creation_date
                    };
                },

                /**
                 * Get the user id from the current context (user_extid)
                 * @alias module:annotation-tool-configuration.Configuration.getUserExtId
                 * @return {string} user_extid
                 */
                getUserExtId: function () {
                    if (_.isUndefined(annotationTool.userExtId)) {
                        $.ajax({
                            url: "/info/me.json",
                            async: false,
                            dataType: "json",
                            success: function (data) {
                                annotationTool.userExtId = data.user.username;
                            },
                            error: function () {
                                console.warn("Error getting user information from Opencast!");
                            }
                        });
                    }

                    return annotationTool.userExtId;
                },

                /**
                 * Controls the behavior of the login form. For truthy values it is prepopulated
                 * with user data from the current context.
                 * @alias module:annotation-tool-configuration.Configuration.useUserExtData
                 * @type {Boolean}
                 * @see module:annotation-tool-configuration.Configuration.getUserExtData
                 */
                useUserExtData: true,

                /**
                 * Skip the login form if possible, for example because user data can be extracted from the context
                 * @alias module:annotation-tool-configuration.Configuration.skipLoginFormIfPossible
                 * @type {Boolean}
                 * @see module:annotation-tool-configuration.Configuration.useUserExtData
                 */
                skipLoginFormIfPossible: true,

                getUserExtData: function () {
                    var user;

                    $.ajax({
                        url: "/info/me.json",
                        dataType: "json",
                        async: false,
                        success: function (response) {
                            user = response;
                        },
                        error: function (error) {
                            console.warn("Error getting user information from Opencast: " + error);
                        }
                    });

                    if (!user) return undefined;

                    return {
                        user_extid: user.user.username,
                        nickname: user.user.username,
                        email: user.user.email,
                        role: user.roles && this.getUserRoleFromExt(user.roles)
                    };
                },

                /**
                 * Maps a list of roles of the external user to a corresponding user role
                 * @alias module:annotation-tool-configuration.Configuration.getUserRoleFromExt
                 * @param {string[]} roles The roles of the external user
                 * @return {ROLE} The corresponding user role in the annotations tool
                 */
                getUserRoleFromExt: function (roles) {

                    var ROLE_ADMIN = "ROLE_ADMIN";

                    if (annotate_admin_roles.length > 0) {
                      for (var i = 0; i < annotate_admin_roles.length; i++) {
                        if (_.contains(roles, annotate_admin_roles[i])) {
                            return ROLES.ADMINISTRATOR;
                        }
                      }
                    } else if (_.contains(roles, ROLE_ADMIN)) {
                        console.log("Using admin role as default supervisor");
                        return ROLES.ADMINISTRATOR;
                    }

                    return ROLES.USER;
                },

                /**
                 * Function to load the video
                 * @alias module:annotation-tool-configuration.Configuration.loadVideo
                 */
                loadVideo: function () {
                    var mediaPackageId = window.location.search.match(/id=(.+?)(&|$)/);
                    if (mediaPackageId) mediaPackageId = decodeURIComponent(mediaPackageId[1]);

                    // Enable cross-domain for jquery ajax query
                    $.support.cors = true;

                    // Get the mediapackage and fill the player element with the videos
                    $.ajax({
                        url: "/search/episode.json",
                        async: false,
                        crossDomain: true,
                        data: "id=" + mediaPackageId + "&limit=1",
                        dataType: "json",
                        success: (function (data) {
                            var result = data["search-results"].result;

                            if (!result) {
                                // TODO Fail louder here
                                console.warn("Could not load video " + mediaPackageId);
                            }
                            var mediapackage = result.mediapackage;

                            video_extid = mediapackage.id;
                            video_title = result.dcTitle;
                            video_creator = result.dcCreator;
                            video_creation_date = result.dcCreated;

                            var tracks = util.array(mediapackage.media.track);

                            function matchType(field, type, subtype) {
                                if (!type) type = ".*";
                                if (!subtype) subtype = ".*";
                                var regex = new RegExp(type + "/" + subtype);
                                return function (object) {
                                    return object[field].match(regex);
                                };
                            }
                            var videos = util.array(mediapackage.media.track)
                                .filter(matchType("mimetype", "video"));
                            videos.sort(
                                util.lexicographic(
                                    util.firstWith(matchType("type", "presenter")),
                                    util.firstWith(matchType("type", "presentation")),
                                )
                            );

                            this.playerAdapter = new HTML5PlayerAdapter(
                                $("video")[0],
                                videos.map(function (track) {
                                    return {
                                        src: track.url,
                                        type: track.mimetype
                                    };
                                })
                            );

                            // Load the security XACML file for the episode
                            var attachments = util.array(mediapackage.attachments.attachment);
                            var selectedXACML = (function () {
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
                                        selectedXACML = attachments[i];
                                    }
                                }
                                return seriesXACML;
                            })();
                            // TODO What if **no** XACML is found?!
                            this.loadXACML(selectedXACML);

                        }).bind(this)
                    });
                },

                loadXACML: function (file) {
                    $.ajax({
                        url: file.url,
                        async: false,
                        crossDomain: true,
                        dataType: "xml",
                        success: function (xml) {
                            var $rules = $(xml).find("Rule");

                            $rules.each(function (i, element){
                                if ($(element).find("Action").find("AttributeValue").text() === "annotate-admin") {
                                    annotate_admin_roles.push($(element).find("Condition").find("AttributeValue").text());
                                }
                            });
                        }
                  });
                }
            };

        return Configuration;
    }
);
