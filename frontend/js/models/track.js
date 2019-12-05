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
                access: ACCESS.PRIVATE,
                visible: false
            },

            /**
             * Constructor
             * @alias module:models-track.Track#initialize
             * @param {Object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                _.bindAll(this, "fetchAnnotations");

                Resource.prototype.initialize.apply(this, arguments);

                this.annotations = new Annotations(null, { track: this });
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
            fetchAnnotations: function () {

                if (this.annotationsLoaded) return;

                if (!this.get("ready")) {
                    this.once("ready", this.fetchAnnotations);
                }

                this.annotations.fetch({
                    async: false,
                    success: _.bind(function () {
                        this.annotationsLoaded = true;
                    }, this)
                });
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-track.Track#toJSON
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function () {
                return _.omit(
                    Resource.prototype.toJSON.apply(this, arguments),
                    ["visible"]
                );
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
