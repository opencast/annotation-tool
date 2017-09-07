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
 * @requires underscore
 */
define(
    ["underscore"],
    function (_) {
        "use strict";

        var util = {
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
            },

            /**
             * Tries to parse many different things to a date.
             * @param value A thing hopefully representing a date
             * @returns {Date|undefined} <code>value</code> interpreted as a <code>Date</code> or <code>undefined</code> if that failed
             */
            parseDate: function (value) {
                var date = new Date(value);
                return _.isNaN(date.getTime()) ? undefined : date;
            },

            /**
             * Test whether two values represent the same date.
             * The values are converted to dates using {@link parseDate} before comparing their respective timestamps.
             * @param value1 The first value
             * @param value2 The second value
             * @returns {Boolean} <code>true</code> if the values represent the same date, <code>false</code> otherwise
             */
            datesEqual: function (value1, value2) {
                return util.parseDate(value1).getTime() === util.parseDate(value2).getTime();
            },

            /**
            * Parse the given parameter to JSON if given as String
            * @alias module:models-resource.Resource.parseJSONString
            * @param  parameter the parameter as String
            * @return {Object} parameter as JSON object
            */
            parseJSONString: function (parameter) {
                if (parameter && _.isString(parameter)) {
                    try {
                        parameter = JSON.parse(parameter);
                    } catch (e) {
                        console.warn("Can not parse parameter \"" + parameter + "\": " + e);
                        return undefined;
                    }
                } else if (!_.isObject(parameter) || _.isFunction(parameter)) {
                    return undefined;
                }

                return parameter;
            }
        };

        return util;
    }
);
