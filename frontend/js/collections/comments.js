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
 * A module representing a comments collection
 * @module collections-comments
 */
define(
    [
        "underscore",
        "models/comment",
        "backbone"
    ],
    function (
        _,
        Comment,
        Backbone
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-comments
         */
        var Comments = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             */
            model: Comment,

            /**
             * constructor
             */
            initialize: function (models, options) {
                this.annotation = options.annotation;
                this.replyTo = options.replyTo;
            },

            /**
             * Parse the given data
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the comments
             */
            parse: function (resp) {
                if (resp.comments && _.isArray(resp.comments)) {
                    return resp.comments;
                } else if (_.isArray(resp)) {
                    return resp;
                } else {
                    return null;
                }
            },

            /**
             * Get the url for this collection
             * @return {String} The url of this collection
             */
            url: function () {
                return this.replyTo
                    ? _.result(this.replyTo, "url") + "/replies"
                    : _.result(this.annotation, "url") + "/comments";
            },

            /**
             * The "root" URL of this collection.
             * This is needed to update comments, even when they are in a collection of replies.
             * See {@link module:models-Comment.Comment#urlRoot}.
             * Note: This is only named `urlRoot` to suggest a relation to Backbones URL generation mechanism;
             * on collections this name has no meaning normally.
             */
            urlRoot: function () {
                return _.result(this.annotation, "url") + "/comments";
            },

            /**
             * Count the number of comments in this collection together with all of their replies.
             * @return {number} recursive sum of the number of comments and all their replies
             */
            countCommentsAndReplies: function () {
                return this.chain()
                    .map("replies")
                    .invoke("countCommentsAndReplies")
                    .reduce(function (sum, summand) {
                        return sum + summand;
                    }, this.length)
                    .value();
            }
        });
        return Comments;
    }
);
