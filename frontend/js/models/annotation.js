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
        "models/resource"
    ],
    function (
        _,
        util,
        Comments,
        Resource
    ) {
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
                    duration: 0,
                    comments: new Comments([], { annotation: this })
                };
            },

            /**
             * (Re-)Fetch the comments once our ID changes.
             */
            fetchChildren: function () {
                this.attributes.comments.fetch();
            },

            /**
             * Parse the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to parse.
             * @return {object} The object literal with the list of parsed model attribute.
             */
            parse: function (attr) {
                attr = Resource.prototype.parse.call(this, attr);
                if (attr.label) {
                    var tempSettings;
                    if (attr.label.category && (tempSettings = util.parseJSONString(attr.label.category.settings))) {
                        attr.label.category.settings = tempSettings;
                    }

                    if ((tempSettings = util.parseJSONString(attr.label.settings))) {
                        attr.label.settings = tempSettings;
                    }
                }
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

                return undefined;
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Resource.prototype.toJSON.call(this);

                json.end = json.start + json.duration;

                if (json.label) {
                    if (json.label.id) {
                        json.label_id = json.label.id;
                    }
                    if (json.label.toJSON) {
                        json.label = json.label.toJSON();
                    }
                }

                if (json.scalevalue && json.scalevalue.id) {
                    json.scale_value_id = json.scalevalue.id;
                }

                delete json.comments;

                return json;
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
             * Access an annotations category, if it has any.
             * Note that this returns <code>undefined</code>
             * if the category has been deleted!
             * @return {Category} The category this annotations label belongs to, if it has a label
             */
            category: function () {
                var label = this.get("label");
                return label && annotationTool.video.get("categories").get(label.category.id);
            },

            /**
             * Get the display color of an annotation.
             * This is determined by the color of the category of its label,
             * if it has any.
             * Free text annotations return <code>undefined</code>
             * @return {string} a CSS color value
             */
            color: function () {
                var category = this.category();
                var label = this.get("label");
                return category && category.get("settings").color ||
                    // If the category is a deleted one, we don't get it from `category`.
                    // However, the label should still have it.
                    label && label.category.settings.color;
            }
        });

        return Annotation;
    }
);
