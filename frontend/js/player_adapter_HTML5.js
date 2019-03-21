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
 * A module representing the player adapter implementation for the HTML5 native player
 * @module player-adapter-HTML5
 * @requires jQuery
 * @requires player-adapter
 * @requires mediaelementplayer
 * @requires Hls
 */
define(["jquery",
        "player-adapter",
        "mediaelementplayer",
        "Hls"],

    function ($, PlayerAdapter, mejs, Hls) {

        "use strict";

        /**
         * Implementation of the player adapter for the HTML5 native player
         * @constructor
         * @alias module:player-adapter-HTML5.PlayerAdapterHTML5
         * @augments {module:player-adapter.PlayerAdapter}
         * @param {HTMLElement} targetElement DOM Element representing the player
         */
        var PlayerAdapterHTML5 = function (targetElement, sources) {
            PlayerAdapter.apply(this, arguments);

            var self = this;

            // Check if the given target Element is valid
            if (!(targetElement instanceof HTMLElement)) {
                throw "The given target element must not be null and have to be a vaild HTMLElement!";
            }

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

            var mediaElementPlayer;
            var mediaElement = targetElement;

            /**
             * Initilize the player adapter
             * @inner
             */
            this.init = function () {

                targetElement.style.width = "100%";
                targetElement.style.height = "100%";
                targetElement.preload = "auto";
                //targetElement.muted = true;
                
                window.Hls = Hls;
                mediaElementPlayer = new mejs.MediaElementPlayer(targetElement, {
                    renderers: ['html5', 'native_hls'],
                    hls: {
                        //debug: true
                    },
                    alwaysShowControls: true,
                    stretching: "fill",
                    success: function (wrapper) {
                        mediaElement = wrapper;

                        if (Hls !== undefined) {
                            mediaElement.addEventListener(Hls.Events.MEDIA_ATTACHED, function () {
                                // All the code when this event is reached...
                                console.log('Media attached!');


                            });
                
                            // Manifest file was parsed, invoke loading method
                            mediaElement.addEventListener(Hls.Events.MANIFEST_PARSED, function () {
                                // All the code when this event is reached...
                                console.log('Manifest parsed!');
                
                            });
                
                            mediaElement.addEventListener(Hls.Events.FRAG_PARSING_METADATA, function (event, data) {
                                // All the code when this event is reached...
                                //console.log(data);
                            });
                        }
                        /**
                         * Listen the events from the native player
                         */
                        $(mediaElement).bind("canplay durationchange", function () {
                            // If duration is still not valid
                            if (isNaN(self.getDuration()) || mediaElement.readyState < 1) {
                                return;
                            }

                            if (!self.initialized) {
                                self.initialized = true;
                            }

                            // If duration is valid, we changed status
                            self.status = PlayerAdapter.STATUS.PAUSED;
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.READY));

                            if (self.waitToPlay) {
                                self.play();
                            }
                        });

                        $(mediaElement).bind("play", function () {
                            if (!self.initialized) {
                                return;
                            }

                            self.status = PlayerAdapter.STATUS.PLAYING;
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.PLAY));
                        });

                        $(mediaElement).bind("playing", function () {
                            self.status =  PlayerAdapter.STATUS.PLAYING;
                        });

                        $(mediaElement).bind("pause", function () {
                            if (!self.initialized) {
                                return;
                            }

                            self.status = PlayerAdapter.STATUS.PAUSED;
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.PAUSE));
                        });

                        $(mediaElement).bind("ended", function () {
                            self.status = PlayerAdapter.STATUS.ENDED;
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.ENDED));
                        });

                        $(mediaElement).bind("seeking", function () {
                            self.oldStatus = self.status;
                            self.status = PlayerAdapter.STATUS.SEEKING;
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.SEEKING));
                        });

                        $(mediaElement).bind("seeked", function () {
                            if (typeof self.oldStatus !== "undefined") {
                                self.status = self.oldStatus;
                            } else {
                                self.status = PlayerAdapter.STATUS.PLAYING;
                            }
                        });

                        $(mediaElement).bind("timeupdate", function () {
                            if (
                                (self.status == PlayerAdapter.STATUS.PAUSED || self.status == PlayerAdapter.STATUS.SEEKING)
                                    && !this.paused && !this.ended && this.currentTime > 0
                            ) {
                                self.status = PlayerAdapter.STATUS.PLAYING;
                            }
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.TIMEUPDATE));
                        });

                        $(mediaElement).bind("error", function () {
                            self.status = PlayerAdapter.STATUS.ERROR_NETWORK;
                            self.dispatchEvent(new Event(PlayerAdapter.EVENTS.ERROR));
                        });

                        $(mediaElement).bind("contextmenu", function (e) {
                            e.preventDefault();
                        });
                        

                        if (sources) {
                            mediaElement.setSrc(sources);
                        }
                    }
                });



                return this;
            };

            // ==================
            // REQUIRED FUNCTIONS
            // ==================

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
                    mediaElement.play();
                    self.status =  PlayerAdapter.STATUS.PLAYING;
                    self.waitToPlay = false;
                    break;
                }
            };

            /**
             * Pause the video
             */
            this.pause = function () {
                mediaElement.pause();
            };

            /**
             * Load the video
             */
            this.load = function () {
                self.initialized = false;
                self.status = PlayerAdapter.STATUS.INITIALIZING;
                
                mediaElement.load();
                mediaElement.load();

            };

            /**
             * Set the current time of the video
             * @param {double} time The time to set in seconds
             */
            this.setCurrentTime = function (time) {
                mediaElement.currentTime = time;
            };

            /**
             * Get the current time of the video
             */
            this.getCurrentTime = function () {
                return mediaElement.currentTime;
            };

            /**
             * Get the video duration
             */
            this.getDuration = function () {
                return mediaElement.duration;
            };

            /**
             * Get the player status
             */
            this.getStatus = function () {
                return self.status;
            };

            /**
             * Make the player fill its container
             */
            this.resetSize = function () {
                mediaElementPlayer.resetSize();
            };

            return this.init();
        };

        PlayerAdapterHTML5.prototype = Object.create(PlayerAdapter.prototype);

        return PlayerAdapterHTML5;
    }
);
