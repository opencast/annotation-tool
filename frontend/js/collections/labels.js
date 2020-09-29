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
 * A module representing a labels collection
 * @module collections-labels
 */
define(["underscore",
        "backbone",
        "models/label"],

    function (_, Backbone, Label) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-labels
         * @alias module:collections-labels.Labels
         */
        var Labels = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-labels.Labels#initialize
             */
            model: Label,

            /**
             * constructor
             * @alias module:collections-labels.Labels#initialize
             */
            initialize: function (models, options) {
                this.category = options.category;
            },

            /**
             * Parse the given data
             * @alias module:collections-labels.Labels#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the labels
             */
            parse: function (resp) {
                if (resp.labels && _.isArray(resp.labels)) {
                    return resp.labels;
                } else if (_.isArray(resp)) {
                    return resp;
                } else {
                    return null;
                }
            },

            /**
             * Get the url for this collection
             * @alias module:collections-labels.Labels#url
             * @return {String} The url of this collection
             */
            url: function () {
                // If the category belongs to a series, access the labels from the respective series category
                if(this.category.get("seriesCategoryId")) {                    
                    return "/categories/" + this.category.get("seriesCategoryId")  + "/labels";
                } else {
                    return _.result(this.category, "url") + "/labels";
                }
            }
        });

        return Labels;
    }
);
