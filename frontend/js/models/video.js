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
 * A module representing the video model
 * @module models-video
 */
define(
    [
        "underscore",
        "access",
        "collections/tracks",
        "collections/categories",
        "collections/scales",
        "models/resource"
    ],
    function (
        _,
        ACCESS,
        Tracks,
        Categories,
        Scales,
        Resource
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-video
         */
        var Video = Resource.extend({

            /**
             * REST endpont for this model
             * @type {string}
             */
            urlRoot: "/videos",

            /**
             * Define that all post operation have to been done through PUT method
             * @type {boolean}
             */
            noPOST: true,

            /**
             * Default model values
             */
            defaults: function () {
                return {
                    access: ACCESS.PUBLIC,
                    tracks: new Tracks([], { video: this }),
                    categories: new Categories([], { video: this }),
                    scales: new Scales([], { video: this })
                };
            },

            /**
             * Constructor
             */
            initialize: function () {
                _.bindAll(this,
                    "getLabels");

                this.get("categories").seriesExtId = this.get("series_extid");
                Resource.prototype.initialize.apply(this, arguments);
            },

            /**
             * (Re-)Fetch all the other data once our ID changes.
             */
            fetchChildren: function () {
                this.get("categories").fetch({ async: false });
                this.get("tracks").fetch({ async: false });
                this.get("scales").fetch({ async: false });
            },

            /**
             * Validate the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.tracks && !(attr.tracks instanceof Tracks)) {
                    return "'tracks' attribute must be an instance of 'Tracks'";
                }

                return undefined;
            },

            /**
             * @return {Annotation[]} This video's annotations
             *     across all tracks, potentially filtered
             *     by a given category.
             * @param {Category?} category
             *     A category to filter the returned annotations by.
             *     Falsy values mean free text annotations.
             */
            getAnnotations: (function () {
                return function (category) {
                    return this.get("tracks").chain()
                        .map(_.property(["annotations", "models"]))
                        .flatten()
                        .filter(filter(category))
                        .value();
                };

                function filter(category) {
                    if (category) {
                        return withCategory(category);
                    } else {
                        return withoutCategory;
                    }
                }

                function withoutCategory(annotation) {
                    var labels = annotation.getLabels();
                    return !labels.length;
                }

                function withCategory(category) {
                    return function (annotation) {
                        var labels = annotation.getLabels();
                        var anyMatches = _.some(labels, function (label) {
                            return category.id === label.get('category').id;
                        });
                        return anyMatches;
                    };
                }
            })(),

            /**
             * Get all labels present in all of this video's categories
             * @alias module:models-video.Video#getLabels
             * @return {array} an array of all the labels
             */
            getLabels: function() {
                return _.flatten(this.get("categories").map(
                    function (category) {
                        return category.get("labels").models;
                    }
                ));
            },

            /**
             * Get all scale values present in all of this video's categories
             * @alias module:models-video.Video#getScaleValues
             * @return {array} an array of all the scale values
             */
            getScaleValues: function() {
                return _.flatten(this.get("scales").map(
                    function (scale) {
                        return scale.get("scaleValues").models;
                    }
                ));
            },

            /**
             * Get questionnaire.
             * @alias module:models-video.Video#getQuestionnaire
             * @return {object|undefined} an object describing a questionnaire if there is one connected to this video
             */
            getQuestionnaire: function() {
                // TODO: this has to be provided by the backend
                // return undefined
                return {};
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);
                delete json.tracks;
                delete json.categories;
                delete json.scales;

                return json;
            }
        });
        return Video;
    }
);
