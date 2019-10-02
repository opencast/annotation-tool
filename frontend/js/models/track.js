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
 * A module representing the track model
 * @module models-track
 */
define([
    "underscore",
    "collections/annotations",
    "access",
    "models/resource"
], function (
    _,
    Annotations,
    ACCESS,
    Resource
) {

    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#Model}
     * @augments module:Backbone.Model
     * @memberOf module:models-track
     * @alias module:models-track.Track
     */
    var Track = Resource.extend(
        /** @lends module:models-track~Track.prototype */
        {
            /**
             * Default models value
             * @alias module:models-scalevalue.Scalevalue#defaults
             * @type {map}
             * @static
             */
            defaults: {
                access: ACCESS.PRIVATE
            },

            /**
             * Constructor
             * @alias module:models-track.Track#initialize
             * @param {Object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                _.bindAll(this,
                          "getAnnotation",
                          "fetchAnnotations");

                if (!attr || _.isUndefined(attr.name)) {
                    throw "'name' attribute is required";
                }

                Resource.prototype.initialize.apply(this, arguments);

                // the tack is not visible at initialisation
                this.set({
                    visible: false,
                    annotationsLoaded: false
                });

                if (attr.annotations && _.isArray(attr.annotations)) {
                    this.set({ annotations: new Annotations(attr.annotations, { track: this }) });
                } else {
                    this.set({ annotations: new Annotations([], { track: this }) });
                }
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-track.Track#validate
             * @param {Object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr, {
                    onIdChange: function () {
                        this.attributes.ready = true;
                        this.trigger("ready", this);
                    }
                });
                if (invalidResource) return invalidResource;

                if (attr.description && !_.isString(attr.description)) {
                    return "'description' attribute must be a string";
                }

                return undefined;
            },

            /**
             * Method to fetch the annotations
             * @alias module:models-track.Track#fetchAnnotations
             */
            fetchAnnotations: function (optSuccess) {
                var self = this,
                    annotations = this.get("annotations"),
                    success = function () {
                        if (!_.isUndefined(optSuccess)) {
                            optSuccess();
                        }

                        self.set("annotationsLoaded", true);
                    };

                if (!this.get("ready")) {
                    this.once("ready", this.fetchAnnotations);
                }

                if (annotations && (annotations.length) === 0) {
                    annotations.fetch({async: false,
                                       add: true,
                                       success: success});
                }
            },

            /**
             * Get the annotation with the given id
             * @alias module:models-track.Track#getAnnotation
             * @param  {Integer} annotationId The id from the wanted annotation
             * @return {Annotation}           The annotation with the given id
             */
            getAnnotation: function (annotationId) {
                return this.get("annotations").get(annotationId);
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-track.Track#toJSON
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);
                delete json.annotations;

                return json;
            }
        }, {
            FIELDS: {
                VISIBLE             : "visible",
                CREATED_BY          : "created_by",
                CREATED_BY_NICKNAME : "created_by_nickname"
            }
        }
    );

    /**
     * @exports Track
     */
    return Track;
});
