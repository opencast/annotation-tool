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
 * A module representing the scale model
 * @module models-scale
 */
define(
    [
        "underscore",
        "collections/scalevalues",
        "models/resource"
    ],
    function (
        _,
        ScaleValues,
        Resource
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-scale
         */
        var Scale = Resource.extend({
            _INFO_MODEL_SCALE: true,

            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /** @override */
            keepDeleted: true,

            /**
             * Default model values
             */
            defaults: function () {
                return {
										// Todo: This new init might be culprit (???)
										// It might generate a scale with scale values '0'
										//
										// >>> var previousScaleValues = this.model.get("scaleValues");
										// >>> models[0].attributes.value = 0 => Error ???
										//
                    scaleValues: new ScaleValues([], { scale: this })
                };
            },

            /**
             * (Re-)Fetch the scale values once our ID changes.
             */
            fetchChildren: function () {
                this.attributes.scaleValues.fetch({ async: false });
            },

            /**
             * Validate the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.name && !_.isString(attr.name)) {
                    return "'name' attribute must be a string";
                }

                if (attr.description && !_.isString(attr.description)) {
                    return "'description' attribute must be a string";
                }

                return undefined;
            },

            /**
             * Parse the attribute list passed to the model
             * @param {object} data Object literal containing the model attribute to parse.
             * @return {object} The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                // The API might return the values of this scale as part of the response
                // for asking for a scale. If this is the case, we want to parse it
                // (the JSON data of the scale values) into a proper Backbone collection
                // for easier access and manipulation.
                if (data.scaleValues) {
                    data.scaleValues = new ScaleValues(data.scaleValues, { scale: this });
                }
                return data;
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);

                delete json.scaleValues;

                return json;
            },

            /**
             * Prepare the model as JSON to export and return it
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function () {
                var json = {
                    id: this.id,
                    name: this.attributes.name,
                    scaleValues: this.attributes.scaleValues
                        .filter(function (scaleValue) {
                            return !scaleValue.get("deleted_at");
                        })
                        .map(function (scaleValue) {
                        return scaleValue.toExportJSON();
                    })
                };

                if (this.attributes.description) {
                    json.description = this.attributes.description;
                }

                return json;
            }
        });
        return Scale;
    }
);
