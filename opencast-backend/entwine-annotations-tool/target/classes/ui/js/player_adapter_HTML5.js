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

/*global Element */

/**
 * A module representing the player adapter implementation for the HTML5 native player
 * @module player-adapter-HTML5
 * @requires jQuery
 * @requires player-adapter
 */
define(["jquery",
        "prototypes/player_adapter"],

    function ($, PlayerAdapter) {

        "use strict";

        /**
         * Implementation of the player adapter for the HTML5 native player
         * @constructor
         * @alias module:player-adapter-HTML5.PlayerAdapterHTML5
         * @augments {module:player-adapter.PlayerAdapter}
         * @param {DOM Element} targetElement DOM Element representing the player
         */
        var PlayerAdapterHTML5 = function (targetElement) {
            var HTMLElement,
                self = this;

            // Allow to use HTMLElement with MS IE < 9
            if (!HTMLElement) {
                HTMLElement = Element;
            }

            // Check if the given target Element is valid
            if (typeof targetElement === "undefined" || targetElement === null || !(targetElement instanceof HTMLElement)) {
                throw "The given target element must not be null and have to be a vaild HTMLElement!";
            }

            /**
             * Id of the player adapter
             * @inner
             * @type {String}
             */
            this.id = "PlayerAdapter" + targetElement.id;

            /**
             * The HTML representation of the adapter, mainly used to thriggered event
             * @inner
             * @type {DOM Element}
             */
            this.htmlElement = null;

            /**
             * The current player status
             * @inner
             * @type {module:player-adapter.PlayerAdapter.STATUS}
             */
            this.status = PlayerAdapter.STATUS.INITIALIZING;

            /**
             * Define if a play request has be done when the player was not ready
             * @inner
             * @type {Boolean}
             */
            this.waitToPlay = false;

            /**
             * Define if a the player has been initialized
             * @inner
             * @type {Boolean}
             */
            this.initialized = false;

            /**
             * Initilize the player adapter
             * @inner
             */
            this.init = function () {

                // Create the HTML representation of the adapter
                $(targetElement).wrap(self.getHTMLTemplate(self.id));
                if ($("#" + self.id).length === 0) {
                    throw "Cannot create HTML representation of the adapter";
                }

                self.htmlElement = document.getElementById(self.id);

                // Extend the current object with the HTML representation
                $.extend(true, this, self.htmlElement);

                // Add PlayerAdapter the prototype
                this.__proto__ = new PlayerAdapter();

                // ...and ensure that its methods are used for the Events management
                this.dispatchEvent       = this.__proto__.dispatchEvent;
                this.triggerEvent        = this.__proto__.triggerEvent;
                this.addEventListener    = this.__proto__.addEventListener;
                this.removeEventListener = this.__proto__.removeEventListener;
                this._getListeners       = this.__proto__._getListeners;

                /**
                 * Listen the events from the native player
                 */
                $(targetElement).bind("canplay durationchange", function () {
                    // If duration is still not valid
                    if (isNaN(self.getDuration()) || targetElement.readyState < 1) {
                        return;
                    }

                    if (!self.initialized) {
                        self.initialized = true;
                    }

                    // If duration is valid, we chanded status
                    self.status =  PlayerAdapter.STATUS.PAUSED;
                    self.triggerEvent(PlayerAdapter.EVENTS.READY);

                    if (self.waitToPlay) {
                        self.play();
                    }
                });

                $(targetElement).bind("play", function () {
                    if (!self.initialized) {
                        return;
                    }

                    self.status =  PlayerAdapter.STATUS.PLAYING;
                    self.triggerEvent(PlayerAdapter.EVENTS.PLAY);
                });

                $(targetElement).bind("playing", function () {
                    self.status =  PlayerAdapter.STATUS.PLAYING;
                });

                $(targetElement).bind("pause", function () {
                    if (!self.initialized) {
                        return;
                    }

                    self.status =  PlayerAdapter.STATUS.PAUSED;
                    self.triggerEvent(PlayerAdapter.EVENTS.PAUSE);
                });

                $(targetElement).bind("ended", function () {
                    self.status =  PlayerAdapter.STATUS.ENDED;
                    self.triggerEvent(PlayerAdapter.EVENTS.ENDED);
                });

                $(targetElement).bind("seeking", function () {
                    self.oldStatus = self.status;
                    self.status =  PlayerAdapter.STATUS.SEEKING;
                    self.triggerEvent(PlayerAdapter.EVENTS.SEEKING);
                });

                $(targetElement).bind("seeked", function () {
                    if (typeof self.oldStatus !== "undefined") {
                        self.status =  self.oldStatus;
                    } else {
                        self.status = PlayerAdapter.STATUS.PLAYING;
                    }
                });

                $(targetElement).bind("timeupdate", function () {
                    if ((self.status == PlayerAdapter.STATUS.PAUSED || self.status == PlayerAdapter.STATUS.SEEKING) && !this.paused && !this.ended && this.currentTime > 0) {
                        self.status = PlayerAdapter.STATUS.PLAYING;
                    }
                    self.triggerEvent(PlayerAdapter.EVENTS.TIMEUPDATE);
                });

                $(targetElement).bind("error", function () {
                    self.status =  PlayerAdapter.STATUS.ERROR_NETWORK;
                    self.triggerEvent(PlayerAdapter.EVENTS.ERROR);
                });

                return this;
            };


            // =================
            // REQUIRED FUNCTIONS
            // =================

            /**
             * Play the video
             */
            this.play = function () {
                // Can the player start now?
                switch (self.status) {
                case PlayerAdapter.STATUS.INITIALIZING:
                case PlayerAdapter.STATUS.LOADING:
                    self.waitToPlay = true;
                    break;
                case PlayerAdapter.STATUS.SEEKING:
                case PlayerAdapter.STATUS.PAUSED:
                case PlayerAdapter.STATUS.PLAYING:
                case PlayerAdapter.STATUS.ENDED:
                    // If yes, we play it
                    targetElement.play();
                    self.status =  PlayerAdapter.STATUS.PLAYING;
                    self.waitToPlay = false;
                    break;
                }
            };

            /**
             * Pause the video
             */
            this.pause = function () {
                targetElement.pause();
            };

            /**
             * Load the video
             */
            this.load = function () {
                self.initialized = false;
                self.status = PlayerAdapter.STATUS.INITIALIZING;
                targetElement.load();
                targetElement.load();
            };

            /**
             * Set the current time of the video
             * @param {double} time The time to set in seconds
             */
            this.setCurrentTime = function (time) {
                targetElement.currentTime = time;
            };

            /**
             * Get the current time of the video
             */
            this.getCurrentTime = function () {
                return targetElement.currentTime;
            };

            /**
             * Get the video duration
             */
            this.getDuration = function () {
                return targetElement.duration;
            };

            /**
             * Get the player status
             */
            this.getStatus = function () {
                return self.status;
            };

            // =================================
            // IMPLEMENTATION SPECIFIC FUNCTIONS
            // ==================================

            /**
             * Get the HTML template for the html representation of the adapter
             */
            this.getHTMLTemplate = function (id) {
                return  "<div id=\"" + id + "\"></div>";
            };

            return self.init();
        };

        return PlayerAdapterHTML5;
    }
);