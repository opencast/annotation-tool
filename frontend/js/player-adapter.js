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
 * @requires event-target
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

    /**
     * Play the media element in the player.
     */
    PlayerAdapter.prototype.play = function () {
        throw "Function 'play' must be implemented in player adapter!";
    };

    /**
     * Set the media element in the player in pause mode.
     */
    PlayerAdapter.prototype.pause = function () {
        throw "Function 'pause' must be implemented in player adapter!";
    };

    /**
     * Set the current time of the media element in the player to the given one.
     * If the given value is not value, does not set it and write a warning in the console.
     * @param {double} the new time
     */
    PlayerAdapter.prototype.setCurrentTime = function () {
        throw "Function 'setCurrentTime' must be implemented in player adapter!";
    };

    /**
     * Get the current time of the media element.
     * @return {double} current time
     */
    PlayerAdapter.prototype.getCurrentTime = function () {
        throw "Function 'getCurrentTime' must be implemented in player adapter!";
    };

    /**
     * Get the media element duration.
     * @return {double} current time
     */
    PlayerAdapter.prototype.getDuration = function () {
        throw "Function 'getDuration' must be implemented in player adapter!";
    };

    /**
     * Get the media element duration
     * @return {double} duration
     */
    PlayerAdapter.prototype.getStatus = function () {
        throw "Function 'getStatus' must be implemented in player adapter!";
    };

    /**
     * Optional function to test interface implementation
     * @return {boolean} true if the implementation is valid
     */
    PlayerAdapter.prototype.isValid = function () {
        var errors = "",
            // All interface properties
            properties = {
                play          : "function",
                pause         : "function",
                setCurrentTime: "function",
                getCurrentTime: "function",
                getDuration   : "function",
                getStatus     : "function"
            },
            property;

        for (property in properties) {
            // If this is not a required property, we do not check it.
            if (typeof properties[property] !== "string") {
                continue;
            }

            // If the function is not implementated
            if (typeof this[property] === "undefined") {
                errors += "-" + property + " is not implemented! \n";
            }

            // If the implementation is not valid
            if (typeof this[property] !== properties[property]) {
                errors += "-" + property + " is not a valid implementation, type should be " + properties[property] + "! \n";
            }
        }

        if (errors !== "") {
            console.warn("Player adapter implementation not valid! \n" + errors);
            return false;
        }

        return true;
    };

    // Return the complete interface
    return PlayerAdapter;
});
