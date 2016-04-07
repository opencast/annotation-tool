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
 * A module representing a tracks collection
 * @module collections-tracks
 * @requires jQuery
 * @requires models-scale
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/track",
        "backbone",
        "localstorage"],

    function ($, Track, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-tracks
         * @alias module:collections-tracks.Tracks
         */
        var Tracks = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-tracks.Tracks#initialize
             */
            model: Track,

            /**
             * Localstorage container for the collection
             * @alias module:collections-tracks.Tracks#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Tracks"),

            /**
             * constructor
             * @alias module:collections-tracks.Tracks#initialize
             */
            initialize: function (models, video) {
                _.bindAll(this, "setUrl");
                this.setUrl(video);
            },

            /**
             * Parse the given data
             * @alias module:collections-tracks.Tracks#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the tracks
             */
            parse: function (data) {
                if (data.tracks && _.isArray(data.tracks)) {
                    return data.tracks;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            /**
             * Get the tracks created by the current user
             * @alias module:collections-tracks.Tracks#getMine
             * @return {array} Array containing the list of tracks created by the current user
             */
            getMine: function () {
                return this.where({isMine: true});
            },

            /**
             * Simulate access to limited track for localStorage prototype.
             * @alias module:collections-tracks.Tracks#getVisibleTracks
             * @return {array} Array containing the list of the visible tracks
             */
            getVisibleTracks: function () {
                return this.remove(this.where({isMine: false, access: 0}));
            },

            /**
             * Define the url from the collection with the given video
             * @alias module:collections-tracks.Tracks#setUrl
             * @param {Video} Video containing the tracks
             */
            setUrl: function (video) {
                if (!video || !video.collection) {
                    throw "Parent video must be given!";
                }

                this.url = video.url() + "/tracks";

                if (annotationsTool.localStorage) {
                    this.localStorage = new Backbone.LocalStorage(this.url);
                }

                this.each(function (track) {
                    track.setUrl();
                });
            }
        });
        return Tracks;
    }
);
