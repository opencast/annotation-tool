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
 * A module representing a scales collection
 * @module collections-scales
 */
define(
    [
        "underscore",
        "models/scale",
        "backbone"
    ],
    function (
        _,
        Scale,
        Backbone
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-scales
         */
        var Scales = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             */
            model: Scale,

            /**
             * constructor
             */
            initialize: function (models, options) {
                console.warn("scales: initialize");
                this.video = options.video;
            },

            /**
             * Parse the given data
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the scales
             */
            parse: function (data) {
                console.warn("scales: parse");
                if (data.scales && _.isArray(data.scales)) {
                    return data.scales;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            /**
             * Get the url for this collection
             * @return {String} The url of this collection
             */
            url: function () {
                return (this.video ? _.result(this.video, "url") : "") + "/scales";
            }
        });

        return Scales;
    }
);
