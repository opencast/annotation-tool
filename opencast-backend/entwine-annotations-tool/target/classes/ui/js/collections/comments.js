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
 * @requires models-comment
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/comment",
        "backbone",
        "localstorage"],

        function ($, Comment, Backbone) {

        "use strict";

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
            model       : Comment,

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
            initialize: function (models, annotation) {
                _.bindAll(this, "setUrl");
                this.setUrl(annotation);
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
             * @param {{@linkcode module:models-track.Track}} Annotation containing the comments
             */
            setUrl: function (annotation) {
                if (!annotation) {
                    throw "The parent annotation of the comments must be given!";
                } else if (annotation.collection) {
                    this.url = annotation.url() + "/comments";
                }

                if (window.annotationsTool && annotationsTool.localStorage) {
                    this.localStorage = new Backbone.LocalStorage(this.url);
                }
            }
        });
        return Comments;
    }
);
