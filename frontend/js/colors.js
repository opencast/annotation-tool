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
 * A module containing the COLORS values.
 * @module COLORS
 */
define([
    "underscore"
], function (
    _
) {
    "use strict";

    var COLORS = [
        "ffff99",
        "ffd800",
        "ffcc99",
        "ffa800",
        "ff7800",
        "c36e00",
        "d5d602",
        "d9be6c",
        "ff99cc",
        "ff5d7c",
        "da0000",
        "d15c49",
        "969601",
        "adfded",
        "8fc7c7",
        "a4d2ff",
        "00ccff",
        "64b0e8",
        "61ae24",
        "9ded0a",
        "92ffaa",
        "c0adfd",
        "ac5bff",
        "6569ff"
    ];

    return function () {

        var self = this,
            // colors map with usage number as value
            colors = {};

        /**
         * Get all colors as string in an array
         */
        this.getColors = function () {
            return COLORS;
        };

        /**
         * Returns the next color the less used
         */
        this.getNextColor = function () {
            var maxValue = -1,
                lookForColor = function (value, color) {
                    if (value <= maxValue) {
                        nextColor = color;
                        colors[color]++;
                        return true;
                    }
                },
                nextColor;


            // Look for colors with the less usage
            do {
                maxValue++;
                _.find(colors, lookForColor, self);
            } while (_.isUndefined(nextColor));

            return nextColor;
        };

        /**
         * Update the colors usage with the given categories
         */
        this.updateColors = function (categories) {
            _.each(categories, function (category) {
                var settings = category.get("settings"),
                    color;

                if (!_.isUndefined(settings) && !_.isUndefined(settings.color)) {
                    color = settings.color.replace("#", "");
                    if (!_.isUndefined(colors[color])) {
                        colors[color]++;
                    }
                }
            }, self);
        };

        // Generate colors map with usage sum
        _.each(COLORS, function (color) {
            colors[color] = 0;
        }, self);


        return self;
    };
});
