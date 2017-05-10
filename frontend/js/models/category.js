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
 * @requires jQuery
 * @requires underscore
 * @requires collections-labels
 * @requires ACCESS
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "underscore",
        "collections/labels",
        "access",
        "backbone",
        "localstorage"],

    function ($, _, Labels, ACCESS, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-category
         * @alias module:models-category.Category
         */
        var Category = Backbone.Model.extend({

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
                has_duration: true
            },

            /**
             * Constructor
             * @alias module:models-category.Category#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {

                _.bindAll(this, "setUrl", "validate", "toExportJSON");

                if (!attr || _.isUndefined(attr.name)) {
                    throw "\"name\" attribute is required";
                }

                // If localStorage used, we have to save the video at each change on the children
                if (window.annotationsTool.localStorage) {
                    if (!attr.created_by) {
                        this.attributes.created_by = annotationsTool.user.get("id");
                        this.attributes.created_by_nickname = annotationsTool.user.get("nickname");
                    }
                }

                if (attr.tags) {
                    this.attributes.tags = this.parseJSONString(attr.tags);
                }

                if (attr.settings) {
                    this.attributes.settings = this.parseJSONString(attr.settings);
                    if (this.attributes.settings.hasScale === undefined) {
                        this.attributes.settings.hasScale = true;
                    }
                } else {
                    this.attributes.settings = {hasScale: true};
                }


                if (annotationsTool.user.get("id") === attr.created_by) {
                    this.attributes.isMine = true;
                } else {
                    this.attributes.isMine = false;
                }

                if (attr.access === ACCESS.PUBLIC) {
                    this.attributes.isPublic = true;
                } else {
                    this.attributes.isPublic = false;
                }

                if (attr.labels && _.isArray(attr.labels)) {
                    this.attributes.labels  = new Labels(attr.labels, this);
                    delete attr.labels;
                } else if (!attr.labels) {
                    this.attributes.labels  = new Labels([], this);
                } else if (_.isObject(attr.labels) && attr.labels.model) {
                    this.attributes.labels = new Labels(attr.labels.models, this);
                    delete attr.labels;
                }

                if (attr.id) {
                    this.attributes.labels.fetch({async: false});
                }

                //this.set(attr);
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-category.Category#parse
             * @param  {object} data Object literal containing the model attribute to parse.
             * @return {object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                var attr = data.attributes ? data.attributes : data,
                    parseDate = function (date) {
                        if (_.isNumber(date)) {
                            return new Date(date);
                        } else if (_.isString) {
                            return Date.parse(date);
                        } else {
                            return null;
                        }
                    };

                if (attr.created_at) {
                    attr.created_at = parseDate(attr.created_at);
                }

                if (attr.updated_at) {
                    attr.updated_at = parseDate(attr.updated_at);
                }

                if (attr.deleted_at) {
                    attr.deleted_at = parseDate(attr.deleted_at);
                }

                if (attr.settings) {
                    attr.settings = this.parseJSONString(attr.settings);
                }

                if (annotationsTool.user.get("id") === attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                if (attr.access === ACCESS.PUBLIC) {
                    attr.isPublic = true;
                } else {
                    attr.isPublic = false;
                }

                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if (annotationsTool.localStorage && _.isArray(attr.labels)) {
                    attr.labels = new Labels(attr.labels, this);
                }

                if (!annotationsTool.localStorage &&  attr.scale_id && (_.isNumber(attr.scale_id) || _.isString(attr.scale_id))) {
                    attr.scale = annotationsTool.video.get("scales").get(attr.scale_id);
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
             * @alias module:models-category.Category#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var tmpCreated,
                    self = this;

                if (attr.id) {
                    if (this.get("id") !== attr.id) {
                        this.id = attr.id;
                        this.setUrl(attr.labels);
                    }

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

                if (attr.settings && (!_.isObject(attr.settings) && !_.isString(attr.settings))) {
                    return "\"description\" attribute must be a string or a JSON object";
                }

                if (attr.tags && _.isUndefined(this.parseJSONString(attr.tags))) {
                    return "\"tags\" attribute must be a string or a JSON object";
                }

                if (!_.isUndefined(attr.access)) {
                    if (!_.include(ACCESS, attr.access)) {
                        return "\"access\" attribute is not valid.";
                    } else if (this.attributes.access !== attr.access) {
                        if (attr.access === ACCESS.PUBLIC) {
                            this.attributes.isPublic = true;
                        } else {
                            this.attributes.isPublic = false;
                        }
                    }
                }

                if (attr.created_at) {
                    if ((tmpCreated = this.get("created_at")) && tmpCreated !== attr.created_at) {
                        return "\"created_at\" attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "\"created_at\" attribute must be a number!";
                    }
                }

                if (attr.updated_at && !_.isNumber(attr.updated_at)) {
                    return "\"updated_at\" attribute must be a number!";
                }

                if (attr.deleted_at && !_.isNumber(attr.deleted_at)) {
                    return "\"deleted_at\" attribute must be a number!";
                }

                if (attr.labels) {
                    attr.labels.each(function (value) {
                        var parseValue = value.parse({category: this.toJSON()});

                        if (parseValue.category) {
                            parseValue = parseValue.category;
                        }

                        value.category = parseValue;
                    }, this);
                }
            },

            /**
             * Save this category to the backend with the given attributes.
             * We override this to control the serialization of the tags,
             * Which need to be stringified for the communication with the server.
             * @alias module:models-category.Category#save
             */
            save: function (key, value, options) {
                var attributes;
                // Imitate Backbones calling convention negotiation dance
                if (key == null || _.isObject(key)) {
                    attributes = key;
                    options = value;
                } else if (key != null) {
                    (attributes = {})[key] = value;
                }

                options = _.defaults({ stringifySub: true }, options);

                return Backbone.Model.prototype.save.call(this, attributes, options);
            },

            /**
             * Change category color
             * @alias module:models-category.Category#setColor
             * @param  {string} color the new color
             */
            setColor: function (color) {
                var settings = this.attributes.settings;
                settings.color = color;

                this.set("settings", settings);
            },

            /**
             * Modify the current url for the annotations collection
             * @alias module:models-category.Category#setUrl
             */
            setUrl: function (labels) {
                if (labels) {
                    labels.setUrl(this);
                }
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-category.Category#toJSON
             * @param {Object} options The options to control the "JSONification" of this collection
             * @param {Boolean} stringifySub defines if the sub-object should be stringify
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function (options) {
                var json = Backbone.Model.prototype.toJSON.call(this, options);

                if (options && options.stringifySub) {
                    if (json.tags) {
                        json.tags = JSON.stringify(json.tags);
                    }

                    if (json.settings && _.isObject(json.settings)) {
                        json.settings = JSON.stringify(this.attributes.settings);
                    }
                }

                delete json.labels;

                if (this.attributes.scale) {
                    if (this.attributes.scale.attributes) {
                        json.scale_id = this.attributes.scale.get("id");
                    } else {
                        json.scale_id = this.attributes.scale.id;
                    }

                    if (!annotationsTool.localStorage) {
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
                    labels: this.attributes.labels.toExportJSON()
                };

                if (this.attributes.tags) {
                    json.tags = JSON.stringify(this.attributes.tags);
                }

                if (this.attributes.description) {
                    json.description = this.attributes.description;
                }

                if (this.attributes.has_duration) {
                    json.has_duration = this.attributes.has_duration;
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
                        json.scale = annotationsTool.video.get("scales").get(this.attributes.scale_id).toExportJSON();
                    } else if (this.attributes.scale) {
                        json.scale = annotationsTool.video.get("scales").get(this.attributes.scale.get("id")).toExportJSON();
                    }
                }

                return json;
            },

            /**
             * Parse the given parameter to JSON if given as String
             * @alias module:models-category.Category#parseJSONString
             * @param  {string} parameter the parameter as String
             * @return {JSON} parameter as JSON object
             */
            parseJSONString: function (parameter) {
                if (parameter && _.isString(parameter)) {
                    try {
                        parameter = JSON.parse(parameter);

                    } catch (e) {
                        console.warn("Can not parse parameter \"" + parameter + "\": " + e);
                        return undefined;
                    }
                } else if (!_.isObject(parameter) || _.isFunction(parameter)) {
                    return undefined;
                }

                return parameter;
            }
        });
        return Category;
    }
);