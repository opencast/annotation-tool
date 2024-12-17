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
        "collections/annotation-content",
        "models/content-item",
        "models/resource",
        "i18next"
    ],
    function (_, util, Comments, AnnotationContent, ContentItem, Resource, i18next) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-annotation
         */
        var Annotation = Resource.extend({

            /**
             * Default model values
             */
            defaults: function () {
                return {
                    start: 0,

                    // Value = 0 for point annotation as default
                    duration: 0,

                    comments: new Comments([], { annotation: this }),
                    content: new AnnotationContent([])
                };
            },

            /**
             * Constructor
             * @alias module:models-annotation.Annotation#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                // Fixes comments not being loaded/updated anymore (e.g. reload app); also fixes icon status.
                // This was removed in master (35e244e000f82ff8def250bfe566bd213d4705a2) - Check if this is correct.
                Resource.prototype.initialize.apply(this, arguments);

                if (!(this.get("content") instanceof AnnotationContent)) {
                    this.attributes.content = new AnnotationContent(attr.content || []);
                }
            },

            /**
             * (Re-)Fetch the comments once our ID changes.
             * 1) Questionnaire: Cancelling freshly created annotation leads to: 'Uncaught Error: A "url" property or function must be specified'.
             *    Collection exists only until 'destroy', but not here - so no URL can be found. Guess: keepDeleted behaviour?
             * @todo CC | Review: Same issue fixed here appears in other deletion places too (e.g. deleting a track). Fix all?
             * @todo CC | Review: Fix/Workaround for questionnaire annotation, eventually remove warning (added for convenience/understanding).
             */
            fetchChildren: function () {
                // 1) Should -only- occur on questionnaire annotation deletion!
                if (!this.collection) {
                    console.warn("Annotation collection not found, skip fetching children");
                    return;
                }

                this.attributes.comments.fetch();
            },

            /**
             * Parse the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to parse.
             * @return {object} The object literal with the list of parsed model attribute.
             */
            parse: function (attr) {
                attr = Resource.prototype.parse.call(this, attr);

                if (_.isString(attr.content)) {
                    attr.content = util.parseJSONString(attr.content);
                }
                attr.content = new AnnotationContent(attr.content);

                return attr;
            },

            /**
             * Validate the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.start && !_.isNumber(attr.start)) {
                    return "\"start\" attribute must be a number!";
                }

                if (attr.text && !_.isString(attr.text)) {
                    return "\"text\" attribute must be a string!";
                }

                if (attr.duration && (!_.isNumber(attr.duration) || (_.isNumber(attr.duration) && attr.duration < 0))) {
                    return "\"duration\" attribute must be a positive number";
                }

                if (!attr.content || !_.isArray(attr.content) || !attr.content instanceof AnnotationContent) {
                }

                return undefined;
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function (options) {
                var json = Resource.prototype.toJSON.apply(this, arguments);

                json.end = json.start + json.duration;

                delete json.comments;

                json.content = json.content.toJSON.apply(json.content, arguments);
                if (options && options.stringifySub) {
                    json.content = JSON.stringify(json.content);
                }

                return json;
            },

            /**
             * @return {string} The type of the annotation.
             *                  If there is exactly one content item, it's that item's type.
             *                  Otherwise it is <code>multi</code>.
             * @see module:models-content-item.ContentItem#getType
             * @alias module:models-annotation.Annotation#getType
             */
            getType: function () {
                var content = this.get("content");
                return content.models.length !== 1 ? "multi" : content.first().get("type");
            },

            /**
             * Add a content item to this annotation.
             * @alias module:models-annotation.Annotation#addContent
             * @param {object} JSON representation of the content item
             */
            addContent: function (content) {
                var contentItem = new ContentItem(content);
                this.attributes.content.add(contentItem);
                this.save();
                this.trigger("change", this, {});
            },

            /**
             * Check whether the annotation covers a given point in time
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
                return this.get("content").chain()
                    .invoke("getCategory")
                    .compact()
                    .value();
            },

            /**
             * Access an annotation's color, if it has any.
             * @alias module:models-annotation.Annotation#getColor
             * @return {string} The string containing a CSS color value.
             */
            getColor: function () {
                switch (this.getType()) {
                case "text":
                    return undefined;
                case "multi":
                    return "white";
                default:
                    // There should be exactly one category here ...
                    return this.getCategories()[0].get("settings").color;
                }
            },

            /**
             * Access an annotation's content items' labels, if it has any.
             * @alias module:models-annotation.Annotation#getLabels
             * @return {Label[]} An array of labels.
             */
            getLabels: function () {
                return this.get("content").chain()
                    .invoke("getLabel")
                    .compact()
                    .value();
            },

            /**
             * Generate a `title` attribute according to this annotation's content items.
             * @alias module:models-annotation.Annotation#getTitleAttribute
             * @return {string} A string containing the value for the `title` attribute.
             */
            getTitleAttribute: function () {
                var firstContent = this.get("content").first();
                switch (this.getType()) {
                case "label":
                case "scaling":
                    var label = firstContent.getLabel();
                    return getTitleFromLabel(label);
                case "text":
                    return firstContent.get("value");
                case "multi":
                    var empty = !this.get("content").size();
                    return "<" + i18next.t(empty ? "annotation.types.empty" : "annotation.types.multi") + ">";
                }
            }
        });

        return Annotation;

        function getTitleFromLabel(label) {
            var title;
            if (label) {
                title = label.get("abbreviation") + " - " + label.get("value");
            }
            return title;
        }
    }
);
