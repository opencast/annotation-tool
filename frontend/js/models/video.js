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
             * (Re-)Fetch the scale values once our ID changes.
             */
            fetchChildren: function () {
                this.get("categories").fetch({ async: false });
                this.get("tracks").fetch({ async: false });
                this.get("scales").fetch({ async: false });
                this.trigger("ready");
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
             * @param {(Category | null)?} category
             *     A category to filter the returned annotations by.
             *     <code>null</code> means free text annotations.
             *     <code>undefined</code> means all annotations.
             */
            getAnnotations: function (category) {
                var result = [];
                var handleAnnotation;
                if (_.isUndefined(category)) {
                    handleAnnotation = _.bind(Array.prototype.push, result);
                } else if (category) {
                    handleAnnotation = function (annotation) {
                        var label = annotation.get("label");
                        if (label && label.category.id === category.id) {
                            result.push(annotation);
                        }
                    };
                } else {
                    handleAnnotation = function (annotation) {
                        if (!annotation.get("label")) {
                            result.push(annotation);
                        }
                    };
                }
                this.get("tracks").each(function (track) {
                    track.annotations.each(handleAnnotation);
                });
                return result;
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
