define(["underscore", "backbone", "templates/print"], function (_, Backbone, printTemplate) {

    "use strict";

    var PrintView = Backbone.View.extend({
        el: '#print-view',
        template: printTemplate,

        initialize: function (model) {
            // TODO Maybe only accept the video?
            this.model = model;
            this.render();
        },

        render: function () {
            var video = this.model.video;

            // Get all the tracks
            var tracks = video.get("tracks");
            var annotations = tracks.chain()
                .invoke('get', 'annotations')
                .pluck("models")
                .flatten();

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
                .sort("name")
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
                .sort(0)
                .map(1)
                .unzip()
                .map(function (labels) {
                    return {
                        labels: labels
                    };
                }).value();
            if (labelRows.length === 0) {
                labelRows.push({ first: true, labels: categories.map(_.constant({})) });
            } else {
                labelRows[0].first = true;
            }

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
                    result.comments = annotation.get("comments")
                        .map(function (comment) {
                            return {
                                author: comment.get("created_by_nickname"),
                                text: comment.get("text")
                            };
                        });

                    result.track = annotation.collection.track.id;

                    return result;
                }).value();

            // Format tracks
            tracks = tracks.map(function (track) {
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
