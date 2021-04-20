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
        "backbone",
        "access"],

    function (_, Track, Backbone, ACCESS) {

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
             * @alias module:collections-tracks.Tracks#model
             */
            model: Track,

            /**
             * constructor
             * @alias module:collections-tracks.Tracks#initialize
             */
            initialize: function (models, options) {
                this.video = options.video;

                this.on("add", function (track) {
                    // Show the new track
                    this.showTracks([track], true);

                    // Select the new track
                    annotationTool.selectTrack(track);
                }, this);
            },

            /**
             * Parse the given data
             * @alias module:collections-tracks.Tracks#parse
             * @param {object} data object or array containing the data to parse.
             * @return {object} the part of the given data related to the tracks
             */
            parse: function (data) {
                if (data.tracks && _.isArray(data.tracks)) {
                    data = data.tracks;
                }
                return _.filter(data, function (track) {
                    if (track.access === ACCESS.PUBLIC) {
                        return true;
                    }
                    if (track.created_by === annotationTool.user.id) {
                        return true;
                    }
                    if ((
                        track.access === ACCESS.SHARED_WITH_ADMIN
                    ) && (
                        annotationTool.user.isAdmin()
                    )) {
                        return true;
                    }
                    return false;
                });
            },

            /**
             * Get the tracks currently visible in the tool's views
             * @return {array} an array containing the visible tracks
             */
            getVisibleTracks: function () {
                return this.filter(function (track) {
                    return track.get(Track.FIELDS.VISIBLE);
                });
            },

            /**
             * Displays the given tracks and hide the current displayed tracks.
             * @param {array} tracks an array containing the tracks to display
             * @param {boolean} keepPrevious should previously visible tracks stay visible?
             */
            showTracks: function (tracks, keepPrevious) {
                var selectedTrack = annotationTool.selectedTrack;
                var visibleTracks = this.getVisibleTracks();

                if (!keepPrevious) {
                    _.each(visibleTracks, function (track) {
                        // TODO Is this field even used?
                        track.set(Track.FIELDS.VISIBLE, false);
                    });
                    visibleTracks = [];
                }

                _.each(tracks, function (track) {
                    track.fetchAnnotations();
                    track.set(Track.FIELDS.VISIBLE, true);
                    visibleTracks.push(track);
                }, this);

                if (!selectedTrack || !selectedTrack.get("visible")) {
                    selectedTrack = _.find(visibleTracks, function (track) {
                        return track.isMine();
                    }, this);
                    annotationTool.selectTrack(selectedTrack);
                }

                this.trigger("visibility", visibleTracks);
            },

            /**
             * Get the url for this collection
             * @alias module:collections-tracks.Tracks#url
             * @return {String} the url of this collection
             */
            url: function () {
                return _.result(this.video, "url") + "/tracks";
            }
        });

        return Tracks;
    }
);
