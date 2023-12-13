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
 * A module representing the track model
 * @module models-track
 */
define([
    "underscore",
    "collections/annotations",
    "access",
    "models/resource"
], function (
    _,
    Annotations,
    ACCESS,
    Resource
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#Model}
     * @augments module:Backbone.Model
     * @memberOf module:models-track
     */
    var Track = Resource.extend(
        /** @lends module:models-track~Track.prototype */
        {
            /**
             * Default models value
             * @type {map}
             * @static
             */
            defaults: {
                access: ACCESS.SHARED_WITH_ADMIN,
                visible: false
            },

            /**
             * Constructor
             */
            constructor: function () {
                this.annotations = new Annotations(null, { track: this });
                Resource.apply(this, arguments);
            },

            /**
             * (Re-)Fetch the annotations once our ID changes.
             */
            fetchChildren: function () {
                this.annotations.fetch({ async: false });
            },

            /**
             * Validate the attribute list passed to the model
             * @param {Object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.description && !_.isString(attr.description)) {
                    return "'description' attribute must be a string";
                }

                return undefined;
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function () {
                return _.omit(
                    Resource.prototype.toJSON.apply(this, arguments),
                    ["visible"]
                );
            }
        }
    );

    /**
     * @exports Track
     */
    return Track;
});
