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
 * @requires underscore
 * @requires models-scalevalue
 * @requires backbone
 */
define(["underscore",
        "models/scalevalue",
        "backbone"],

    function (_, ScaleValue, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-scalevalues
         * @alias module:collections-scalevalues.ScaleValues
         */
        var ScaleValues = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-scalevalues.ScaleValues#initialize
             */
            model: ScaleValue,

            /**
             * constructor
             * @alias module:collections-scalevalues.ScaleValues#initialize
             */
            initialize: function (models, scale) {
                this.scale = scale;
            },

            /**
             * Parse the given data
             * @alias module:collections-scalevalues.ScaleValues#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the scalevalues
             */
            parse: function (data) {
                if (data.scaleValues && _.isArray(data.scaleValues)) {
                    return data.scaleValues;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            comparator: function (scaleValue) {
                return scaleValue.get("order");
            },

            /**
             * Get the url for this collection
             * @alias module:collections-scalevalues.ScaleValues#url
             * @return {String} The url of this collection
             */
            url: function () {
                return _.result(this.scale, "url") + "/scalevalues";
            }
        });

        return ScaleValues;
    }
);
