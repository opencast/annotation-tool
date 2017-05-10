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
 * @requires jQuery
 * @requires ACCESS
 * @requires backbone
 */
define(["jquery",
        "access",
        "backbone"],

    function ($, ACCESS, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-scalevalue
         * @alias module:models-scalevalue.Scalevalue
         */
        var ScaleValue = Backbone.Model.extend({

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

                if (window.annotationsTool.localStorage) {
                    if (!attr.created_by) {
                        attr.created_by = annotationsTool.user.get("id");
                    }

                    if (!attr.created_by_nickname) {
                        attr.created_by_nickname = annotationsTool.user.get("nickname");
                    }

                    if (!attr.created_at) {
                        attr.created_at = new Date();
                    }
                }

                if ((attr.created_by && annotationsTool.user.get("id") === attr.created_by) || !attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                this.set(attr);
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-scalevalue.Scalevalue#parse
             * @param  {object} data Object literal containing the model attribute to parse.
             * @return {object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                var attr = data.attributes ? data.attributes : data;

                if (!_.isUndefined(attr.created_at)) {
                    attr.created_at = Date.parse(attr.created_at);
                }

                if (!_.isUndefined(attr.updated_at)) {
                    attr.updated_at = Date.parse(attr.updated_at);
                }

                if (!_.isUndefined(attr.deleted_at)) {
                    attr.deleted_at = Date.parse(attr.deleted_at);
                }

                if (annotationsTool.user.get("id") === attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                if (data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-scalevalue.Scalevalue#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var tmpCreated;

                if (attr.id) {
                    if (this.get("id") !== attr.id) {
                        attr.id = this.cid;
                    }
                }

                if (attr.name && !_.isString(attr.name)) {
                    return "'name' attribute must be a string";
                }

                if (attr.value && !_.isNumber(attr.value)) {
                    return "'value' attribute must be a number";
                }

                if (attr.order && !_.isNumber(attr.order)) {
                    return "'order' attribute must be a number";
                }

                if (attr.access && !_.include(ACCESS, attr.access)) {
                    return "'access' attribute is not valid.";
                }

                if (attr.created_at) {
                    if ((tmpCreated = this.get("created_at")) && tmpCreated !== attr.created_at) {
                        return "\"created_at\" attribute can not be modified after initialization!";
                    }
                }

                if (attr.updated_at && !_.isNumber(attr.updated_at)) {
                    return "'updated_at' attribute must be a number!";
                }

                if (attr.deleted_at && !_.isNumber(attr.deleted_at)) {
                    return "'deleted_at' attribute must be a number!";
                }
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-scalevalue.Scalevalue#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = $.proxy(Backbone.Model.prototype.toJSON, this)();

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