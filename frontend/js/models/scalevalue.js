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
define(["underscore",
        "access",
        "models/resource"],

    function (_, ACCESS, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-scalevalue
         * @alias module:models-scalevalue.Scalevalue
         */
        var ScaleValue = Resource.extend({

            /**
             * Default models value
             * @alias module:models-scalevalue.Scalevalue#defaults
             * @type {map}
             * @static
             */
            defaults: {
                access: ACCESS.PRIVATE,
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null
            },

            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /**
             * Constructor
             * @alias module:models-scalevalue.Scalevalue#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                if (!attr  || _.isUndefined(attr.name) ||
                   _.isUndefined(attr.value) || !_.isNumber(attr.value) ||
                   _.isUndefined(attr.order) || !_.isNumber(attr.order)) {
                    throw "'name, value, order' attributes are required";
                }

                Resource.prototype.initialize.apply(this, arguments);
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-scalevalue.Scalevalue#validate
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
             * @alias module:models-scalevalue.Scalevalue#toJSON
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
             * @alias module:models-scalevalue.Scalevalue#toExportJSON
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
