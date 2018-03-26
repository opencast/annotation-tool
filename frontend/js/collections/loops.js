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
 * A module representing an loop collection
 * @module collections-loops
 * @requires jquery
 * @requires underscore
 * @requires models-loop
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "underscore",
        "models/loop",
        "backbone",
        "localstorage"],

    function ($, _, Loop, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-loops
         * @alias module:collections-loops.Loops
         */
        var Loops = Backbone.Collection.extend({
            /**
             * Model of the instances contained in this collection
             * @alias module:collections-loops.Loops#initialize
             */
            model: Loop,

            /**
             * Localstorage container for the collection
             * @alias module:collections-loops.Loops#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Loops"),

            /**
             * Parse the given data
             * @alias module:collections-loops.Loops#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the loops
             */
            parse: function (data) {
                if (data.loops && _.isArray(data.loops)) {
                    return data.loops;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            comparator: function (loop) {
                return loop.get("start");
            }
        });

        return Loops;
    }
);
