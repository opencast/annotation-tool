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
 * @requires jQuery
 * @requires underscore
 * @requires models-comment
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "underscore",
        "models/comment",
        "backbone",
        "localstorage"],

    function ($, _, Comment, Backbone) {

        "use strict";

        function fixUrlForReplies(options) {
            if (!this.replyTo) return options;
            return _.extend({
                url: _.result(this, "url") + "/" + this.replyTo.id + "/replies"
            }, options);
        }

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-comments
         * @alias module:collections-comments.Comments
         */
        var Comments = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-comments.Comments#initialize
             */
            model: Comment,

            /**
             * Localstorage container for the collection
             * @alias module:collections-comments.Comments#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Comments"),

            /**
             * constructor
             * @alias module:collections-comments.Comments#initialize
             */
            initialize: function (models, options) {
                _.bindAll(this, "setUrl");
                this.annotation = options.annotation;
                this.replyTo = options.replyTo;
                this.setUrl(this.annotation);
            },

            /**
             * Parse the given data
             * @alias module:collections-comments.Comments#parse
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
             * Define the url from the collection with the given video
             * @alias module:collections-comments.Comments#setUrl
             * @param {@link module:models-annotation.Annotation} annotation The annotation containing the comments
             * @param {@link module:models-comment.Comment} replyTo The comment that this collection holds the replies to
             */
            setUrl: function (annotation, replyTo) {
                if (!annotation) {
                    throw "The parent annotation of the comments must be given!";
                } else if (annotation.collection) {
                    this.url = annotation.url() + "/comments";
                }

                if (window.annotationTool && annotationTool.localStorage) {
                    var localStorageUrl = this.url;
                    if (replyTo) {
                        localStorageUrl += this.replyTo.id + "/replies";
                    }
                    this.localStorage = new Backbone.LocalStorage(localStorageUrl);
                }
            },

            /**
             * Override in order to use the right URL for replies.
             * @alias module:collections-comments.Comments#fetch
             */
            fetch: function (options) {
                options = fixUrlForReplies.call(this, options);
                return Backbone.Collection.prototype.fetch.call(this, options);
            },

            /**
             * Override in order to use the right URL for replies.
             * @alias module:collections-comments.Comments#fetch
             */
            create: function (model, options) {
                options = fixUrlForReplies.call(this, options);
                return Backbone.Collection.prototype.create.call(this, model, options);
            },

            /**
             * Count the number of comments in this collection together with all of their replies.
             * @alias module:collections-comments.Comments#countCommentsAndReplies
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
