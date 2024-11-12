/**
 *  Copyright 2018, ELAN e.V., Germany
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

        // Some models (marked with `noPOST`) need to always be `PUT`, i.e. never be `POST`ed
        if (model.noPOST && method === "create") {
            method = "update";
        }

        var beforeSend = options.beforeSend;
        options.beforeSend = function () {
            if (beforeSend) beforeSend.apply(this, arguments);
            this.url = "../../extended-annotations" + this.url;

            // Workaround bug to remove '&undefined=...' parameters (likely from label model).
            // - Trigger: On category deletion, the last request (GET) would result in a 404
            // - Example: /categories/…/labels&undefined=…&undefined=…?series-extid=…
            this.url = this.url.replace(/&undefined=\w+/g, "");

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
                var nickname = (typeof(userData.name) !== "undefined" && userData.name !== null) ? userData.name : userData.username;

                this.user = new User({
                    user_extid: userData.username,
                    nickname: nickname, //userData.username,
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
                var videos = util.array(mediaPackage.media.track)
                    .filter(_.compose(
                        RegExp.prototype.test.bind(/application\/.*|video\/.*/),
                        _.property("mimetype")
                    ));
                videos = _.sortBy(videos, "master").reverse();
                videos.sort(
                    util.lexicographic([
                        util.firstWith(_.compose(
                            RegExp.prototype.test.bind(/composite\/.*/),
                            _.property("type")
                        )),
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

    return Integration;
});
