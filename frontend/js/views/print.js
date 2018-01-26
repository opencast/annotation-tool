/**
 *  Copyright 2017, ELAN e.V., Germany
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
 */

/**
 * A module to print annotations to be able to compare them nicely.
 * @module views-print
 * @requires underscore
 * @requires backbone
 * @requires templates/print
 * @requires handlebarsHelpers
 */
define(["underscore", "backbone", "templates/print", "handlebarsHelpers"], function (_, Backbone, printTemplate) {

    "use strict";


    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-print
     * @alias PrintView
     */
    var PrintView = Backbone.View.extend({
        /**
         * The element in which the print view is displayed.
         * @alias module:views-print.PrintView#el
         */
        el: '#print-view',
        /**
         * The template to render the print view with.
         * @alias module:views-print.PrintView#template
         */
        template: printTemplate,


        /**
         * Constructor
         * @alias module:views-print.PrintView#initialize
         * @param {Object} model The model managing all the annotations and related data. See {@link annotation-tool}.
         */
        initialize: function (model) {
            this.model = model;
            this.render();
        },

        /**
         * Actually render the print view.
         * This also collects and reformats lots of data from the model,
         * which could be expensive, but this should be okay,
         * as a print view should not be generated all that often
         * (in comparison to other views).
         */
        render: function () {
            var video = this.model.video;

            // Get all the tracks
            var tracks = video.get("tracks");
            tracks = _.map(this.model.tracksOrder, function (trackId) {
                return tracks.get(trackId);
            });
            var annotations = _.chain(tracks)
                .invoke('get', 'annotations')
                .pluck("models")
                .flatten()
                .filter(function (annotation) {
                    var category = annotation.category();
                    if (!category) return true;
                    return category.get("visible");
                });

            var users = annotations
                .invoke("get", "created_by_nickname")
                .uniq()
                .map(function (name) {
                    return { name: name };
                }).value();

            // Get all used categories and and their scales
            var labels = annotations
                .filter(function (annotation) { return annotation.has("label"); })
                .invoke("get", "label")
                .uniq("id");
            var categories = labels.pluck("category")
                .sortBy("name")
                .uniq("id")
                .map(function (category) {
                    // Construct the scale string
                    var result = { name: category.name };
                    var scaleId = category.scale_id || (category.scale && category.scale.id);
                    if (scaleId) {
                        result.scale = video.get("scales")
                            .get(scaleId)
                            .get("scaleValues")
                            .invoke("get", "name")
                            .join("/");
                    }
                    return result;
                });
            // Get all the labels in a tabular structure for easy processing by the template
            var labelRows = labels
                .groupBy(function (label) { return label.category.name; })
                .pairs()
                .sortBy(0)
                .map(1)
                .unzip()
                .map(function (labels) {
                    return {
                        labels: labels
                    };
                }).value();

            // Transform annotations to the format needed in the template
            annotations = annotations
                .sortBy(function (annotation) { return annotation.get("start"); })
                .map(function (annotation) {
                    var result = {};

                    result.author = annotation.get("created_by_nickname");

                    // Assign text for free text annotations
                    var label = annotation.get("label");
                    if (!label) result.free = annotation.get("text");

                    // Build the display code
                    if (label) {
                        result.codes = label.abbreviation;
                        var scaleValue = annotation.get("scalevalue");
                        if (scaleValue) result.codes += " " + scaleValue.name;
                    } else {
                        result.codes = "Free";
                    }

                    // Build the timecode
                    var startTime = annotation.get("start");
                    var endTime = startTime + annotation.get("duration");
                    function formatTime(seconds) {
                        // Naively zero-pad a number to two digits
                        function pad(n) {
                            return ("0" + n).substr(-2);
                        }

                        seconds = Math.floor(seconds);
                        var minutes = Math.floor(seconds / 60);
                        seconds -= minutes * 60;
                        var hours = Math.floor(minutes / 60);
                        minutes -= hours * 60;
                        return hours + ":" + pad(minutes) + ":" + pad(seconds);
                    }
                    result.timecode = formatTime(startTime) + "–" + formatTime(endTime);

                    // Get comments by user
                    if (!annotation.areCommentsLoaded()) {
                        annotation.fetchComments();
                    }
                    function commentWithReplies(comment) {
                        return {
                            author: comment.get("created_by_nickname"),
                            text: comment.get("text"),
                            replies: comment.replies.map(commentWithReplies)
                        };
                    }
                    result.comments = annotation.get("comments").map(commentWithReplies);

                    result.track = annotation.collection.track.id;

                    return result;
                }).value();

            // Format tracks
            tracks = _.map(tracks, function (track) {
                return {
                    name: track.get("name"),
                    owner: track.get("created_by_nickname"),
                    id: track.id
                };
            });

            this.$el.html(this.template({
                title: video.get("title"),
                tracks: tracks,
                annotations: annotations,
                categories: categories.value(),
                labelRows: labelRows
            }, {
                helpers: {
                    ifEq: function (lhs, rhs, options) {
                        if (lhs === rhs) {
                            return options.fn(this);
                        } else {
                            return options.inverse(this);
                        }
                    }
                }
            }));
            return this;
        }
    });

    return PrintView;
});
