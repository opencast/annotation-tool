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

            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /**
             * Constructor
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                _.bindAll(this, "toExportJSON");

                Resource.prototype.initialize.apply(this, arguments);

                if (attr.scaleValues && _.isArray(attr.scaleValues)) {
                    this.set({ scaleValues: new ScaleValues(attr.scaleValues, { scale: this }) });
                } else {
                    this.set({ scaleValues: new ScaleValues([], { scale: this }) });
                }

                if (attr.id) {
                    this.attributes.scaleValues.fetch({async: false});
                }
            },

            /**
             * Validate the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var scalevalues;

                var invalidResource = Resource.prototype.validate.call(this, attr, {
                    onIdChange: function () {
                        scalevalues = this.attributes.scaleValues;

                        if (scalevalues && (scalevalues.length) === 0) {
                            scalevalues.fetch({async: false});
                        }
                    }
                });
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
                    scaleValues: this.attributes.scaleValues.map(function (scaleValue) {
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
