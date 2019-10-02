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
 */
define(["underscore",
        "models/track",
        "backbone"],

    function (_, Track, Backbone) {

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
             * List of visible tracks
             * @type {Array}
             */
            visibleTracks: [],

            /**
             * constructor
             * @alias module:collections-tracks.Tracks#initialize
             */
            initialize: function (models, video) {
                _.bindAll(this, "showTracks",
                                "getTracksForLocalStorage");

                this.video = video;

                this.on("add", function (track) {
                    // Show the new track
                    this.showTracks([track], true);

                    // Select the new track
                    annotationTool.selectedTrack = track;
                });
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
            getTracksForLocalStorage: function () {
                return this.remove(this.where({isMine: false, access: 0}));
            },

            /**
             * Get the tracks currently visible in the tool's views
             * @return {array} an array containing the visible tracks
             */
            getVisibleTracks: function () {
                return this.visibleTracks;
            },

            /**
             * Displays the given tracks and hide the current displayed tracks.
             * @param  {array} tracks an array containing the tracks to display
             * @param  {boolean} keepPrevious should previously visible tracks stay visible?
             */
            showTracks: function (tracks, keepPrevious) {
                var selectedTrack = annotationTool.selectedTrack;

                if (!keepPrevious) {
                    _.each(this.visibleTracks, function (track) {
                        // TODO Is this field even used?
                        track.set(Track.FIELDS.VISIBLE, false);
                    });
                    this.visibleTracks = [];
                }

                _.each(tracks, function (track) {
                    if (!track.get("annotationsLoaded")) {
                        track.fetchAnnotations();
                    }
                    track.set(Track.FIELDS.VISIBLE, true);
                    this.visibleTracks.push(track);
                }, this);

                if (!selectedTrack || !selectedTrack.get("visible")) {
                    selectedTrack = _.find(this.visibleTracks, function (track) {
                        return track.get("isMine");
                    }, this);
                    annotationTool.selectTrack(selectedTrack);
                }

                this.trigger("visibility", this.visibleTracks);
            },

            /**
             * Get the url for this collection
             * @alias module:collections-tracks.Tracks#url
             * @return {String} The url of this collection
             */
            url: function () {
                return _.result(this.video, "url") + "/tracks";
            }
        });

        return Tracks;
    }
);
