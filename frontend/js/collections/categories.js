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
 * A module representing a categories collection
 * @module collections-categories
 */
define(
    [
        "underscore",
        "models/category",
        "backbone"
    ],
    function (
        _,
        Category,
        Backbone
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-categories
         */
        var Categories = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             */
            model: Category,

            /**
             * constructor
             */
            initialize: function (models, options) {
                this.video = options.video;
                this.mySeriesExtId = options.seriesExtId;
            },

            /**
             * Get the url for this collection
             * @return {String} The url of this collection
             */
            url: function () {
                return (this.video ? _.result(this.video, "url") : "")
                + "/categories/"
                + (this.mySeriesExtId ? "?seriesExtId=" + this.mySeriesExtId : "");
            },

            /**
             * Parse the given data
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the categories
             */
            parse: function (data) {
                if (data.categories && _.isArray(data.categories)) {
                    return data.categories;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            }
        });

        return Categories;
    }
);
