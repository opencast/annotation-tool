/**
 *  Copyright 2018, ELAN e.V., Germany
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

define(function () {
    "use strict";

    /**
     * Module containing the tool configuration
     * @exports annotation-tool-configuration
     */
    var Configuration = {
        /**
         * The minmal duration used for annotation representation on timeline
         * @type {Object}
         */
        MINIMAL_DURATION: 1,

        /**
         * Define the number of categories pro tab in the annotate box. Bigger is number, thinner will be the columns for the categories.
         * @type {Number}
         */
        CATEGORIES_PER_TAB: 7,

        /**
         * Define if the structured annotations are or not enabled
         * @return {boolean} True if this feature is enabled
         */
        isStructuredAnnotationEnabled: function () {
            return true;
        },

        /**
         * Define if the free text annotations are or not enabled
         * @return {boolean} True if this feature is enabled
         */
        isFreeTextEnabled: function () {
            return true;
        },

        /**
         * Returns the time interval between each timeupdate event to take into account.
         * It can improve a bit the performance if the amount of annotations is important. 
         * @return {number} The interval
         */
        getTimeupdateIntervalForTimeline: function () {
            // TODO Check if this function should be linear
            return Math.max(500, this.getAnnotations().length * 3);
        }
    };

    return Configuration;
});
