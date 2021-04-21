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
 */

/**
 * A module representing the timeline view
 * @module views-timeline
 */
define([
    "util",
    "jquery",
    "underscore",
    "i18next",
    "player-adapter",
    "views/timeline-group",
    "templates/timeline",
    "templates/timeline-item",
    "templates/timeline-group",
    "templates/timeline-modal-group",
    "access",
    "backbone",
    "vis-timeline",
    "chroma",
    "bootstrap",
    "handlebarsHelpers"
], function (
    util,
    $,
    _,
    i18next,
    PlayerAdapter,
    TimelineGroup,
    template,
    itemTemplate,
    groupTemplate,
    groupModalTemplate,
    ACCESS,
    Backbone,
    vis,
    chroma
) {
    "use strict";

    function groupFromTrack(track) {
        var group = _.clone(track.attributes);
        if (annotationTool.selectedTrack === track) {
            group.className = "selected";
        } else {
            // Note that we need to set the `className` property
            // even for non-selected tracks, to override the selection class
            // when a track gets unselected.
            // Also this can't be `null` or the empty string,
            // because of `vis` internals.
            // Thus we use some dummy class here.
            group.className = "not-selected";
        }
        group.model = track;
        return group;
    }

    function itemFromAnnotation(annotation) {
        var item = annotation.toJSON();
        item.group = annotation.collection.track.id;
        item.start = util.dateFromSeconds(item.start);
        item.end = util.dateFromSeconds(item.end);
        var label = item.label;
        if (label) {
            var color = annotation.color();
            item.style = "background-color:" + color + ";" +
                "color:" + (
                    chroma(color).luminance() < 0.5
                        ? "white"
                        : "black"
                ) +
                ";";
        }
        item.type = item.duration
            ? "range"
            : "box";
        item.model = annotation;
        return item;
    }

    var PLACEHOLDER_TRACK = {
        isMine: true,
        id: "placeholder",
        name: i18next.t("timeline.no track available.short"),
        description: i18next.t("timeline.no track available.long"),
        empty: true,
        visible: false
    };

    function prepareTrack(track) {
        var annotations = track.annotations;
        this.listenTo(annotations, "add change", function (annotation) {
            this.items.update(itemFromAnnotation(annotation));
        });
        this.listenTo(annotations, "reset", function (annotations) {
            this.items.update(annotations.map(itemFromAnnotation));
        });
        this.listenTo(annotations, "remove", function (annotation) {
            this.items.remove(annotation.id);
        });

        var group = groupFromTrack(track);
        return group;
    }

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-timeline
     * @alias module:views-timeline.TimelineView
     */
    var Timeline = Backbone.View.extend({
        /**
         * Events to handle by the timeline view
         * @alias module:views-timeline.TimelineView#event
         * @type {map}
         */
        events: {
            "click #add-track": "initTrackModal",
            "click #reset-zoom": "onTimelineResetZoom",
            "click #zoom-in": "zoomIn",
            "click #zoom-out": "zoomOut",
            "click #move-right": "moveRight",
            "click #move-left": "moveLeft"
        },

        /**
         * Constructor
         * @alias module:views-timeline.TimelineView#initialize
         * @param {PlainObject} attr Object literal containing the view initialization attributes.
         */
        initialize: function (attr) {

            _(this).bindAll(
                "center"
            );

            this.playerAdapter = attr.playerAdapter;

            this.tracks = annotationTool.video.get("tracks");

            // Type use for delete operation
            this.typeForDeleteAnnotation = annotationTool.deleteOperation.targetTypes.ANNOTATION;

            this.$el.html(template());

            this.startDate = new Date(0);
            this.endDate = util.dateFromSeconds(this.playerAdapter.getDuration());

            // Options for the vis timeline
            var options = {
                height: "100%",
                margin: {
                    axis: 12.5,
                    item: {
                        vertical: 5,
                        horizontal: 0
                    }
                },
                verticalScroll: true,
                preferZoom: true,
                //zoomKey: 'shiftKey',
                //horizontalScroll: true,
                type: "box",
                editable: {
                    add: false,
                    updateTime: true,
                    updateGroup: false,
                    remove: false,
                    overrideItems: true
                },
                //groupEditable: {
                //    order: true
                //},
                zoomMin: Math.min(5000, this.endDate - this.startDate),
                start: this.startDate,
                end: this.endDate,
                min: this.startDate,
                max: this.endDate,
                snap: null,
                orientation: 'top',
                showMajorLabels: false,
                format: { minorLabels: function (moment) {
                    return util.formatTime(moment.unix());
                } },
                groupTemplate: _.bind(function (group, element) {
                    if (group.content != null) return group.content;
                    if (group.id === "placeholder") {
                        return groupTemplate(PLACEHOLDER_TRACK);
                    }
                    if (group.id in this.groupHeaders) {
                        this.groupHeaders[group.id].setElement(element);
                    } else {
                        this.groupHeaders[group.id] = new TimelineGroup({
                            el: element,
                            model: group.model,
                            parent: this
                        });
                    }
                    return this.groupHeaders[group.id].render();
                }, this),
                template: function (item) {
                    if (item.content != null) return item.content;
                    return itemTemplate(item);
                },
                onMoving: _.bind(function (item, move) {
                    if (!item.isMine) return;

                    var originalItem = this.items.get(item.id);

                    var start = util.secondsFromDate(item.start);
                    var end = util.secondsFromDate(item.end);
                    var originalStart = util.secondsFromDate(originalItem.start);
                    var originalEnd = util.secondsFromDate(originalItem.end);

                    var startChanged = start !== originalStart;
                    var endChanged = end !== originalEnd;
                    if (!(startChanged || endChanged)) {
                        // Nothing changed, and we assume the item was okay before,
                        // so we just pass it through here.
                        // This way we can always assume that at least one bound changed
                        // in the following code!
                        return move(item);
                    }

                    // don't allow resizing past the beginning and end
                    if (item.end - item.start < 0) {
                        if (item.start > originalItem.start) {
                            // moving the start time to the right
                            item.start = item.end;
                        } else if (item.end < originalItem.end) {
                            // moving the end time to the left
                            item.end = item.start;
                        }
                    }

                    // don't allow moving/resizing outsie of the video
                    var moving = startChanged && endChanged;

                    var videoDuration = this.playerAdapter.getDuration();
                    if (start < 0) {
                        item.start = util.dateFromSeconds(0);
                        if (moving) {
                            item.end = util.dateFromSeconds(item.duration);
                        }
                    } else if (end > videoDuration) {
                        item.end = util.dateFromSeconds(videoDuration);
                        if (moving) {
                            item.start = util.dateFromSeconds(videoDuration - item.duration);
                        }
                    }

                    return move(item);
                }, this)
                //stack: false,
                //cluster: {
                //    maxItems: 1,
                //    clusterCriteria: function (item1, item2) {
                //        if (_.contains([item1.id, item2.id], "track-selection")) {
                //            return false;
                //        }
                //        return true;
                //    }
                //},

                //width: "100%",
                //animate          : true,
                //   zoom
                //animateZoom      : true,

                //scale          : vis.Timeline.StepDate.SCALE.SECOND,
                //step           : 30,
            };

            this.groups = new vis.DataSet(
                [PLACEHOLDER_TRACK].concat(
                    this.tracks.map(prepareTrack, this)
                )
            );
            this.groups.update(_.map(
                annotationTool.tracksOrder,
                function (trackId, index) {
                    return { id: trackId, order: index };
                }
            ));

            this.groupHeaders = {};

            this.listenTo(this.tracks, "visibility", function () {
                this.groups.update(this.tracks.map(function (track) {
                    return {
                        id: track.id,
                        visible: track.get("visible")
                    };
                }));
            });
            this.listenTo(this.tracks, "add", function (track) {
                this.groups.update(prepareTrack.call(this, track));
            });
            this.listenTo(this.tracks, "change", function (track) {
                this.groups.update(groupFromTrack(track));
            });
            this.listenTo(this.tracks, "remove", function (track) {
                this.groupHeaders[track.id].remove();
                this.groups.remove(track.id);
            });
            this.listenTo(annotationTool, "order", function (order) {
                this.groups.update(_.map(order, function (trackId, index) {
                    return {
                        id: trackId,
                        order: index
                    };
                }));
            });

            this.groups.on("*", _.bind(function () {
                if ((
                    !this.groups.get(PLACEHOLDER_TRACK.id).visible
                ) && (
                    this.tracks.getVisibleTracks().length === 0
                )) {
                    this.groups.update({
                        id: PLACEHOLDER_TRACK.id,
                        visible: true
                    });
                } else if ((
                    this.groups.get(PLACEHOLDER_TRACK.id).visible
                ) && (
                    this.tracks.getVisibleTracks().length > 0
                )) {
                    this.groups.update({
                        id: PLACEHOLDER_TRACK.id,
                        visible: false
                    });
                }
            }, this));

            this.items = new vis.DataSet(
                this.tracks.chain()
                    .map(function (track) {
                        return track.annotations.map(itemFromAnnotation);
                    })
                    .flatten()
                    .value()
            );

            this.items.on("update", _.bind(function (event, properties) {
                _.chain(properties.data)
                    .zip(properties.oldData)
                    .each(function (item) {
                        if (!item[0].model) return;

                        if ((
                            item[0].start.getTime() === item[1].start.getTime()
                        ) && (
                            item[0].end.getTime() === item[1].end.getTime()
                        )) return;
                        var start = util.secondsFromDate(item[0].start);
                        var end = util.secondsFromDate(item[0].end);
                        var duration = end - start;
                        var annotation = this.tracks.get(item[0].group)
                            .annotations.get(item[0].id);
                        annotation.save({
                            start: start,
                            duration: end - start
                        });
                    }, this);
            }, this));

            // Create the timeline
            this.$timeline = this.$el.find("#timeline");
            this.timeline = new vis.Timeline(
                this.$timeline[0],
                this.items,
                this.groups,
                options
            );

            this.timeline.addCustomTime();
            this.timeline.setCustomTime(this.startDate);
            this.timeline.setCustomTimeMarker("");

            this.timeClock = this.$el.find(".time");
            annotationTool.addTimeupdateListener(_.bind(this.onPlayerTimeUpdate, this), 1);
            this.onPlayerTimeUpdate();

            function clickedOnOneOfMyTracks(properties) {
                var track = this.tracks.get(properties.group);
                if (!track) return false;
                if (!track.isMine()) return false;
                if (
                    this.groupHeaders[properties.group].$el
                        .find("button")
                        .has(properties.event.target).length
                ) return false;
                return track;
            }
            this.timeline.on("click", _.bind(function (properties) {
                if (properties.what === "group-label") {
                    var myTrack = clickedOnOneOfMyTracks.call(this, properties);
                    if (!myTrack) return;
                    annotationTool.selectTrack(myTrack);
                } else if (properties.what === "axis") {
                    this.playerAdapter.setCurrentTime(
                        util.secondsFromDate(properties.time)
                    );
                }
            }, this));
            this.timeline.on("doubleClick", _.bind(function (properties) {
                if (properties.what === "group-label") {
                    var myTrack = clickedOnOneOfMyTracks.call(this, properties);
                    if (!myTrack) return;
                    this.initTrackModal(properties.event, myTrack);
                } else if (properties.what === "item") {
                    this.playerAdapter.setCurrentTime(util.secondsFromDate(
                        this.items.get(properties.item).start
                    ));
                }
            }, this));

            this.timeline.on("timechanged", _.bind(function (options) {
                this.timeline.setCustomTimeTitle(
                    util.formatTime(util.secondsFromDate(options.time))
                );
            }, this));
            var movePlayhead = _.bind(function (event) {
                var newTime = util.secondsFromDate(event.time);
                var isPlaying = this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING;

                if (isPlaying) {
                    this.playerAdapter.pause();
                }

                this.playerAdapter.setCurrentTime(
                    Math.max(
                        0,
                        Math.min(
                            this.playerAdapter.getDuration(),
                            newTime
                        )
                    )
                );

                if (isPlaying) {
                    this.playerAdapter.play();
                }
            }, this);
            this.timeline.on("timechanged", movePlayhead);
            this.timeline.on("timechange", movePlayhead);

            this.listenTo(
                this.tracks,
                "select",
                function (track, previousTrack) {
                    var tracksToUpdate = [];
                    if (previousTrack) tracksToUpdate.push(previousTrack);
                    if (track) tracksToUpdate.push(track);
                    // TDOO I don't want groups to be a member but I have to ...
                    this.groups.update(_.map(tracksToUpdate, groupFromTrack));
                }
            );
            this.listenTo(
                annotationTool,
                annotationTool.EVENTS.ANNOTATION_SELECTION,
                function (selection) {
                    this.timeline.setSelection(selection && selection.id);
                }
            );
            this.listenTo(
                annotationTool,
                annotationTool.EVENTS.ACTIVE_ANNOTATIONS,
                function (currentAnnotations, previousAnnotations) {
                    // TDOO We could probably speed this up;
                    //   maybe we could even receive the diff somehow?
                    this.items.update(_.map(previousAnnotations, function (annotation) {
                        return {
                            id: annotation.id,
                            className: _.without(
                                getClassName.call(this, annotation).split(" "),
                                "active"
                            ).join(' ')
                        };
                    }, this));
                    this.items.update(_.map(currentAnnotations, function (annotation) {
                        return {
                            id: annotation.id,
                            className: _.uniq(
                                getClassName.call(this, annotation).split(" ")
                                    .concat(["active"])
                            ).join(' ')
                        };
                    }, this));
                }
            );
            function getClassName(annotation) {
                return this.items.get(annotation.id).className || "";
            }
            // Long-pressing is normally only used for multiple selections,
            // which we don't support.
            // Additionally this is a problem when you select an item
            // and then start holding the mouse button to move it,
            // but take to long to actually start moving.
            // If we let this event through,
            // the item would just be deselected in that scenario.
            this.timeline.itemSet.hammer.off("press");
            this.timeline.on("select", _.bind(function (properties) {
                annotationTool.setSelection(
                    this.items.get(properties.items[0]).model,
                    // Toggle selection on single click,
                    // unconditionally select on double click
                    properties.event.tapCount > 1
                );
            }, this));


            function updateCategoryAnnotations(category, visible) {
                var relevantAnnotations = annotationTool.video
                    .getAnnotations(category);
                if (visible == null) visible = category.get("visible");
                if (visible) {
                    this.items.update(
                        _.map(relevantAnnotations, itemFromAnnotation)
                    );
                } else {
                    this.items.remove(
                        _.map(relevantAnnotations, "id")
                    );
                }
            }

            this.listenTo(
                annotationTool.video.get("categories"),
                "change:visible",
                updateCategoryAnnotations
            );
            this.listenTo(
                annotationTool,
                "togglefreetext",
                function (visible) {
                    updateCategoryAnnotations.call(this, null, visible);
                }
            );

            this.listenTo(
                annotationTool.video.get("categories"),
                "change",
                function (category) {
                    updateCategoryAnnotations.call(this, category);
                }
            );

            this.$el.popover({
                selector: ".track-details",
                trigger: "hover",
                // Note this does not work at the moment, see below
                //html: true,
                //container: "body"
            });
            // This is a pretty big hack; basically, our versions of
            // Bootstrap and jQuery are incompatible, unfortunately.
            // That makes copying the above options to an instance
            // of the popover plugin fail, making that in turn
            // use the defaults.
            // We can get rid of this if we ever get around
            // to updating these libraries, or to refactoring the code
            // so that we don't have to use the `selector` feature
            // of the popover plugin, making the copying above
            // unnecessary.
            _.extend($.fn.popover.defaults, {
                html: true,
                container: "body"
            });
        },

        /** @override */
        remove: function () {
            _.each(this.groupHeaders, function (groupHeader) {
                groupHeader.remove();
            });
            this.timeline.destroy();
            this.$el.popover("destroy");
            return Backbone.View.prototype.remove.apply(this, arguments);
        },

        /**
         * Move the timeline relative to the current window
         * @alias module:views-timeline.TimelineView#move
         * @param {number} factor Percentage of the current window's size
         *     to move by
         */
        move: function (factor) {
            var window = this.timeline.getWindow();
            var size = window.end - window.start;
            this.timeline.moveTo(
                window.start.getTime() + size / 2 + size * factor
            );
        },

        /**
         * Move the current range to the left
         * @alias module:views-timeline.TimelineView#moveLeft
         * @param  {Event} event Event object
         */
        moveLeft: function (event) {
            this.move(-MOVEMENT_FACTOR);
        },

        /**
         * [moveRight description]
         * @alias module:views-timeline.TimelineView#Right
         * @param  {Event} event Event object
         */
        moveRight: function (event) {
            this.move(MOVEMENT_FACTOR);
        },

        /**
         * Center the timeline around the playhead
         * @alias module:views-timeline.TimelineView#center
         */
        center: function () {
            this.timeline.moveTo(this.timeline.getCustomTime());
        },

        /**
         * Zoom in
         * @alias module:views-timeline.TimelineView#zoomIn
         * @param  {Event} event Event object
         */
        zoomIn: function (event) {
            this.timeline.zoomIn(ZOOM_FACTOR, null, this.center);
        },

        /**
         * Zoom out
         * @alias module:views-timeline.TimelineView#zoomOut
         * @param  {Event} event Event object
         */
        zoomOut: function (event) {
            this.timeline.zoomOut(ZOOM_FACTOR, null, this.center);
        },

        /**
         * Initialize the creation or update of a track, and load a corresponding modal
         * @alias module:views-timeline.TimelineView#initTrackModal
         * @param {Event} event The event triggering this modal
         * @param {Track} track The track to edit or <tt>undefined</tt> to create a new one
         */
        initTrackModal: function (event, track) {
            var action = track ? "update" : "add";

            var modal = this.$el.find("#modal-" + action + "-group");
            modal.off();
            modal.html(
                groupModalTemplate(_.extend(
                    { action: action },
                    track && track.attributes
                ))
            );

            var dismissModal = function () {
                modal.modal("hide");
            };

            var saveTrack = _.bind(function () {
                var name = modal.find("#name").val();
                var description = modal.find("#description").val();

                if (name === "") {
                    modal.find(".alert #content").html(i18next.t("timeline.name required"));
                    modal.find(".alert").show();
                    return;
                } else if (name.search(/<\/?script>/i) >= 0 || description.search(/<\/?script>/i) >= 0) {
                    modal.find(".alert #content").html(i18next.t("timeline.scripts not allowed"));
                    modal.find(".alert").show();
                    return;
                }

                var access;
                var accessRadio = modal.find("input[name='access-radio']:checked");
                if (accessRadio.length > 0) {
                    access = ACCESS.parse(accessRadio.val());
                } else {
                    access = ACCESS.PUBLIC;
                }

                var attrs = {
                    name: name,
                    description: description,
                    access: access
                };
                if (track) {
                    track.save(attrs);
                } else {
                    track = this.tracks.create(attrs, { wait: true });
                }

                dismissModal();
            }, this);

            modal.find(".submit").on("click", saveTrack);
            modal.on("keypress", function (event) {
                if (event.keyCode === 13) {
                    saveTrack();
                }
            });

            modal.find(".cancel").on("click", dismissModal);

            modal.on("shown", function () {
                modal.find("#name").focus();
                var access = ACCESS.render(
                    track
                        ? track.get("access")
                        : ACCESS.PUBLIC
                );
                modal.find("[name='access-radio'][value='" + access + "']").prop("checked", true);
            });
            modal.modal({
                show: true,
                backdrop: false,
                keyboard: true
            });
        },

        /**
         * Listener for the player timeupdate
         * @alias module:views-timeline.TimelineView#onPlayerTimeUpdate
         */
        onPlayerTimeUpdate: function () {
            var currentTime = this.playerAdapter.getCurrentTime();
            var formattedTime = util.formatTime(currentTime);
            this.timeline.setCustomTime(util.dateFromSeconds(currentTime));
            this.timeline.setCustomTimeTitle(formattedTime);
            this.timeClock.html(formattedTime);
            this.timeline.moveTo(
                util.dateFromSeconds(this.playerAdapter.getCurrentTime()),
                { animation: { easingFunction: "linear" } }
            );
        },

        /**
         * Reset the timeline zoom to see the whole timeline
         * @alias module:views-timeline.TimelineView#onTimelineResetZoom
         */
        onTimelineResetZoom: function () {
            this.timeline.setWindow(this.startDate, this.endDate);
        }
    });

    var MOVEMENT_FACTOR = 0.2;
    var ZOOM_FACTOR = 0.4;

    return Timeline;
});
