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
 */
define(
    [
        "underscore",
        "models/resource",
        "collections/comments"
    ],
    function (
        _,
        Resource,
        Comments
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-comment
         */
        var Comment = Resource.extend({

            /**
             * Default models value
             * @type {map}
             * @static
             */
            defaults: {
                text: ""
            },

            /**
             * Constructor
             */
            initialize: function () {
                // Fix up circular dependency
                if (!Comments) Comments = require("collections/comments");

                this.replies = new Comments(null, {
                    annotation: this.collection.annotation,
                    replyTo: this
                });

                Resource.prototype.initialize.apply(this, arguments);

                this.listenTo(this.replies, "add remove reset reply", function () {
                    this.trigger("reply");
                });
            },

            /**
             * (Re-)Fetch the replies once our ID changes.
             */
            fetchChildren: function () {
                this.replies.fetch();
            },

            /**
             * Validate the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (attr.text && !_.isString(attr.text)) {
                    return "\"text\" attribute must be a string!";
                }

                return undefined;
            },

            /**
             * The URL root of this model
             * @return {string} The URL root of this model
             */
            urlRoot: function () {
                return this.isNew()
                    ? _.result(this.collection, "url")
                    : _.result(this.collection, "urlRoot");
            }
        });

        return Comment;
    }
);
