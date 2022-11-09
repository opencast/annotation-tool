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
 * A module representing a scale values collection
 * @module collections-scalevalues
 */
define(
    [
        "underscore",
        "models/scalevalue",
        "backbone"
    ],
    function (
        _,
        ScaleValue,
        Backbone
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-scalevalues
         */
        var ScaleValues = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             */
            model: ScaleValue,

            /**
             * constructor
             */
            initialize: function (models, options) {
                this.scale = options.scale;
            },

            /**
             * Parse the given data
             *
             * @todo CC | (See commit message) Review by Backbone expert - Maybe it can be simplified OR is needed in other collections 'parse' too
             * @todo CC | (See commit message) Backbone update from 0.99 -> 1.0.0 (9.1.0 = '... parse now receives options as its second argument.')
             * @todo CC | (See commit message) Reference: https://github.com/jashkenas/backbone/compare/0.9.9...0.9.10
             * @param {object} data {scaleValues:[{...}], ...} | {scaleValues:[], ...} Object or array containing data to parse (e.g. on application startup).
             * @param {object} options {data:[], ...} | {data:[{...}], ...} Object containing data to parse (only if saved directly).
             * @return {object} The part of the given data related to the scalevalues
             */
            parse: function (data, options) {
                if (options.data.length) {
                    return options.data;
                }

                if (data.scaleValues.length) {
                    return data.scaleValues;
                }

                return null;
            },

            comparator: function (scaleValue) {
                return scaleValue.get("order");
            },

            /**
             * Get the url for this collection
             * @return {String} The url of this collection
             */
            url: function () {
                return _.result(this.scale, "url") + "/scalevalues";
            }
        });

        return ScaleValues;
    }
);
