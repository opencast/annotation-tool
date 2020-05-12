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
 * A module representing a comments collection
 * @module collections-annotation-content
 */
define(["underscore", "models/content-item", "backbone"], function(
    _,
    ContentItem,
    Backbone
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#Collection}
     * @augments module:Backbone.Collection
     * @memberOf module:collections-annotation-content
     * @alias module:collections-annotation-content.AnnotationContent
     */
    var AnnotationContent = Backbone.Collection.extend({
        /**
         * Model of the instances contained in this collection
         * @alias module:collections-annotation-content.AnnotationContent#initialize
         */
        model: ContentItem
    });
    return AnnotationContent;
});
