/**
 *  Copyright 2018, ELAN e.V., Germany
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
    "alerts",
    "models/user",
    "player-adapter-html5"
], function (
    $,
    _,
    Backbone,
    util,
    alerts,
    User,
    HTML5PlayerAdapter
) {
    "use strict";

    var backboneSync = Backbone.sync;

    var apiBase = "../../extended-annotations" ;

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

        // TODO Duplication, but not really ...
        options.beforeSend = function (request) {
            this.url = apiBase + this.url;

            // Sanitize query strings, so that they're actually at the end
            // TODO: Clean this up OR find a better way to do this
            var queryString = this.url.match(/\?(.*?)\//);
            if (queryString && queryString[0]) {
                this.url = this.url.replace(queryString[0], "");
                if (queryString[0].slice(-1) === "/") {
                    queryString[0] = queryString[0].slice(0, -1);
                }
                this.url = this.url + queryString[0];
            }

            // TODO Fix the headers
            request.setRequestHeader(
                "X-Opencast-Annotate-Signed-URL",
                window.location
            );
            // TODO This information is duplicated ...
            //   But it's complicated;
            //   it would seem wrong to look this up
            //   in the signed URL.
            request.setRequestHeader(
                "X-Opencast-Annotate-Media-Package",
                util.queryParameters.id
            );
        };

        return backboneSync.call(this, method, model, options);
    };

    function dieOnError(request) {
        request.fail(function (response) {
            alerts.fatal(response.statusText);
        });
        return request;
    }

    var annotationInfo = dieOnError($.ajax(apiBase + "/annotate", {
        beforeSend: function (request) {
            // TODO Fix the headers
            request.setRequestHeader(
                "X-Opencast-Annotate-Signed-URL",
                window.location
            );
            request.setRequestHeader(
                "X-Opencast-Annotate-Media-Package",
                util.queryParameters.id
            );
        }
    }));

    // codediff SC135, SC664:
    // Establish a heartbeat with the server
    // to refresh our Shibboleth session.
    window.setInterval(function () {
        dieOnError($.ajax("/info/me.json"));
    }, 1000 * 60);
    // end codediff

    /**
     * Module containing the tool integration
     * @exports annotation-tool-integration
     */
    var Configuration = {
        /**
         * Get the current video id (video_extid)
         * @return {Promise.<string>} video external id
         */
        getVideoExtId: function () {
            return util.queryParameters.id;
        },

        /**
         * Get the current series id of the video (series_extid)
         * @alias module:annotation-tool-configuration.Configuration.getVideoExtId
         * @return {Promise.<string>} video external id
         */
        getSeriesExtId: function () {
            return annotationInfo.then(function (info) {
                return info.series;
            }.bind(this));
        },

        /**
         * @return {Promise.<object>} Metadata about the video
         */
        getVideoParameters: function () {
            return annotationInfo.then(function (info) {
                return { title: info.title };
            });
        },

        /**
         * Authenticate the user
         */
        authenticate: function () {
            annotationInfo.then(_.bind(function (info) {
                this.user = new User(info.user);
                this.trigger(this.EVENTS.USER_LOGGED);
            }, this));
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
            annotationInfo.then(_.bind(function (info) {
                var videoElement = document.createElement("video");
                container.appendChild(videoElement);
                this.playerAdapter = new HTML5PlayerAdapter(
                    videoElement,
                    info.videos.map(function (video) {
                        return {
                            src: video.url,
                            type: video.type
                        };
                    })
                );
                this.trigger(this.EVENTS.VIDEO_LOADED);
            }, this));
        }
    };

    return Configuration;
});
