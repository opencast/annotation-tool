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
 * @requires jQuery
 * @requires underscore
 * @requires ACCESS
 * @requires collections-scalevalues
 * @requires backbone
 * @requires models/resource
 */
define(["jquery",
        "underscore",
        "access",
        "collections/scalevalues",
        "backbone",
        "models/resource"],

    function ($, _, ACCESS, ScaleValues, Backbone, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-scale
         * @alias module:models-scale.Scale
         */
        var Scale = Resource.extend({

            /**
             * Default models value
             * @alias module:models-scale.Scale#defaults
             * @type {map}
             * @static
             */
            defaults: {
                created_at: null,
                created_by: null,
                updated_at: null,
                updated_by: null,
                deleted_at: null,
                deleted_by: null,
                access: ACCESS.PRIVATE
            },

            /**
             * Constructor
             * @alias module:models-scale.Scale#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                _.bindAll(this, "toExportJSON");

                if (!attr  || _.isUndefined(attr.name)) {
                    throw "'name' attribute is required";
                }

                Resource.prototype.initialize.apply(this, arguments);

                if (attr.scaleValues && _.isArray(attr.scaleValues)) {
                    this.set({scaleValues: new ScaleValues(attr.scaleValues, this)});
                } else {
                    this.set({scaleValues: new ScaleValues([], this)});
                }

                if (attr.id) {
                    this.attributes.scaleValues.fetch({async: false});
                }
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-scale.Scale#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var scalevalues;

                var invalidResource = Resource.prototype.validate.call(this, attr, {
                    onIdChange: function () {
                        this.setUrl();

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
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-scale.Scale#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);

                delete json.scaleValues;

                return json;
            },

            /**
             * Prepare the model as JSON to export and return it
             * @alias module:models-scale.Scale#toExportJSON
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function () {
                var json = {
                    id: this.id,
                    name: this.attributes.name,
                    scaleValues: this.attributes.scaleValues.toExportJSON()
                };

                if (this.attributes.tags) {
                    json.tags = JSON.stringify(this.attributes.tags);
                }

                if (this.attributes.description) {
                    json.description = this.attributes.description;
                }

                return json;
            },

            /**
             * Modify the current url for the annotations collection
             * @alias module:models-scale.Scale#setUrl
             */
            setUrl: function () {
                if (this.attributes.scaleValues) {
                    this.attributes.scaleValues.setUrl(this);
                }
            }
        });
        return Scale;
    }
);