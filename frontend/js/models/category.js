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
 * A module representing the category model
 * @module models-category
 */
define(["underscore",
        "collections/labels",
        "access",
        "models/resource",
        "localstorage"],

    function (_, Labels, ACCESS, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-category
         * @alias module:models-category.Category
         */
        var Category = Resource.extend({

            /**
             * Default models value
             * @alias module:models-category.Category#defaults
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
                deleted_by: null,
            },

            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /**
             * Constructor
             * @alias module:models-category.Category#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {

                _.bindAll(this, "toggleVisibility", "validate", "toExportJSON");

                if (!attr || _.isUndefined(attr.name)) {
                    throw "\"name\" attribute is required";
                }

                Resource.prototype.initialize.apply(this, arguments);

                this.set("settings", _.extend({ hasScale: true }, this.get("settings")));

                if (attr.labels && _.isArray(attr.labels)) {
                    this.attributes.labels  = new Labels(attr.labels, { category: this });
                    delete attr.labels;
                } else if (!attr.labels) {
                    this.attributes.labels  = new Labels([], { category: this });
                } else if (_.isObject(attr.labels) && attr.labels.model) {
                    this.attributes.labels = new Labels(attr.labels.models, { category: this });
                    delete attr.labels;
                }

                if (attr.id) {
                    this.attributes.labels.fetch({ async: false });
                }

                this.attributes.visible = true;
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-category.Category#parse
             * @param  {object} data Object literal containing the model attribute to parse.
             * @return {object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                return Resource.prototype.parse.call(this, data, function (attr) {
                    if (annotationTool.localStorage && _.isArray(attr.labels)) {
                        attr.labels = new Labels(attr.labels, { category: this });
                    }

                    if (!annotationTool.localStorage && attr.scale_id && (_.isNumber(attr.scale_id) || _.isString(attr.scale_id))) {
                        attr.scale = annotationTool.video.get("scales").get(attr.scale_id);
                    }
                });
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-category.Category#validate
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var self = this;

                var invalidResource = Resource.prototype.validate.apply(this, arguments);
                if (invalidResource) return invalidResource;

                if (attr.id) {
                    if (!this.ready && attr.labels && attr.labels.url && (attr.labels.length) === 0) {
                        attr.labels.fetch({
                            async: false,
                            success: function () {
                                self.ready = true;
                            }
                        });
                    }
                }

                if (attr.description && !_.isString(attr.description)) {
                    return "\"description\" attribute must be a string";
                }

                if (attr.labels) {
                    attr.labels.each(function (value) {
                        var parseValue = value.parse({ category: this.toJSON() });

                        if (parseValue.category) {
                            parseValue = parseValue.category;
                        }

                        value.category = parseValue;
                    }, this);
                }

                return undefined;
            },

            /**
             * Show/hide the category in the UI
             * @alias module:models-category.Category#toggleVisibility
             */
            toggleVisibility: function () {
                this.set("visible", !this.get("visible"));
            },

            /**
             * Change category color
             * @alias module:models-category.Category#setColor
             * @param  {string} color the new color
             */
            setColor: function (color) {
                var settings = _.clone(this.get("settings"));
                settings.color = color;

                this.set("settings", settings);
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-category.Category#toJSON
             * @param {Object} options The options to control the "JSONification" of this collection
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function (options) {
                var json = Resource.prototype.toJSON.call(this, options);

                delete json.labels;

                if (this.attributes.scale) {
                    if (this.attributes.scale.attributes) {
                        json.scale_id = this.attributes.scale.get("id");
                    } else {
                        json.scale_id = this.attributes.scale.id;
                    }

                    if (!annotationTool.localStorage) {
                        delete json.scale;
                    }
                }

                return json;
            },

            /**
             * Prepare the model as JSON to export and return it
             * @alias module:models-category.Category#toExportJSON
             * @param {boolean} withScales Define if the scale has to be included
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function (withScale) {
                var json = {
                    name: this.attributes.name,
                    labels: this.attributes.labels.map(function (label) {
                        return label.toExportJSON();
                    })
                };

                if (this.attributes.tags) {
                    json.tags = JSON.stringify(this.attributes.tags);
                }

                if (this.attributes.description) {
                    json.description = this.attributes.description;
                }

                if (this.attributes.scale_id) {
                    json.scale_id = this.attributes.scale_id;
                }

                if (this.attributes.settings) {
                    json.settings = this.attributes.settings;
                }

                if (this.attributes.tags) {
                    json.tags = this.attributes.tags;
                }

                if (!_.isUndefined(withScale) &&  withScale) {
                    if (this.attributes.scale_id) {
                        json.scale = annotationTool.video.get("scales").get(this.attributes.scale_id).toExportJSON();
                    } else if (this.attributes.scale) {
                        json.scale = annotationTool.video.get("scales").get(this.attributes.scale.get("id")).toExportJSON();
                    }
                }

                return json;
            },
        });
        return Category;
    }
);
