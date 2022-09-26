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
 * A module representing the scalevalue model
 * @module models-scalevalue
 */
define(
    [
        "underscore",
        "models/resource"
    ],
    function (
        _,
        Resource
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-scalevalue
         */
        var ScaleValue = Resource.extend({
            _INFO_MODEL_SCALE_VALUE: true,

            /**
             * Default models value
             * @type {map}
             * @static
             */
            defaults: {
                value: 0
            },

            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /** @override */
            keepDeleted: true,

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

                if (attr.value && !_.isNumber(attr.value)) {
                    return "'value' attribute must be a number";
                }

                if (attr.order && !_.isNumber(attr.order)) {
                    return "'order' attribute must be a number";
                }

                return undefined;
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);

                if (json.scale && json.scale.attributes) {
                    json.scale = this.attributes.scale.toJSON();
                }
                return json;
            },

            /**
             * Prepare the model as JSON to export and return it
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function () {
                var json = {
                    name: this.attributes.name,
                    value: this.attributes.value,
                    order: this.attributes.order
                };

                if (json.scale && json.scale.attributes) {
                    json.scale = this.attributes.scale.toJSON();
                }

                return json;
            }
        });

        return ScaleValue;
    }
);
