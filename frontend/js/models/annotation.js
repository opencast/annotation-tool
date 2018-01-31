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
 * @requires util
 * @requires collections-comments
 * @requires ACCESS
 * @requires backbone
 * @requires models/resource
 * @requires localstorage
 */
define(["jquery",
        "underscore",
        "util",
        "collections/comments",
        "access",
        "backbone",
        "models/resource",
        "localstorage"],

    function ($, _, util, Comments, ACCESS, Backbone, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-annotation
         * @alias module:models-annotation.Annotation
         */
        var Annotation = Resource.extend({

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

                Resource.prototype.initialize.apply(this, arguments);

                if (attr.comments && _.isArray(attr.comments)) {
                    this.attributes.comments = new Comments(attr.comments, { annotation: this });
                    delete attr.comments;
                } else if (!attr.comments) {
                    this.attributes.comments = new Comments([], { annotation: this });
                } else {
                    this.attributes.comments = attr.comments;
                    delete attr.comments;
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
                return Resource.prototype.parse.call(this, data, function (attr) {
                    var tempSettings,
                        categories,
                        tempLabel,
                        label;

                    if (attr.scaleValue) {
                        attr.scalevalue = attr.scaleValue;
                        delete attr.scaleValue;
                    }

                    if (annotationTool.user.get("id") === attr.created_by) {
                        attr.isMine = true;
                    } else {
                        attr.isMine = false;
                    }

                    if (attr.label) {
                        if (attr.label.category && (tempSettings = util.parseJSONString(attr.label.category.settings))) {
                            attr.label.category.settings = tempSettings;
                        }

                        if ((tempSettings = util.parseJSONString(attr.label.settings))) {
                            attr.label.settings = tempSettings;
                        }
                    }

                    if (annotationTool.localStorage && _.isArray(attr.comments)) {
                        attr.comments = new Comments(attr.comments, { annotation: this });
                    }

                    if (!annotationTool.localStorage &&  attr.label_id && (_.isNumber(attr.label_id) || _.isString(attr.label_id))) {
                        categories = annotationTool.video.get("categories");

                        categories.each(function (cat) {

                            if ((tempLabel = cat.attributes.labels.get(attr.label_id))) {
                                label = tempLabel;
                                return true;
                            }

                        }, this);

                        attr.label = label;
                    }

                    if (!annotationTool.localStorage &&  attr.scalevalue) {
                        attr.scaleValue = attr.scalevalue;
                    }
                });
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-annotation.Annotation#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr, {
                    onIdChange: function () {
                        this.trigger("ready", this);
                        this.setUrl();
                    }
                });
                if (invalidResource) return invalidResource;

                if (!annotationTool.localStorage && attr.label) {
                    if (attr.label.id) {
                        this.attributes.label_id = attr.label.id;
                    } else if (attr.label.attributes) {
                        this.attributes.label_id = attr.label.get("id");
                    }
                }

                if (attr.start &&  !_.isNumber(attr.start)) {
                    return "\"start\" attribute must be a number!";
                }

                if (attr.text &&  !_.isString(attr.text)) {
                    return "\"text\" attribute must be a string!";
                }

                if (attr.duration &&  (!_.isNumber(attr.duration) || (_.isNumber(attr.duration) && attr.duration < 0))) {
                    return "\"duration\" attribute must be a positive number";
                }

                return undefined;
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
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-annotation.Annotation#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);
                delete json.comments;

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
                return label && annotationTool.video.get("categories").get(label.category.id);
            }
        });

        return Annotation;
    }
);
