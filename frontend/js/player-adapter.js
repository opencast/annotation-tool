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
 * A module containing the player adapter prototype
 * @module player-adapter
 */
define(["event-target"], function (EventTarget) {

    "use strict";

    /**
     * Interface for the element making the proxy between the player and the annotations tool
     * @constructor
     * @see {@link https://github.com/entwinemedia/annotations/wiki/Player-adapter-API}
     * @alias module:player-adapter.PlayerAdapter
     */
    var PlayerAdapter = function () {
        EventTarget.apply(this, arguments);
    };

    PlayerAdapter.prototype = Object.create(EventTarget.prototype);

    [
        /**
         * Play the media element in the player.
         * @method play
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "play",

        /**
         * Set the media element in the player in pause mode.
         * @method pause
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "pause",

        /**
         * Get the current time of the media element.
         * @method getCurrentTime
         * @return {number} current time
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "getCurrentTime",

        /**
         * Set the current time of the media element in the player to the given one.
         * If the given value is not value, does not set it and write a warning in the console.
         * @method setCurrentTime
         * @param {number} time the new time
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "setCurrentTime",

        /**
         * Get the media element duration.
         * @method getDuration
         * @return {number} current time
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "getDuration",

        /**
         * Get the media element duration
         * @method getStatus
         * @return {number} duration
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "getStatus",

        /**
         * Make the player fill its parent element
         * @method resetSize
         * @memberof module:player-adapter.PlayerAdapter#
         */
        "resetSize"
    ].forEach(function (method) {
        PlayerAdapter.prototype[method] = function () {
            throw "Function '" + method + "' must be implemented in player adapter!";
        };
    });

    /**
     * Possible player status
     * @readonly
     * @enum {number}
     */
    PlayerAdapter.STATUS = {
        INITIALIZING           : 0,
        LOADING                : 1,
        SEEKING                : 2,
        PAUSED                 : 3,
        PLAYING                : 4,
        ENDED                  : 5,
        ERROR_NETWORK          : 6,
        ERROR_UNSUPPORTED_MEDIA: 7
    };

    /**
     * Player adapter event
     * @readonly
     * @enum {string}
     */
    PlayerAdapter.EVENTS = {
        PLAY      : "pa_play",
        PAUSE     : "pa_pause",
        SEEKING   : "pa_seeking",
        READY     : "pa_ready",
        TIMEUPDATE: "pa_timeupdate",
        ERROR     : "pa_error",
        ENDED     : "pa_ended"
    };

    // Return the complete interface
    return PlayerAdapter;
});
