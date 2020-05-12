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
 */
define(
    [
        "underscore",
        "util",
        "collections/comments",
        "collections/annotation_content",
        "models/content_item",
        "models/resource",
        "localstorage"
    ],

    function (_, util, Comments, AnnotationContent, ContentItem, Resource) {

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
                start: 0,
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

                if (_.isObject(attr.content)) {
                    this.attributes.content = attr.content;
                } else {
                    this.attributes.content = new AnnotationContent(attr.content || []);
                }
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-annotation.Annotation#parse
             * @param  {object} data Object literal containing the model attribute to parse.
             * @return {object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                return Resource.prototype.parse.call(this, data, function (attr) {
                    if (annotationTool.user.get("id") === attr.created_by) {
                        attr.isMine = true;
                    } else {
                        attr.isMine = false;
                    }

                    if (annotationTool.localStorage && _.isArray(attr.comments)) {
                        attr.comments = new Comments(attr.comments, { annotation: this });
                    }

                    attr.content = new AnnotationContent(attr.content);
                });
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-annotation.Annotation#validate
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr, {
                    onIdChange: function () {
                        this.trigger("ready", this);
                    }
                });
                if (invalidResource) return invalidResource;

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
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-annotation.Annotation#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);

                json.end = json.start + json.duration;

                delete json.comments;

                if (json.content && json.content.toJSON) {
                    json.content = json.content.toJSON();
                }

                return json;
            },

            /**
             * Add a content item to this annotation.
             * @alias module:models-annotation.Annotation#addContent
             * @param {object} JSON representation of the content item
             */
            addContent: function (content) {
                var contentItem = new ContentItem(content);
                this.attributes.content.add(contentItem);
                this.save()
                this.trigger("change", this, {});
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
                var duration = this.get("duration");
                var end = start + (duration || minDuration);

                return start <= time && time <= end;
            },

            /**
             * Access an annotation's categories, if it has any.
             * @alias module:models-annotation.Annotation#getCategories
             * @return {array} The array of categories this annotation' labels belongs to, if it has any labels
             */
            getCategories: function () {
                return this.get("content").reduce(function(memo, item) {
                    var category = item.getCategory();
                    if (category) {
                        memo.push(category);
                    }
                    return memo;
                }, []);
            },

            /**
             * Access an annotation's color, if it has any.
             * @alias module:models-annotation.Annotation#getColor
             * @return {string} The string containing a CSS color value.
             */
            getColor: function () {
                var color;
                var content = this.get("content");

                if (getAnnotationType(this) === "multi") {
                    color = "white";
                } else {
                    var label = content.first().getLabel();
                    color = getColorFromLabel(label);
                }

                return color;
            },

            /**
             * Access an annotation's content items' labels, if it has any.
             * @alias module:models-annotation.Annotation#getLabels
             * @return {Label[]} An array of labels.
             */
            getLabels: function () {
                return this.get("content").reduce(function(memo, item) {
                    var label = item.getLabel();
                    if (label) {
                        memo.push(label);
                    }
                    return memo;
                }, []);
            },

            /**
             * Generate a `title` attribute according to this annotation's content items.
             * @alias module:models-annotation.Annotation#getTitleAttribute
             * @return {string} A string containing the value for the `title` attribute.
             */
            getTitleAttribute: function () {
                var title;
                switch (getAnnotationType(this)) {
                case "label":
                case "scaling":
                    var label = this.get("content").first().getLabel();
                    title = getTitleFromLabel(label);
                    break;

                case "text":
                    title = this.get("content").first().get("value");
                    break;
                }

                return title;
            }
        });

        return Annotation;

        // return the type of an annotation's single content item and `multi` otherwise
        function getAnnotationType(annotation) {
            var content = annotation.get("content") || [];
            return content.models.length !== 1 ? "multi" : content.first().get("type");
        }

        function getColorFromLabel(label) {
            var color;
            if (label) {
                var category = label.get("category");
                if (category && category.settings && category.settings.color) {
                    color = category.settings.color;
                }
            }
            return color;
        }

        function getTitleFromLabel(label) {
            var title;
            if (label) {
                title = label.get("abbreviation") + " - " + label.get("value");
            }
            return title;
        }
    }
);
