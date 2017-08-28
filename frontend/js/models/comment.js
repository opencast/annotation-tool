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
 * A module representing the comment model
 * @module models-comment
 * @requires jQuery
 * @requires underscore
 * @requires ACCESS
 * @requires backbone
 * @requires models/resource
 */
define(["jquery",
        "underscore",
        "access",
        "backbone",
        "models/resource"],

    function ($, _, ACCESS, Backbone, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-comment
         * @alias module:models-comment.Comment
         */
        var Comment = Resource.extend({

            /**
             * Default models value
             * @alias module:models-comment.Comment#defaults
             * @type {map}
             * @static
             */
            defaults: {
                access: ACCESS.PUBLIC
            },

            /**
             * Constructor
             * @alias module:models-comment.Comment#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                if (!attr || _.isUndefined(attr.text)) {
                    throw "'text' attribute is required";
                }

                Resource.prototype.initialize.apply(this, arguments);
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-comment.Comment#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.text &&  !_.isString(attr.text)) {
                    return "\"text\" attribute must be a string!";
                }
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-comment.Comment#toJSON
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function () {
                var json = Backbone.Model.prototype.toJSON.call(this);
                if (json.tags) {
                    json.tags = JSON.stringify(json.tags);
                }
                return json;
            }
        });
        return Comment;
    }
);