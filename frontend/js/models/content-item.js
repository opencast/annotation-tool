/**
 *  Copyright 2020, ELAN e.V., Germany
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
 * A module representing the annotation-content model
 * @module models-content-item
 */
define(["underscore", "backbone"], function(_, Backbone) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#Model}
     * @augments module:Backbone.Model
     * @memberOf module:models-content-item
     * @alias module:models-content-item.ContentItem
     */
    var ContentItem = Backbone.Model.extend({
        /**
         * Get a category associated with this content item. May be undefined.
         * @alias module:models-content-item.ContentItem#getCategory
         * @return {Category|undefined} Either a category or undefined if there is none
         */
        getCategory: function() {
            var label = this.getLabel();

            return label && annotationTool.video.get("categories")
                .get(label.get("category").id);
        },

        /**
         * Get a label associated with this content item. May be undefined.
         * @alias module:models-content-item.ContentItem#getLabel
         * @return {Label|undefined} Either a label or undefined if there is none
         */
        getLabel: function() {
            var labelId;
            switch (this.get("type")) {
                case "label":
                    labelId = this.get("value");
                    break;
                case "scaling":
                    labelId = this.get("value").label;
                    break;
            }

            return labelId && _.findWhere(annotationTool.video.getLabels(), { id: labelId });
        },

        getScaleValue: function() {
            return this.getType() === "scaling"
                ? _.findWhere(annotationTool.video.getScaleValues(), { id: this.get("value").scaling })
                : undefined;
        },

        /**
         * Get a short text describing this content item.
         * @alias module:models-content-item.ContentItem#getText
         * @return {string} The short string describing this item.
         */
        getText: function() {
            switch (this.get("type")) {
                case "text":
                    return this.get("value");

                case "label":
                    return this.getLabel().get("value");

                case "scaling":
                    var scaleValue = _.findWhere(annotationTool.video.getScaleValues(), {
                        id: this.get("value").scaling
                    });
                    return this.getLabel().get("abbreviation") + " (" + scaleValue.get("name") + ")";
            }
        },

        /**
         * Shortcut to get the `type` attribute of this content item.
         * @alias module:models-content-item.ContentItem#getType
         * @return {string} The type of this content item
         */
        getType: function() {
            return this.get("type");
        }
    });

    return ContentItem;
});
