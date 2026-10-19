/**
 *  Copyright 2018, elan e.V., Germany
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

define([
    "jquery",
    "underscore",
    "backbone",
    "util",
    "models/user",
    "player-adapter-html5"
], function (
    $,
    _,
    Backbone,
    util,
    User,
    HTML5PlayerAdapter
) {
    "use strict";

    var backboneSync = Backbone.sync;

    /**
     * Synchronize models with an annotation tool backend
     */
    Backbone.sync = function (method, model, options) {

        // The backend expects `application/x-www-form-urlencoded data
        // with anything nested deeper than one level transformed to a JSON string
        options.processData = true;
        // We also need to specify `options.data` directly already,
        // lest Backbone will do its own processing to JSON.
        // This is also the perfect opportunity to make sure
        // that the JSON we pass is nested no deeper than one level.
        options.data = model.toJSON(_.defaults(options, { stringifySub: true }));

        // Some models (marked with `mPOST`) need to always be `PUT`, i.e. never be `POST`ed
        if (model.noPOST && method === "create") {
            method = "update";
        }

        options.beforeSend = function () {
            this.url = "../../extended-annotations" + this.url;

            // Sanitize query strings, so that they're actually at the end
            // TODO: Clean this up OR find a better way to do this
            var queryString = this.url.match(/\?(.*?)\//);
            if (queryString && queryString[0]) {
                this.url = this.url.replace(queryString[0], "");
                if (queryString[0].slice(-1) === "/") {
                    queryString[0] = queryString[0].slice(0, -1);
                }
                this.url += queryString[0];
            }
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
        return data.result[0];
    });
    var mediaPackage = searchResult.then(function (result) {
        return result.mediapackage;
    });
    // Get user data from Opencast
    var user = $.ajax({
        url: "/info/me.json"
    });
    var isAdmin = $.ajax({
        url: "/extended-annotations/users/is-annotate-admin/" + mediaPackageId
    }).then(function (data) {
        return data === "true";
    });

    /**
     * Module containing the tool integration
     * @exports integration
     */
    var Integration = {
        /**
         * @return {Promise.<object>} Metadata about the video
         */
        getVideoParameters: function () {
            return $.when(mediaPackageId, searchResult, mediaPackage).then(function (id, result, mediaPackage) {
                return {
                    video_extid: id,
                    series_extid: mediaPackage.series,
                    title: result.dcTitle
                };
            });
        },

        /**
         * Authenticate the user
         */
        authenticate: function () {
            $.when(user, isAdmin).then(function (userResult, isAdmin) {
                var user = userResult[0];
                var userData = user.user;
                this.user = new User({
                    user_extid: userData.username,
                    nickname: userData.name || userData.username,
                    email: userData.email,
                    isAdmin: isAdmin
                });
                return this.user.save();
            }.bind(this)).then(function () {
                this.trigger(this.EVENTS.USER_LOGGED);
            }.bind(this));
        },

        /**
         * Log out the current user
         */
        logout: function () {
            window.location = "/j_spring_security_logout";
        },

        /**
         * Function to load the video
         * @param {HTMLElement} container The container to create the video player in
         */
        loadVideo: function (container) {
            mediaPackage.then(function (mediaPackage) {
                var tracks = util.array(mediaPackage.media.track);

                // Select the playable tracks by the following priority:
                // 1. For dual stream videos we only want to show the 'composite/*' video
                // 2. if none exist, prefer HLS videos ('application/*' and 'master')
                // 3. if none exist, all tracks with type 'presenter/*'
                // 4. if none exist, all tracks with type 'presentation/*'
                var tracksWithType = function (pattern) {
                    return tracks.filter(function (track) {
                        return pattern.test(track.type);
                    });
                };
                var compositeTracks = tracksWithType(/composite\/.*/);
                var masterTracks = tracks.filter(function (track) {
                    return /application\/.*/.test(track.mimetype) && track.master === true;
                });
                var presenterTracks = tracksWithType(/presenter\/.*/);
                var presentationTracks = tracksWithType(/presentation\/.*/);

                var playable;
                if (compositeTracks.length > 0) {
                    playable = compositeTracks;
                } else if (masterTracks.length > 0) {
                    playable = masterTracks;
                } else if (presenterTracks.length > 0) {
                    playable = presenterTracks;
                } else if (presentationTracks.length > 0) {
                    playable = presentationTracks;
                } else {
                    playable = [];
                }

                var videoElement = document.createElement("video");
                container.appendChild(videoElement);
                this.playerAdapter = new HTML5PlayerAdapter(
                    videoElement,
                    playable.map(function (track) {
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

    return Integration;
});
