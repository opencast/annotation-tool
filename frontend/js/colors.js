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

    function ColorManager(categories) {
        this.categories = categories;
    }

    ColorManager.COLORS = COLORS;

    ColorManager.prototype.getNextColor = function () {
        var usedColorCounts = this.categories.chain()
            .groupBy(function (category) {
                return category.get("settings").color
                    .slice(1); // Remove the `#`-prefix
            })
            .mapObject("length")
            .value();

        return _.min(COLORS, function (color) {
            return usedColorCounts[color] || 0;
        });
    };

    return ColorManager;
});
