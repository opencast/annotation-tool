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
    "collections/users",
    "views/login",
    "player_adapter_HTML5",
    "localstorage"
], function (
    $,
    _,
    Backbone,
    util,
    Users,
    LoginView,
    HTML5PlayerAdapter
) {
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
     * Module containing the tool integration
     * @exports annotation-tool-integration
     */
    var Configuration =  {
        /**
         * Define if the localStorage should be used or not
         * @type {boolean}
         * @readOnly
         */
        localStorage: true,

        /**
         * Get the current video id (video_extid)
         * @return {Promise.<string>} video external id
         */
        getVideoExtId: function () {
            return util.queryParameters.video;
        },

        /**
         * @return {Object} Metadata about the video
         */
        getVideoParameters: function () {
            return {
                title: util.queryParameters.video.split("/").pop().split(".")[0]
            };
        },

        /**
         * Authenticate the user
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
         */
        logout: function () {
            delete localStorage.currentUser;
            window.location.reload();
        },

        /**
         * Function to load the video
         * @param {HTMLElement} container The container to create the video player in
         */
        loadVideo: function (container) {
            var videoElement = document.createElement("video");
            container.appendChild(videoElement);
            this.playerAdapter = new HTML5PlayerAdapter(videoElement, { src: util.queryParameters.video });
            this.trigger(this.EVENTS.VIDEO_LOADED);
        }
    };

    return Configuration;
});
