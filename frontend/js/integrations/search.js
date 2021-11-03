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
        return data["search-results"].result;
    });
    var mediaPackage = searchResult.then(function (result) {
        return result.mediapackage;
    });
    // Get user data from Opencast
    var user = $.ajax({
        url: "/info/me.json"
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
            $.when(user, adminRoles).then(function (userResult, adminRoles) {
                var user = userResult[0];
                var userData = user.user;
                this.user = new User({
                    user_extid: userData.username,
                    nickname: userData.username,
                    email: userData.email
                }, {
                    isAdmin: _.intersection(
                        adminRoles.concat(["ROLE_ADMIN"]),
                        user.roles
                    ).length > 0
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

    return Integration;
});
