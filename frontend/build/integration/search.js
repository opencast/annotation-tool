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
    "roles",
    "player_adapter_HTML5",
], function (
    $,
    _,
    Backbone,
    util,
    User,
    ROLES,
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
            if(queryString && queryString[0]) {
                this.url = this.url.replace(queryString[0], "");
                if (queryString[0].slice(-1) === "/") {queryString[0] = queryString[0].slice(0, -1)}
                this.url = this.url + queryString[0];
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
     * @exports annotation-tool-integration
     */
    var Configuration = {
        /**
         * Get the current video id (video_extid)
         * @return {Promise.<string>} video external id
         */
        getVideoExtId: function () {
            return $.when(mediaPackageId);
        },

        /**
         * Get the current series id of the video (series_extid)
         * @alias module:annotation-tool-configuration.Configuration.getVideoExtId
         * @return {Promise.<string>} video external id
         */
        getSeriesExtId: function () {
          return mediaPackage.then(function (mediaPackage) {
              return mediaPackage.series;
          }.bind(this));
        },

        /**
         * @return {Object} Metadata about the video
         */
        getVideoParameters: function () {
            return searchResult.then(function (result) {
                return { title: result.dcTitle };
            });
        },

        /**
         * Maps a list of roles of the external user to a corresponding user role
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

    return Configuration;
});
