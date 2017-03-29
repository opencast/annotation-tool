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
 * @module annotations-tool-configuration
 */
define(["jquery",
        "underscore",
        "roles",
        "player_adapter_HTML5"
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],

    function ($, _, ROLES, HTML5PlayerAdapter) {

        "use strict";

        var video_title,
            video_creator,
            video_creation_date,
            /**
             * Annotations tool configuration object
             * @alias module:annotations-tool-configuration.Configuration
             * @enum
             */
            Configuration =  {

                /**
                 * List of possible layout configuration
                 * @memberOf module:annotations-tool-configuration.Configuration
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
                 * @alias module:annotations-tool-configuration.Configuration.MINIMAL_DURATION
                 * @memberOf module:annotations-tool-configuration.Configuration
                 * @type {Object}
                 */
                MINIMAL_DURATION: 5,

                /**
                 * Define the number of categories pro tab in the annotate box. Bigger is number, thinner will be the columns for the categories.
                 * @alias module:annotations-tool-configuration.Configuration.CATEGORIES_PER_TAB
                 * @memberOf module:annotations-tool-configuration.Configuration
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
                 * @alias module:annotations-tool-configuration.Configuration.localStorage
                 * @type {boolean}
                 * @readOnly
                 */
                localStorage: false,


                localStorageOnlyModel: [],


                plugins: {
                    Loop: function () {
                            require(["views/loop"], function (Loop) {
                                annotationsTool.loopView = new Loop();
                            });
                        }
                },


                /**
                 * Url from the annotations Rest Endpoints
                 * @alias module:annotations-tool-configuration.Configuration.restEndpointsUrl
                 * @type {string}
                 * @readOnly
                 */
                restEndpointsUrl: "../../extended-annotations",

                /**
                 * Url for redirect after the logout
                 * @alias module:annotations-tool-configuration.Configuration.logoutUrl
                 * @type {string}
                 * @readOnly
                 */
                logoutUrl: "/j_spring_security_logout",

                /**
                 * Url from the export function for statistics usage
                 * @alias module:annotations-tool-configuration.Configuration.exportUrl
                 * @type {string}
                 * @readOnly
                 */
                exportUrl: "../extended-annotations/export.csv",

                /**
                 * Player adapter implementation to use for the annotations tool
                 * @alias module:annotations-tool-configuration.Configuration.playerAdapter
                 * @type {module:player-adapter.PlayerAdapter}
                 */
                playerAdapter: undefined,

                tracksToImport: undefined,

                /**
                 * Formats the given date in 
                 * @alias module:annotations-tool-configuration.Configuration.formatDate
                 * @type {module:player-adapter.formatDate}
                 */
                formatDate: function (date) {
                    if (_.isNumber(date)) {
                        date = new Date(date);
                    }

                    if (_.isDate(date)) {
                        return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
                    } else {
                        return "Unvalid date";
                    }
                },

                /**
                 * Get the tool layout configuration
                 * @return {object} The tool layout configuration
                 */
                getLayoutConfiguration: function () {
                    return this.LAYOUT_CONFIGURATION.DEFAULT;
                },

                /**
                 * Define if the structured annotations are or not enabled
                 * @alias module:annotations-tool-configuration.Configuration.isStructuredAnnotationEnabled
                 * @return {boolean} True if this feature is enabled
                 */
                isStructuredAnnotationEnabled: function () {
                    return true;
                },

                /**
                 * Define if the private-only mode is enabled
                 * @alias module:annotations-tool-configuration.Configuration.isPrivateOnly
                 * @return {boolean} True if this mode is enabled
                 */
                isPrivateOnly: function () {
                    return false;
                },

                /**
                 * Define if the free text annotations are or not enabled
                 * @alias module:annotations-tool-configuration.Configuration.isFreeTextEnabled
                 * @return {boolean} True if this feature is enabled
                 */
                isFreeTextEnabled: function () {
                    return true;
                },

                /**
                 * Get the current video id (video_extid)
                 * @alias module:annotations-tool-configuration.Configuration.getVideoExtId
                 * @return {string} video external id
                 */
                getVideoExtId: function () {
                    return $("video")[0].id;
                },

                /**
                 * Returns the time interval between each timeupdate event to take into account.
                 * It can improve a bit the performance if the amount of annotations is important. 
                 * @alias module:annotations-tool-configuration.Configuration.getTimeupdateIntervalForTimeline
                 * @return {number} The interval
                 */
                getTimeupdateIntervalForTimeline: function () {
                    // TODO Check if this function should be linear
                    return Math.max(500, annotationsTool.getAnnotations().length * 3);

                },

                /**
                 * Sets the behavior of the timeline. Enable it to follow the playhead.
                 * @alias module:annotations-tool-configuration.Configuration.timelineFollowPlayhead
                 * @type {Boolean}
                 */
                timelineFollowPlayhead: true,

                /**
                 * Get the external parameters related to video. The supported parameters are now the following:
                 *     - video_extid: Required! Same as the value returned by getVideoExtId
                 *     - title: The title of the video
                 *     - src_owner: The owner of the video in the system
                 *     - src_creation_date: The date of the course, when the video itself was created.
                 * @alias module:annotations-tool-configuration.Configuration.getVideoExtId
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
                 * @alias module:annotations-tool-configuration.Configuration.getUserExtId
                 * @return {string} user_extid
                 */
                getUserExtId: function () {
                    if (_.isUndefined(annotationsTool.userExtId)) {
                        $.ajax({
                            url: "/info/me.json",
                            async: false,
                            dataType: "json",
                            success: function (data) {
                                annotationsTool.userExtId = data.user.username;
                            },
                            error: function () {
                                console.warn("Error getting user information from Opencast!");
                            }
                        });
                    }

                    return annotationsTool.userExtId;
                },

                /**
                 * Controls the behavior of the login form. For truthy values it is prepopulated
                 * with user data from the current context.
                 * @alias module:annotations-tool-configuration.Configuration.useUserExtData
                 * @type {Boolean}
                 * @see module:annotations-tool-configuration.Configuration.getUserExtData
                 */
                useUserExtData: true,

                /**
                 * Skip the login form if possible, for example because user data can be extracted from the context
                 * @alias module:annotations-tool-configuration.Configuration.skipLoginFormIfPossible
                 * @type {Boolean}
                 * @see module:annotations-tool-configuration.Configuration.useUserExtData
                 */
                skipLoginFormIfPossible: true,

                /**
                 * Extract user data from the current context.
                 * The format has to be compatible with {@link module:models-user.User#initialize}.
                 * @alias module:annotations-tool-configuration.Configuration.getUserExtData
                 * @return {Object} Contextual user data
                 */
                getUserExtData: function () {
                    var user;
                    var roles;

                    $.ajax({
                        url: "/api/info/me",
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

                    $.ajax({
                        url: "/api/info/me/roles",
                        dataType: "json",
                        async: false,
                        success: function (response) {
                            roles = response;;
                        },
                        error: function (error) {
                            console.warn("Error getting user information from Opencast: " + error);
                        }
                    });

                    return {
                        user_extid: user.username,
                        nickname: user.username,
                        email: user.email,
                        role: roles && this.getUserRoleFromExt(roles)
                    };
                },

                /**
                 * Maps a list of roles of the external user to a corresponding user role
                 * @alias module:annotations-tool-configuration.Configuration.getUserRoleFromExt
                 * @param {string[]} roles The roles of the external user
                 * @return {ROLE} The corresponding user role in the annotations tool
                 */
                getUserRoleFromExt: function (roles) {
                    var adminRole;

                    $.ajax({
                        url: "/api/info/organization",
                        dataType: "json",
                        async: false,
                        success: function (response) {
                            adminRole = response.adminRole;
                        },
                        error: function (error) {
                            console.warn("Error getting user information from Opencast: " + error);
                        }
                    });

                    var ROLE_ADMIN = "ROLE_ADMIN";

                    if (adminRole && _.contains(roles, adminRole)) {
                        return ROLES.ADMINISTRATOR;
                    }

                    if (_.contains(roles, ROLE_ADMIN)) {
                        return ROLES.SUPERVISOR;
                    }

                    return ROLES.USER;
                },

                /**
                 * Get the role of the current user
                 * @alias module:annotations-tool-configuration.Configuration.getUserRole
                 * @return {ROLE} The current user role
                 */
                getUserRole: function () {
                    var ROLE_ADMIN = "ROLE_ADMIN";

                    if (_.isUndefined(annotationsTool.userRole)) {
                        $.ajax({
                            url: "/info/me.json",
                            async: false,
                            dataType: "json",
                            success: function (data) {
                                if (_.contains(data.roles, ROLE_ADMIN)) {
                                    annotationsTool.userRole = ROLES.SUPERVISOR;
                                }

                                if (_.contains(data.roles, data.org.adminRole)) {
                                    annotationsTool.userRole = ROLES.ADMINISTRATOR;
                                }
                            },
                            error: function () {
                                console.warn("Error getting user information from Matterhorn!");
                            }
                        });
                    }

                    return annotationsTool.userRole | ROLES.USER;
                },

                /**
                 * Get the name of the admin role
                 * @alias module:annotations-tool-configuration.Configuration.getAdminRoleName
                 * @return {ROLE} The name of the admin role
                 */
                getAdminRoleName: function () {
                    return ROLES.ADMINISTRATOR;
                },

                /**
                 * Function to load the video
                 * @alias module:annotations-tool-configuration.Configuration.loadVideo
                 */
                loadVideo: function () {
                    var duration = 0,
                       // Supported video formats
                       videoTypes = ["video/webm", "video/ogg", "video/mp4"],
                       videoTypeIE9 = "video/mp4",
                       //var videoTypesForFallBack = ["video/x-flv"];
                       videoTypesForFallBack = [],
                       trackType = ["presenter/delivery", "presentation/delivery"],
                       mediaPackageId = decodeURI((new RegExp("id=" + "(.+?)(&|$)").exec(location.search) || [,null])[1]);

                    // Enable cross-domain for jquery ajax query
                    $.support.cors = true;

                    annotationsTool.playerAdapter = new HTML5PlayerAdapter($("video")[0]);

                    // Get the mediapackage and fill the player element with the videos
                    $.ajax({
                        url: "/search/episode.json",
                        async: false,
                        crossDomain: true,
                        data: "id=" + mediaPackageId + "&limit=1",
                        dataType: "json",
                        success: function (data) {
                            var result = data["search-results"].result,
                                mediapackage = result.mediapackage,
                                videos = {},
                                videosFallback = {},
                                nbNormalVideos = 0,
                                nbFallbackVideos = {},
                                tracks,
                                selectedVideos = {},
                                videoIE9;

                            video_title = result.DcTitle;
                            video_creator = result.DcCreator;
                            video_creation_date = result.DcCreated;

                            $.each(videoTypesForFallBack, function (idx, mimetype) {
                                videosFallback[mimetype] = {};
                                nbFallbackVideos[mimetype] = 0;
                            });

                            $.each(trackType, function (index, type) {
                                videos[type] = [];
                                $.each(videoTypesForFallBack, function (idx, mimetype) {
                                    videosFallback[mimetype][type] = [];
                                });
                            });

                            tracks = mediapackage.media.track;
                            if (!$.isArray(tracks)) {
                                tracks = [];
                                tracks.push(mediapackage.media.track);
                            }

                            $.each(tracks, function (index, track) {
                                selectedVideos = null;

                                if (track.mimetype === videoTypeIE9 &&  $.inArray(track.type, trackType) !== -1) {
                                    videoIE9 = track;
                                }

                                // If type not supported, go to next track
                                if ($.inArray(track.mimetype, videoTypes) !== -1) {
                                    selectedVideos = videos;
                                    nbNormalVideos++;
                                } else if ($.inArray(track.mimetype, videoTypesForFallBack) !== -1) {
                                    selectedVideos = videosFallback[track.mimetype];
                                    nbFallbackVideos[track.mimetype]++;
                                } else {
                                    return;
                                }

                                $.each(trackType, function (index, type) {
                                    if (track.type === type) {
                                        selectedVideos[type].push(track);
                                        return false;
                                    }
                                });
                            });

                            if (nbNormalVideos === 0) {
                                $.each(videoTypesForFallBack, function (idx, mimetype) {
                                    if (nbFallbackVideos[mimetype] > 0) {
                                        selectedVideos = videosFallback[mimetype];
                                        return false;
                                    }
                                });
                            } else {
                                selectedVideos = videos;
                            }

                            if (annotationsTool.isBrowserIE9()) {
                                $("video").attr("src", videoIE9.url).attr("type", videoTypeIE9);
                            } else {
                                $.each(selectedVideos, function (index, type) {
                                    if (type.length !== 0) {
                                        var videoSrc = "";
                                        $.each(type, function (idx, track) {
                                            if (duration === 0) {
                                                duration = track.duration;
                                            }
                                            videoSrc += "<source src=\"" + track.url + "\" type=\"" + track.mimetype + "\"></source>";
                                        });
                                        if (videoSrc !== "") {
                                            $("video").append(videoSrc);
                                            $("video").attr("id", mediaPackageId);
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            };

        return Configuration;
    }
);