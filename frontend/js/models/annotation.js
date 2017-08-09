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
 */

/**
 * A module representing the annotation model
 * @module models-annotation
 * @requires jquery
 * @requires underscore
 * @requires collections-comments
 * @requires ACCESS
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "underscore",
        "collections/comments",
        "access",
        "backbone",
        "localstorage"],

    function ($, _, Comments, ACCESS, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-annotation
         * @alias module:models-annotation.Annotation
         */
        var Annotation = Backbone.Model.extend({

            /**
             * Default models value
             * @alias module:models-annotation.Annotation#defaults
             * @type {map}
             * @static
             */
            defaults: {
                start   : 0,
                duration: 0
            },

            /**
             * Constructor
             * @alias module:models-annotation.Annotation#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                _.bindAll(this, "areCommentsLoaded",
                                "fetchComments");

                if (!attr || _.isUndefined(attr.start)) {
                    throw "\"start\" attribute is required";
                }

                if (attr.comments && _.isArray(attr.comments)) {
                    this.attributes.comments = new Comments(attr.comments, this);
                    delete attr.comments;
                } else if (!attr.comments) {
                    this.attributes.comments = new Comments([], this);
                } else {
                    this.attributes.comments = attr.comments;
                    delete attr.comments;
                }

                // If localStorage used, we have to save the video at each change on the children
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

                if (annotationsTool.user.get("id") === attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                // Add backbone events to the model
                _.extend(this, Backbone.Events);

                this.set(attr);
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-annotation.Annotation#parse
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
                    },
                    tempSettings,
                    categories,
                    tempLabel,
                    label;

                if (attr.created_at) {
                    attr.created_at = parseDate(attr.created_at);
                }

                if (attr.updated_at) {
                    attr.updated_at = parseDate(attr.updated_at);
                }

                if (attr.deleted_at) {
                    attr.deleted_at = parseDate(attr.deleted_at);
                }

                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if (attr.scaleValue) {
                    attr.scalevalue = attr.scaleValue;
                    delete attr.scaleValue;
                }

                if (annotationsTool.user.get("id") === attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                if (attr.label) {
                    if (attr.label.category && (tempSettings = this.parseJSONString(attr.label.category.settings))) {
                        attr.label.category.settings = tempSettings;
                    }

                    if ((tempSettings = this.parseJSONString(attr.label.settings))) {
                        attr.label.settings = tempSettings;
                    }
                }

                if (annotationsTool.localStorage && _.isArray(attr.comments)) {
                    attr.comments = new Comments(attr.comments, this);
                }

                if (!annotationsTool.localStorage &&  attr.label_id && (_.isNumber(attr.label_id) || _.isString(attr.label_id))) {
                    categories = annotationsTool.video.get("categories");

                    categories.each(function (cat) {

                        if ((tempLabel = cat.attributes.labels.get(attr.label_id))) {
                            label = tempLabel;
                            return true;
                        }

                    }, this);

                    attr.label = label;
                }

                if (!annotationsTool.localStorage &&  attr.scalevalue) {
                    attr.scaleValue = attr.scalevalue;
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
             * @alias module:models-annotation.Annotation#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var tmpCreated;

                if (attr.id) {
                    if (this.get("id") !== attr.id) {
                        this.id = attr.id;
                        this.attributes.id = attr.id;
                        this.trigger("ready", this);
                        this.setUrl();
                    }
                }

                if (!annotationsTool.localStorage && attr.label) {
                    if (attr.label.id) {
                        this.attributes.label_id = attr.label.id;
                    } else if (attr.label.attributes) {
                        this.attributes.label_id = attr.label.get("id");
                    }
                }

                if (attr.start &&  !_.isNumber(attr.start)) {
                    return "\"start\" attribute must be a number!";
                }

                if (attr.tags && _.isUndefined(this.parseJSONString(attr.tags))) {
                    return "\"tags\" attribute must be a string or a JSON object";
                }

                if (attr.text &&  !_.isString(attr.text)) {
                    return "\"text\" attribute must be a string!";
                }

                if (attr.duration &&  (!_.isNumber(attr.duration) || (_.isNumber(attr.duration) && attr.duration < 0))) {
                    return "\"duration\" attribute must be a positive number";
                }

                if (attr.access && !_.include(ACCESS, attr.access)) {
                    return "\"access\" attribute is not valid.";
                }

                if (attr.created_at) {
                    if ((tmpCreated = this.get("created_at")) && tmpCreated !== attr.created_at) {
                        return "\"created_at\" attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at) && !_.isDate(attr.created_at)) {
                        return "\"created_at\" attribute must be a number!";
                    }
                }

                if (attr.updated_at && !_.isNumber(attr.updated_at)) {
                    return "\"updated_at\" attribute must be a number!";
                }

                if (attr.deleted_at && !_.isNumber(attr.deleted_at)) {
                    return "\"deleted_at\" attribute must be a number!";
                }

            },

            /**
             * Returns if comments are or not loaded
             * @alias module:models-annotation.Annotation#areCommentsLoaded
             */
            areCommentsLoaded: function () {
                return this.commentsFetched;
            },

            /**
             * Load the list of comments from the server
             * @param  {Function} [callback] Optional callback to call when comments are loaded 
             * @alias module:models-annotation.Annotation#fetchComments
             */
            fetchComments: function (callback) {
                var fetchCallback = _.bind(function () {
                    this.commentsFetched = true;
                    if (_.isFunction(callback)) {
                        callback.apply(this);
                    }
                }, this);

                if (this.areCommentsLoaded()) {
                    fetchCallback();
                } else {
                    if (this.commentsFetched !== true) {
                        if (_.isUndefined(this.attributes.id)) {
                            this.once("ready", this.fetchComments);
                        } else {
                            this.attributes.comments.fetch({
                                async   : true,
                                success : fetchCallback
                            });
                        }
                    }
                }
            },

            /**
             * Modify the current url for the annotations collection
             * @alias module:models-annotation.Annotation#setUrl
             */
            setUrl: function () {
                if (this.get("comments")) {
                    this.get("comments").setUrl(this);
                }
            },


            /**
             * Parse the given parameter to JSON if given as string
             * @alias module:models-annotation.Annotation#parseJSONString
             * @param  {string} parameter the parameter as string
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
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-annotation.Annotation#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = $.proxy(Backbone.Model.prototype.toJSON, this)();
                delete json.comments;

                if (json.tags) {
                    json.tags = JSON.stringify(json.tags);
                }

                if (json.label && json.label.toJSON) {
                    json.label = json.label.toJSON();
                }

                if (json.scalevalue) {
                    if (json.scalevalue.attributes) {
                        json.scale_value_id = json.scalevalue.attributes.id;
                    } else if (json.scalevalue.id) {
                        json.scale_value_id = json.scalevalue.id;
                    }
                }
                delete json.annotations;
                return json;
            },

            /**
             * Check whether the annotation covers a given point in time
             * @alias module:models-annotation.Annotation#covers
             * @param {Number} time The point in time you are interested in
             * @param {Number} minDuration Minimal duration to base this answer on
             * @return {Boolean} true if this annotation covers the given timestamp, potentially
             *                   taking into account the given minimal duration
             */
            covers: function (time, minDuration) {
                var start = this.get("start");
                var duration = Math.max(minDuration, this.get("duration") || 0);
                var end = start + duration;
                return start <= time && time <= end;
            },

            /**
             * Access an annotations category, if it has any.
             * @alias module:models-annotation.Annotation#category
             * @return {Category} The category this annotations label belongs to, if it has a label
             */
            category: function () {
                var label = this.get("label");
                return label && annotationsTool.video.get("categories").get(label.category.id);
            }
        });

        return Annotation;
    }
);