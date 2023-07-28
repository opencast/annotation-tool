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
define(
    [
        "underscore",
        "backbone",
        "models/label"
    ],
    function (
        _,
        Backbone,
        Label
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-labels
         */
        var Labels = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             */
            model: Label,

            /**
             * constructor
             */
            initialize: function (models, options) {
                this.category = options.category;
            },

            /*
             * Sorts the given data
             * @alias module:collections-categories.Categories#sort
             * @param  {object} data Object or array containing the data to sort.
             * @return {object} sorted data
             */
            sort: function (data) {
                return data.sort((a, b) => {
                    var aa = a.abbreviation.toLowerCase();
                    var ab = b.abbreviation.toLowerCase();
                    if(aa < ab) { return -1; }
                    if(aa > ab) { return 1; }
                    return 0;
                });
            },

            /**
             * Parse the given data
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the labels
             */
            parse: function (resp) {
                if (resp.labels && _.isArray(resp.labels)) {
                    // sort by abbreviation of label
                    return this.sort(resp.labels);
                } else if (_.isArray(resp)) {
                    // sort by abbreviation of label
                    return this.sort(resp);
                } else {
                    return null;
                }
            },

            /**
             * Get the url for this collection
             * @return {String} The url of this collection
             */
            url: function () {
                return _.result(this.category, "url") + "/labels";
            }
        });

        return Labels;
    }
);
