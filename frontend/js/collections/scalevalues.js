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
                console.warn("scalevalues: initialize");
                console.log(models, options);

                this.scale = options.scale;
            },

            /**
             * Parse the given data
             *
             * @todo CC | Review: 'data.scaleValues' is emptied when 'scale' model is saved and never contains sth.
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the scalevalues
             */
            parse: function (data, options) {
                console.warn("scalevalues: parse");
                console.log(data, options);

                if (options.data && _.isArray(options.data)) {
                    console.warn("scalevalues: parse / options.data RETURN");
                    console.log(options.data);
                    return options.data;
                } else {
                    console.warn("scalevalues: parse / null RETURN");
                    return null;
                }

                // Maybe helpful / Alternative?
                // - if (options.add|parse …) …

                /* Old code for comparison * /
                if (data.scaleValues && _.isArray(data.scaleValues)) {
                    return data.scaleValues;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
                /* */
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
            },
        });

        return ScaleValues;
    }
);
