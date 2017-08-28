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
 * A module representing the label model
 * @module models-label
 * @requires jQuery
 * @requires underscore
 * @requires ACCESS
 * @requires backbone
 * @requires models/resource
 */
define(["jquery",
        "underscore",
        "access",
        "backbone",
        "models/resource"],

    function ($, _, ACCESS, Backbone, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-label
         * @alias module:models-label.Label
         */
        var Label = Resource.extend({

            /**
             * Default models value
             * @alias module:models-label.Label#defaults
             * @type {map}
             * @static
             */
            defaults: {
                access    : ACCESS.PUBLIC
            },

             /**
             * Constructor
             * @alias module:models-label.Label#initialize
             * @param {object} attr Object literal containing the model initialion attribute.
             */
            initialize: function (attr) {

                if (!attr || _.isUndefined(attr.value)) {
                    throw "'value' attribute is required";
                }

                if (!attr || _.isUndefined(attr.abbreviation)) {
                    throw "'abbreviation' attribute is required";
                }

                if (!attr || _.isUndefined(attr.category)) {
                    throw "'category' attribute is required";
                }

                Resource.prototype.initialize.apply(this, arguments);

                if (attr.category && attr.category.attributes) {
                    this.set("category", attr.category.toJSON());
                }
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-label.Label#parse
             * @param  {object} data Object literal containing the model attribute to parse.
             * @return {object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                return Resource.prototype.parse.call(this, data, function (attr) {
                    if (attr.category && attr.category.settings) {
                        attr.category.settings = this.parseJSONString(attr.category.settings);
                    }

                    if (annotationsTool.user.get("id") === attr.created_by) {
                        attr.isMine = true;
                    } else {
                        attr.isMine = false;
                    }
                });
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-label.Label#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.value &&  !_.isString(attr.value)) {
                    return "'value' attribute must be a string!";
                }

                if (attr.abbreviation &&  !_.isString(attr.abbreviation)) {
                    return "'abbreviation' attribute must be a string!";
                }

                if (attr.description &&  !_.isString(attr.description)) {
                    return "'description' attribute must be a string!";
                }

                if (attr.category &&  !_.isObject(attr.category)) {
                    return "'category' attribute must be a JSON Object!";
                }
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-label.Label#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Backbone.Model.prototype.toJSON.call(this);
                if (json.tags) {
                    json.tags = JSON.stringify(json.tags);
                }
                if (json.category && json.category.toJSON) {
                    json.category = json.category.toJSON();
                }
                return json;
            },

            /**
             * Prepare the model as JSON to export and return it
             * @alias module:models-label.Label#toExportJSON
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function () {
                var json = {
                    value: this.attributes.value,
                    abbreviation: this.attributes.abbreviation
                };

                if (this.attributes.tags) {
                    json.tags = JSON.stringify(this.attributes.tags);
                }

                if (this.attributes.description) {
                    json.description = this.attributes.description;
                }

                if (this.attributes.settings) {
                    json.settings = this.attributes.settings;
                }

                if (this.attributes.tags) {
                    json.tags = this.attributes.tags;
                }

                return json;
            }
        });
        return Label;
    }
);