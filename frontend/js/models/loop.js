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
 */

/**
 * A module representing the loop model
 * @module models-loop
 * @requires jquery
 * @requires underscore
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "underscore",
        "backbone",
        "localstorage"],

    function ($, _, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-loop
         * @alias module:models-loop.Loop
         */
        var Loop = Backbone.Model.extend({
            /**
             * Validate the attribute list passed to the model
             * @alias module:models-loop.Loop#validate
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                if (_.isUndefined(attr.start) || _.isUndefined(attr.end)) {
                    return "The attributes 'start' and 'end' are required for the loop model!";
                }

                if (!_.isNumber(attr.start) || !_.isNumber(attr.end) || attr.start < 0 || attr.end < 0) {
                    return "Start and end points must be valid number!";
                }

                if (attr.start > attr.end) {
                    return "The start point is after the end point!";
                }

                return undefined;
            }
        });

        return Loop;
    }
);
