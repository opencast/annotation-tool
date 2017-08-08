/**
 *  Copyright 2012, ELAN e.V., Germany
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
 */

/**
 * A module containing helper functions needed in many different places
 * @module util
 */
define(
    [],
    function () {
        "use strict";

        return {
            /**
            * Check whether two closed intervals overlap.
            * Nothe that the <code>start</code> and <code>end</code> properties of the given objects
            * all have to be comparable with one another.
            * @param {Object} interval1 An object representing the first interval.
            * @param interval1.start The start of the interval
            * @param interval2.end The end of the interval
            * @param {Object} interval2 The second interval; see <code>interval1</code>
            * @returns {Boolean} <code>true</code> if the two closed intervals overlap, i.e. also when they just touch;
            * otherwise <code>false</code>
            */
            overlaps: function (interval1, interval2) {
                return interval1.start <= interval2.end && interval2.start <= interval1.end;
            }
        };
    }
);
