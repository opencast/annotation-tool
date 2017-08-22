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
 * @requires util
 * @requires jquery
 * @requires underscore
 * @requires i18next
 * @requires player-adapter
 * @requires models-annotation
 * @requires collections-annotations
 * @requires templates/timeline-group.tmpl
 * @requires templates/timeline-item.tmpl
 * @requires templates/timeline-placeholder.tmpl
 * @requires templates/timeline-modal-group.tmpl
 * @requires ACCESS
 * @requires ROLES
 * @requires filters-manager
 * @requires backbone
 * @requires timeline
 * @requires bootstrap.tooltip
 * @requires bootstrap.popover
 * @requires handlebarsHelpers
 */
define(["util",
        "jquery",
        "underscore",
        "i18next",
        "prototypes/player_adapter",
        "models/annotation",
        "models/track",
        "collections/annotations",
        "collections/tracks",
        "templates/timeline-group",
        "templates/timeline-group-empty",
        "templates/timeline-item",
        "templates/timeline-placeholder",
        "templates/timeline-modal-add-group",
        "templates/timeline-modal-update-group",
        "access",
        "roles",
        "backbone",
        "timeline",
        "tooltip",
        "popover",
        "handlebarsHelpers"
    ],

       function (util, $, _, i18next, PlayerAdapter, Annotation, Track, Annotations, Tracks, GroupTmpl, GroupEmptyTmpl,
            ItemTmpl, PlaceholderTmpl, ModalAddGroupTmpl, ModalUpdateGroupTmpl, ACCESS, ROLES, Backbone, links) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-timeline
         * @alias module:views-timeline.TimelineView
         */
        var Timeline = Backbone.View.extend({

            /**
             * Main container of the timeline
             * @alias module:views-timeline.TimelineView#el
             * @type {DOMElement}
             */
            el: $("div#timeline-container")[0],

            /**
             * Group template
             * @alias module:views-timeline.TimelineView#groupTemplate
             * @type {HandlebarsTemplate}
             */
            groupTemplate: GroupTmpl,

            /**
             * Empty group template
             * @alias module:views-timeline.TimelineView#groupEmptyTemplate
             * @type {HandlebarsTemplate}
             */
            groupEmptyTemplate: GroupEmptyTmpl,

            /**
             * Item template
             * @alias module:views-timeline.TimelineView#itemTemplate
             * @type {HandlebarsTemplate}
             */
            itemTemplate: ItemTmpl,

            /**
             * Modal template for group insertion
             * @alias module:views-timeline.TimelineView#modalAddGroupTemplate
             * @type {HandlebarsTemplate}
             */
            modalAddGroupTemplate: ModalAddGroupTmpl,

            /**
             * Modal template for group update
             * @alias module:views-timeline.TimelineView#modalUpdateGroupTemplate
             * @type {HandlebarsTemplate}
             */
            modalUpdateGroupTemplate: ModalUpdateGroupTmpl,

            /**
             * Events to handle by the timeline view
             * @alias module:views-timeline.TimelineView#event
             * @type {map}
             */
            events: {
                "click #add-track": "initTrackCreation",
                "click #reset-zoom": "onTimelineResetZoom",
                "click #zoom-in": "zoomIn",
                "click #zoom-out": "zoomOut",
                "click #move-right": "moveRight",
                "click #move-left": "moveLeft",
                "click .timeline-placeholder": "expandTrack",
                "click .toggle-expansion": "toggleTrackExpansion"
            },

            /**
             * Template for void item content
             * @alias module:views-timeline.TimelineView#VOID_ITEM_TMPL
             * @type {string}
             * @constant
             */
            VOID_ITEM_TMPL: "<div style=\"display:none\"></div>",

            /**
             * Void track paramters
             * @alias module:views-timeline.TimelineView#VOID_TRACK
             * @type {Object}
             * @constant
             */
            VOID_TRACK: {
                isMine      : true,
                id          : "empty-timeline",
                name        : i18next.t("timeline.no track available.short"),
                description : i18next.t("timeline.no track available.long")
            },

            /**
             * Default duration for annotation
             * @alias module:views-timeline.TimelineView#DEFAULT_DURATION
             * @type {Integer}
             * @constant
             */
            DEFAULT_DURATION: 5,

            /**
             * Class prefix for stack level
             * @alias module:views-timeline.TimelineView#PREFIX_STACKING_CLASS
             * @type {string}
             * @constant
             */
            PREFIX_STACKING_CLASS: "stack-level-",

            /**
             * Class for item selected on timeline
             * @alias module:views-timeline.TimelineView#ITEM_SELECTED_CLASS
             * @type {string}
             * @constant
             */
            ITEM_SELECTED_CLASS: "timeline-event-selected",

            /**
             * Map containing all the items
             * @alias module:views-timeline.TimelineView#annotationItems
             * @type {map}
             */
            annotationItems: {},

            /**
             * Placeholder items to keep tracks visible even when there is no annotation item in them
             * @alias module:views-timeline.TimelineView#trackItems
             * @type {map}
             */
            trackItems: {},

            /**
             * Items from external sources.
             * @see module:views-loop
             * @alias module:views-timeline.TimelineView#trackItems
             * @type {map}
             */
            extraItems: {},

            /**
             * Cache for the timeline items after some preprocessing indexed by track id
             * @alias module:views-timeline.TimelineView#preprocessedItems
             * @type {map}
             * @see preprocessTrack
             */
            preprocessedItems: {},

            /**
             * Array containing only the items displayed in the timeline
             * @alias module:views-timeline.TimelineView#filteredItems
             * @type {array}
             */
            filteredItems: [],

            /**
             * Set of currently expanded tracks, i.e. tracks that show all their items without preprocessing.
             * @alias module:views-timeline.TimelineView#trackExpanded
             * @type {object}
             * @see preprocessTrack
             */
            trackExpanded: {},

            /**
             * Constructor
             * @alias module:views-timeline.TimelineView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                _.bindAll(this,
                    "addTrack",
                    "addTracksList",
                    "createTrack",
                    "changeTitleFromCustomPlayhead",
                    "onDeleteTrack",
                    "onTrackSelected",
                    "onSelectionUpdate",
                    "onPlayerTimeUpdate",
                    "onTimelineMoved",
                    "onTimelineItemChanged",
                    "onTimelineItemDeleted",
                    "isAnnotationSelectedonTimeline",
                    "onTimelineItemAdded",
                    "onAnnotationDestroyed",
                    "generateVoidItem",
                    "generateItem",
                    "changeItem",
                    "changeTrack",
                    "getFormatedDate",
                    "getSelectedItemAndAnnotation",
                    "getTrack",
                    "onWindowResize",
                    "onTimelineResetZoom",
                    "initTrackCreation",
                    "initTrackUpdate",
                    "updateDraggingCtrl",
                    "moveToCurrentTime",
                    "moveRight",
                    "moveLeft",
                    "zoomIn",
                    "zoomOut",
                    "timerangeChange",
                    "repaintCustomTime",
                    "redraw",
                    "reset",
                    "updateHeader");

                this.playerAdapter = attr.playerAdapter;

                // Type use for delete operation
                this.typeForDeleteAnnotation = annotationsTool.deleteOperation.targetTypes.ANNOTATION;
                this.typeForDeleteTrack = annotationsTool.deleteOperation.targetTypes.TRACK;

                this.startDate = this.getFormatedDate(0);
                this.endDate = this.getFormatedDate(this.playerAdapter.getDuration());

                // Options for the links timeline
                this.options = {
                    width            : "100%",
                    height           : "auto",
                    style            : "box",
                    //scale          : links.Timeline.StepDate.SCALE.SECOND,
                    //step           : 30,
                    showButtonNew    : false,
                    editable         : true,
                    start            : this.startDate,
                    end              : this.endDate,
                    min              : this.startDate,
                    max              : this.endDate,
                    intervalMin      : 5000,
                    showCustomTime   : true,
                    showNavigation   : false,
                    showMajorLabels  : false,
                    snapEvents       : false,
                    stackEvents      : true,
                    minHeight        : "200",
                    axisOnTop        : true,
                    groupsWidth      : "150px",
                    animate          : true,
                    animateZoom      : true,
                    // cluster       : true,
                    eventMarginAxis  : 0,
                    eventMargin      : 0,
                    dragAreaWidth    : 5,
                    groupsChangeable : true
                };

                this.$navbar = this.$el.find(".navbar");

                // Create the timeline
                this.$timeline = this.$el.find("#timeline");
                this.timeline = new links.Timeline(this.$timeline[0]);
                // Draw the timeline initially, so that it's HTML elements are available for attaching listeners, etc.
                this.timeline.draw([], this.options);

                // Ensure that the timeline is redraw on window resize
                $(window).bind("resize", this.onWindowResize);

                annotationsTool.addTimeupdateListener(this.onPlayerTimeUpdate, 1);

                this.$el.find(".timeline-frame > div:first-child").bind("click", function (event) {
                    if ($(event.target).find(".timeline-event").length > 0) {
                        annotationsTool.setSelection([]);
                    }
                });

                links.events.addListener(this.timeline, "timechanged", this.onTimelineMoved);
                links.events.addListener(this.timeline, "timechange", this.onTimelineMoved);
                links.events.addListener(this.timeline, "change", this.onTimelineItemChanged);
                links.events.addListener(this.timeline, "delete", this.onTimelineItemDeleted);
                links.events.addListener(this.timeline, "add", this.onTimelineItemAdded);
                links.events.addListener(this.timeline, "rangechange", this.timerangeChange);

                this.tracks = annotationsTool.video.get("tracks");
                this.listenTo(this.tracks, Tracks.EVENTS.VISIBILITY, this.addTracksList);
                this.listenTo(this.tracks, "change", this.changeTrack);
                this.listenTo(annotationsTool, annotationsTool.EVENTS.ANNOTATION_SELECTION, this.onSelectionUpdate);

                this.listenTo(annotationsTool.video.get("categories"), "change:visible", _.bind(function () {
                    this.preprocessAllTracks();
                    this.redraw();
                }, this));

                this.$el.show();
                this.addTracksList(this.tracks.getVisibleTracks());
                this.timeline.setCustomTime(this.startDate);

                // Overwrite the redraw method
                this.timeline.repaintCustomTime = this.repaintCustomTime;
                this.timeline.redraw = this.redraw;

                // Add findGroup method to the timeline if missing
                if (!this.timeline.findGroup) {
                    this.timeline.findGroup = this.findGroup;
                    _.bindAll(this.timeline, "findGroup");
                }

                this.$el.find(".timeline-frame > div")[0].addEventListener("mousewheel", function (event) {
                    event.stopPropagation();
                }, true);

                this.listenTo(annotationsTool, "order", function () {
                    this.preprocessAllTracks();
                    this.redraw();
                });

                this.timerangeChange();
                this.$timeline.scroll(this.updateHeader);
                this.onPlayerTimeUpdate();
            },


            /**
             * Search for the group/track with the given name in the timeline
             * @alias module:views-timeline.TimelineView#findGroup
             * @param {Annotation} groupName the name of the group/track to search
             * @return {Object} The search group/track as timeline-group if found, or undefined
             */
            findGroup: function (groupName) {
                return _.find(this.groups, function (group) {
                    return $(group.content).find("div.content").text().toUpperCase() === groupName.toUpperCase();
                });
            },

            /**
             * Add an annotation to the timeline
             * @alias module:views-timeline.TimelineView#redraw
             */
            redraw: function () {
                var timedItems = _.chain(this.preprocessedItems)
                    .values()
                    .flatten()
                    .value()
                    .concat(_.values(this.extraItems));

                var visibleRange = this.timeline.getVisibleChartRange();
                var startTime = visibleRange.start;
                var endTime = visibleRange.end;
                var filteredItems = _.filter(timedItems, function (item) {
                    return startTime <= item.end && item.start <= endTime;
                });

                if (!filteredItems.length) {
                    filteredItems = [{
                        trackId: this.VOID_TRACK.id,
                        isMine: this.VOID_TRACK.isMine,
                        isPublic: true,
                        start: this.startDate - 5000,
                        end: this.startDate - 4500,
                        content: this.VOID_ITEM_TMPL,
                        group: this.groupEmptyTemplate(this.VOID_TRACK)
                    }];
                }

                // We save the actually displayed items here to access them later, for example in `onSelectionUpdate`
                this.filteredItems = filteredItems.concat(_.values(this.trackItems));

                // Dispose of all placeholder popovers to avoid displaying stale information
                $(".timeline-placeholder").popover("hide");

                this.timeline.draw(this.filteredItems);

                // Enable the preview popover for all the placeholder items
                $(".timeline-placeholder").popover({
                    content: function () {
                        return $(this).find(".hidden-items").html();
                    }
                });

                // Restore the selections and co.
                if (annotationsTool.hasSelection()) {
                    this.onSelectionUpdate(annotationsTool.getSelection());
                    this.updateDraggingCtrl();
                }
                if (annotationsTool.selectedTrack) {
                    this.onTrackSelected(null, annotationsTool.selectedTrack.id);
                }
            },

            /**
             * Update the timerange filter with the timerange
             * @alias module:views-timeline.TimelineView#timerangeChange
             */
            timerangeChange: function () {
                this.redraw();
            },

            /**
             * Update the position of the timeline header on scroll
             * @alias module:views-timeline.TimelineView#updateHeader
             */
            updateHeader: function () {
                var self = this;

                $("div.timeline-frame > div:first-child > div:first-child").css({
                    "margin-top": self.$timeline.scrollTop() - 2
                });
            },

            /**
             * Repaint the custom playhead
             * @alias module:views-timeline.TimelineView#repaintCustomTime
             */
            repaintCustomTime: function () {
                links.Timeline.prototype.repaintCustomTime.call(this.timeline);
                this.changeTitleFromCustomPlayhead();
            },

            /**
             * Change the title from the custome Playhead with a better time format
             * @alias module:views-timeline.TimelineView#changeTitleFromCustomPlayhead
             */
            changeTitleFromCustomPlayhead: function () {
                this.$el.find(".timeline-customtime").attr("title", annotationsTool.getWellFormatedTime(this.playerAdapter.getCurrentTime()));
            },

            /**
             * Move the current range to the left
             * @alias module:views-timeline.TimelineView#moveLeft
             * @param  {Event} event Event object
             */
            moveLeft: function (event) {
                links.Timeline.preventDefault(event);
                links.Timeline.stopPropagation(event);
                this.timeline.move(-0.2);
                this.timeline.trigger("rangechange");
                this.timeline.trigger("rangechanged");
            },

            /**
             * [moveRight description]
             * @alias module:views-timeline.TimelineView#Right
             * @param  {Event} event Event object
             */
            moveRight: function (event) {
                links.Timeline.preventDefault(event);
                links.Timeline.stopPropagation(event);
                this.timeline.move(0.2);
                this.timeline.trigger("rangechange");
                this.timeline.trigger("rangechanged");
            },

            /**
             * Move the current position of the player
             * @alias module:views-timeline.TimelineView#moveToCurrentTime
             */
            moveToCurrentTime: function () {
                var currentChartRange = this.timeline.getVisibleChartRange(),
                    start             = this.getTimeInSeconds(currentChartRange.start),
                    end               = this.getTimeInSeconds(currentChartRange.end),
                    size              = end - start,
                    currentTime       = this.playerAdapter.getCurrentTime(),
                    videoDuration     = this.playerAdapter.getDuration(),
                    marge             = size / 20,
                    startInSecond;
                // popovers = $("div.popover.fade.right.in");


                if (annotationsTool.timelineFollowPlayhead) {
                    if ((currentTime - size / 2) < 0) {
                        start = this.getFormatedDate(0);
                        end = this.getFormatedDate(size);
                    } else if ((currentTime + size / 2) > videoDuration) {
                        start = this.getFormatedDate(videoDuration - size);
                        end = this.getFormatedDate(videoDuration);
                    } else {
                        start = this.getFormatedDate(currentTime - size / 2);
                        end = this.getFormatedDate(currentTime + size / 2);
                    }
                } else {
                    if (((currentTime + marge) >= end && end != videoDuration) || (currentTime > end || currentTime < start)) {
                        startInSecond = Math.max(currentTime - marge, 0);
                        start = this.getFormatedDate(startInSecond);
                        end = this.getFormatedDate(Math.min(startInSecond + size, videoDuration));
                    } else {
                        start = this.getFormatedDate(start);
                        end = this.getFormatedDate(end);
                    }
                }



                if (currentChartRange.start.getTime() != start.getTime() || currentChartRange.end.getTime() !== end.getTime()) {
                    this.timeline.setVisibleChartRange(start, end);
                }
            },

            /**
             * Zoom in
             * @alias module:views-timeline.TimelineView#zoomIn
             * @param  {Event} event Event object
             */
            zoomIn: function (event) {
                links.Timeline.preventDefault(event);
                links.Timeline.stopPropagation(event);
                this.timeline.zoom(0.4, this.timeline.getCustomTime());
                this.timeline.trigger("rangechange");
                this.timeline.trigger("rangechanged");
            },

            /**
             * Zoom out
             * @alias module:views-timeline.TimelineView#zoomOut
             * @param  {Event} event Event object
             */
            zoomOut: function (event) {
                links.Timeline.preventDefault(event);
                links.Timeline.stopPropagation(event);
                this.timeline.zoom(-0.4, this.timeline.getCustomTime());
                this.timeline.trigger("rangechange");
                this.timeline.trigger("rangechanged");
            },

            /**
             * Add a new item to the timeline
             * @param {string}  id           The id of the item
             * @param {object}  item         The object representing the item
             * @param {Boolean} isPartOfList Define if the object is part of a group insertion
             * @alias module:views-timeline.TimelineView#addItem
             */
            addItem: function (id, item, isPartOfList) {
                item.group = "<!-- extra -->" + item.group;
                this.extraItems[id] = item;
                if (!isPartOfList) {
                    this.redraw();
                }
            },

            /**
             * Remove the timeline item with the given id
             * @param  {string} id The id of the item to remove
             * @alias module:views-timeline.TimelineView#removeItem
             */
            removeItem: function (id, refresh) {
                delete this.extraItems[id];
                if (refresh) {
                    this.redraw();
                }
            },

            /**
             * Add an annotation to the timeline
             * @alias module:views-timeline.TimelineView#addAnnotation
             * @param {Annotation} annotation the annotation to add.
             * @param {Track} track  the track where the annotation must be added
             * @param {Boolean} [isList]  define if the insertion is part of a list, Default is false
             */
            addAnnotation: function (annotation, track, isList) {
                // Wait that the id has be set to the model before to add it
                if (_.isUndefined(annotation.get("id"))) {
                    annotation.once("ready", function () {
                        this.addAnnotation(annotation, track, isList);
                    }, this);
                    return;
                }

                if (annotation.get("oldId") && this.ignoreAdd === annotation.get("oldId")) {
                    delete this.ignoreAdd;
                    return;
                }

                // If annotation has not id, we save it to have an id
                if (!annotation.id) {
                    annotation.bind("ready", this.addAnnotation, this);
                    return;
                }

                this.annotationItems[annotation.id] = this.generateItem(annotation, track);

                if (!isList) {
                    this.preprocessTrack(track.id);
                    this.redraw();
                    this.onPlayerTimeUpdate();
                }

                annotation.bind("destroy", this.onAnnotationDestroyed, this);
            },

            /**
             * Add a track to the timeline
             * @alias module:views-timeline.TimelineView#addTrack
             * @param {Track} track The track to add to the timline
             */
            addTrack: function (track) {
                var annotations,
                    proxyToAddAnnotation = function (annotation) {
                        this.addAnnotation(annotation, track, false);
                    },
                    annotationWithList = function (annotation) {
                        this.addAnnotation(annotation, track, true);
                    };

                // If track has not id, we save it to have an id
                if (!track.id) {
                    track.bind("ready", this.addTrack, this);
                    return;
                }

                // Add void item
                this.trackItems[track.id] = this.generateVoidItem(track);

                annotations = track.get("annotations");
                annotations.each(annotationWithList, this);
                annotations.bind("add", proxyToAddAnnotation, this);
                annotations.bind("change", this.changeItem, this);

                this.preprocessTrack(track.id);
                this.redraw();
            },

            /**
             * Add a list of tracks, creating a view for each of them
             * @alias module:views-timeline.TimelineView#addTracksList
             * @param {Array | List} tracks The list of tracks to add
             */
            addTracksList: function (tracks) {
                this.trackItems = {};
                this.annotationItems = {};
                this.preprocessedItems = {};
                if (tracks.length === 0) {
                    //this.preprocessAllTracks();
                    this.redraw();
                } else {
                    _.each(tracks, this.addTrack, this);
                }
            },

            /**
             * Get a void timeline item for the given track
             * @alias module:views-timeline.TimelineView#generateVoidItem
             * @param {Track} track Given track owning the void item
             * @return {Object} the generated timeline item
             */
            generateVoidItem: function (track) {
                var trackJSON = track.toJSON();

                trackJSON.id = track.id;
                trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);

                return {
                    model: track,
                    trackId: track.id,
                    isMine: track.get("isMine"),
                    isPublic: track.get("isPublic"),
                    voidItem: true,
                    start: this.startDate - 5000,
                    end: this.startDate - 4500,
                    content: this.VOID_ITEM_TMPL,
                    groupContent: this.groupTemplate(trackJSON)
                };
            },

            /**
             * Get an timeline item from the given annotation
             * @alias module:views-timeline.TimelineView#generateItem
             * @param {Annotation} annotation The source annotation for the item
             * @param {Track} track Track where the annotation is saved
             * @return {Object} the generated timeline item
             */
            generateItem: function (annotation, track) {
                var videoDuration = this.playerAdapter.getDuration(),
                    annotationJSON,
                    trackJSON,
                    startTime,
                    endTime,
                    start,
                    end;

                annotationJSON = annotation.toJSON();
                annotationJSON.id = annotation.id;
                annotationJSON.track = track.id;
                annotationJSON.text = annotation.get("text");

                if (annotationJSON.label && annotationJSON.label.category && annotationJSON.label.category.settings) {
                    annotationJSON.category = annotationJSON.label.category;
                }

                // Prepare track informations
                trackJSON = track.toJSON();
                trackJSON.id = track.id;
                trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);

                // Calculate start/end time
                startTime = annotation.get("start");
                endTime = startTime + this.annotationItemDuration(annotation);
                start = this.getFormatedDate(startTime);
                end = this.getFormatedDate(endTime);

                // If annotation is at the end of the video, we mark it for styling
                annotationJSON.atEnd = (videoDuration - endTime) < 3;

                return {
                    model: track,
                    annotation: annotation,
                    id: annotation.id,
                    trackId: track.id,
                    isPublic: track.get("isPublic"),
                    isMine: track.get("isMine"),
                    editable: track.get("isMine"),
                    start: start,
                    end: end,
                    itemContent: this.itemTemplate(annotationJSON),
                    groupContent: this.groupTemplate(trackJSON)
                };
            },

            /**
             * Add a track to the timeline
             * @alias module:views-timeline.TimelineView#createTrack
             * @param {PlainObject} JSON object compose of a name and description properties. Example: {name: "New track", description: "A test track as example"}
             */
            createTrack: function (param) {
                var track;

                if (this.timeline.findGroup(param.name)) {
                    // If group already exist, we do nothing
                    return;
                }

                track = this.tracks.create(param, {
                    wait: true
                });
            },

            /**
             * Initialize the creation of a new track, load the modal window to add a new track.
             * @alias module:views-timeline.TimelineView#initTrackCreation
             */
            initTrackCreation: function () {
                var self = this,
                    access,
                    name,
                    description,
                    insertTrack = function () {
                        name = self.createGroupModal.find("#name")[0].value;
                        description = self.createGroupModal.find("#description")[0].value;

                        if (name === "") {
                            self.createGroupModal.find(".alert #content").html(i18next.t("timeline.name required"));
                            self.createGroupModal.find(".alert").show();
                            return;
                        } else if (name.search(/<\/?script>/i) >= 0 || description.search(/<\/?script>/i) >= 0) {
                            self.createGroupModal.find(".alert #content").html(i18next.t("timeline.scripts not allowed"));
                            self.createGroupModal.find(".alert").show();
                            return;
                        }

                        if (self.createGroupModal.find("#public").length > 0) {
                            access = self.createGroupModal.find("#public")[0].checked ? ACCESS.PUBLIC : ACCESS.PRIVATE;
                        } else {
                            access = ACCESS.PUBLIC;
                        }

                        self.createTrack({
                            name: name,
                            description: description,
                            access: access
                        }, this);

                        self.createGroupModal.modal("toggle");
                    };

                // If the modal is already loaded and displayed, we do nothing
                if ($("div#modal-add-group.modal.in").length > 0) {
                    return;
                } else if (!this.createGroupModal) {
                    // Otherwise we load the login modal if not loaded
                    $("body").append(this.modalAddGroupTemplate({
                        isSupervisor: annotationsTool.user.get("role") === ROLES.SUPERVISOR
                    }));
                    this.createGroupModal = $("#modal-add-group");
                    this.createGroupModal.modal({
                        show: true,
                        backdrop: false,
                        keyboard: true
                    });
                    this.createGroupModal.find("a#add-group").bind("click", insertTrack);
                    this.createGroupModal.bind("keypress", function (event) {
                        if (event.keyCode === 13) {
                            insertTrack();
                        }
                    });

                    this.createGroupModal.on("shown", $.proxy(function () {
                        this.createGroupModal.find("#name").focus();
                    }, this));

                    this.createGroupModal.find("#name").focus();
                } else {
                    // if the modal has already been initialized, we reset input and show modal
                    this.createGroupModal.find(".alert #content").html("").hide();
                    this.createGroupModal.find(".alert-error").hide();
                    this.createGroupModal.find("#name")[0].value = "";
                    this.createGroupModal.find("#description")[0].value = "";
                    this.createGroupModal.modal("toggle");
                }
            },

            /**
             * Initialize the update of the selected track, load the modal window to modify the track.
             * @alias module:views-timeline.TimelineView#initTrackUpdate
             * @param {Event} event Event object
             * @param {Integer} The track Id of the selected track
             */
            initTrackUpdate: function (event, id) {
                var self = this,
                    access,
                    name,
                    track = annotationsTool.getTrack(id),
                    description,
                    updateTrack = function () {
                        name = self.updateGroupModal.find("#name")[0].value;
                        description = self.updateGroupModal.find("#description")[0].value;

                        if (name === "") {
                            self.updateGroupModal.find(".alert #content").html(i18next.t("timeline.name required"));
                            self.updateGroupModal.find(".alert").show();
                            return;
                        } else if (name.search(/<\/?script>/i) >= 0 || description.search(/<\/?script>/i) >= 0) {
                            self.updateGroupModal.find(".alert #content").html(i18next.t("timeline.scripts not allowed"));
                            self.updateGroupModal.find(".alert").show();
                            return;
                        }

                        if (self.updateGroupModal.find("#public").length > 0) {
                            access = self.updateGroupModal.find("#public")[0].checked ? ACCESS.PUBLIC : ACCESS.PRIVATE;
                        } else {
                            access = ACCESS.PUBLIC;
                        }

                        track.set({
                            name: name,
                            description: description,
                            access: access
                        });

                        track.save();

                        self.updateGroupModal.modal("toggle");
                    };

                // If the modal is already loaded and displayed, we do nothing
                if ($("div#modal-update-group.modal.in").length > 0) {
                    return;
                } else if (!this.updateGroupModal) {
                    // Otherwise we load the login modal if not loaded
                    $("body").append(this.modalUpdateGroupTemplate(track.toJSON()));
                    this.updateGroupModal = $("#modal-update-group");
                    this.updateGroupModal.modal({
                        show: true,
                        backdrop: false,
                        keyboard: true
                    });
                    this.updateGroupModal.find("a#update-group").bind("click", updateTrack);
                    this.updateGroupModal.bind("keypress", function (event) {
                        if (event.keyCode === 13) {
                            updateTrack();
                        }
                    });

                    this.updateGroupModal.on("shown", $.proxy(function () {
                        this.updateGroupModal.find("#name").focus();
                    }, this));

                    this.updateGroupModal.find("#name").focus();
                } else {
                    // if the modal has already been initialized, we reset input and show modal
                    this.updateGroupModal.find(".alert #content").html("");
                    this.updateGroupModal.find(".alert-error").hide();
                    this.updateGroupModal.find("#name")[0].value = track.get("name");
                    this.updateGroupModal.find("#description")[0].value = track.get("description");
                    this.updateGroupModal.find("a#update-group").unbind("click").bind("click", updateTrack);
                    this.updateGroupModal.find("#public")[0].checked = (track.get("access") === ACCESS.PUBLIC);
                    this.updateGroupModal.unbind("keypress").bind("keypress", function (event) {
                        if (event.keyCode === 13) {
                            updateTrack();
                        }
                    });
                    this.updateGroupModal.modal("toggle");
                }
            },

            /**
             * Expand a track, i.e. show all annotations in it, without any clustering or aggregation.
             * This might also make the track higher.
             * @alias module:views-timeline.TimelineView#expandTrack
             * @param {Event} event The event that causes the expansion. Usually clicking on a placeholder item
             * @see preprocessTrack
             */
            expandTrack: function (event) {
                $(event.target).popover("hide");
                var track = $(event.target).data("track");
                this.trackExpanded[track] = true;
                this.preprocessTrack(track);
                this.redraw();
            },

            /**
             * Toggle a tracks expanstion status.
             * @alias module:views-timeline.TimelineView#toggleTrack
             * @param {Event} event The event triggering the toggle
             * @see expandTrack
             */
            toggleTrackExpansion: function (event) {
                var track = $(event.target).closest(".timeline-group").data("id");
                this.trackExpanded[track] = !this.trackExpanded[track];
                this.preprocessTrack(track);
                this.redraw();
            },

            /**
             * Do some preprocessing on the timeline items in a given track.
             * This groups items together, when there are more than the track can display
             * and also ensures that only the longest item of any label is displayed
             * at any given time in this situation.
             * @alias module:views-timeline.TimelineView#preprocessTrack
             * @param trackId The id of the track to preprocess
             */
            preprocessTrack: function (trackId) {
                delete this.preprocessedItems[trackId];

                var items = _.filter(this.annotationItems, function (item) {
                    var category = item.annotation.category();
                    return item.trackId === trackId && (!category || category.get("visible"));
                });

                // The height of the track in stack levels. We need (and potentially calculate) that later.
                // For now, tracks are at least 3 stacking levels high.
                var height = 3;
                // A mapping from annotation id to stacking level. We will will this later
                // and then use it to place the items on the proper height within their track.
                var stackLevels = {};

                // When there are no items in this track,
                // there is nothing to do, so return early,
                // so that we can assume `items` is not empty in the following code.
                if (!items.length) {
                    this.preprocessedItems[trackId] = [];
                } else {

                    // We sort the items by their start time.
                    // This will come in handy multiple times in the following algorithms
                    // and also ensures a deterministic outcome.
                    items = _.sortBy(items, "start");

                    if (!this.trackExpanded[trackId]) {
                        // First we will need to determine which items to display for any label that we have.
                        // The selected items for each label will be the subset of items with that label
                        // with the most coverage of the timeline.
                        // To find this subset, we will use a dynamic programming approach.
                        var labelSelection = _.chain(items)
                            .filter(function (item) { return item.annotation.get("label"); })
                            .groupBy(function (item) { return item.annotation.get("label").id; })
                            .reduce(function (labelSelection, items) {
                                // The dynamic program will output `items.len` possible solutions,
                                // namely the disjoint subsets of annotations that have the greatest coverage
                                // and whose last annotation is the i-th when sorted by their end time.
                                items = _.sortBy(items, "end");
                                var selectedAnnotations = _.chain(items)
                                    .reduce(function (potentialSolutions, item, i) {
                                        // In each step we want to find the best solution ending in item i.
                                        // These are collected in `potentialSolutions`

                                        // We clearly get the next one
                                        // by combining one of the previous best solutions
                                        // with the i-th item.
                                        // Because of the disjunctiveness condition, though,
                                        // not all previous solutions are viable.
                                        var viablePreviousSolutions = _.filter(potentialSolutions, function (_, j) {
                                            // Only those which do not overlap the current item can be considered.
                                            return items[j].end < items[i].start;
                                        });
                                        var bestPreviousSolution = viablePreviousSolutions.length
                                            ? _.max(viablePreviousSolutions, "value")
                                            : {
                                                value: 0,
                                                items: []
                                            };
                                        potentialSolutions.push({
                                            value: item.end - item.start + bestPreviousSolution.value,
                                            items: bestPreviousSolution.items.concat(item)
                                        });
                                        return potentialSolutions;
                                    }, [])
                                    // The best of these partial solutions constitutes our final selection
                                    .max("value")
                                    .value()
                                    .items;

                                _.each(selectedAnnotations, function (item) {
                                    labelSelection[item.id] = true;
                                });

                                return labelSelection;
                            }, {})
                            .value();
                    }

                    // Now we determining the stacking level for each item,
                    // while also noting which items are together in a stack,
                    // i.e. a connected component of a graph where the nodes are the items
                    // and an edge exists if the items overlap in time.

                    // The latter functionality will be needed again later,
                    // so we write a function for this.
                    function stackItems(items) {
                        if (!items.length) return [];

                        var firstItem = items.splice(0, 1)[0];
                        var currentStack = {
                            items: [firstItem],
                            start: firstItem.start,
                            end: firstItem.end
                        };
                        var stacks = [currentStack];

                        _.each(items, function (item) {
                            // If this item does not belong to the current stack anymore,
                            // we need to start a new one.
                            if (item.start > currentStack.end) {
                                currentStack = {
                                    items: [item],
                                    start: item.start,
                                    end: item.end
                                };
                                stacks.push(currentStack);
                                return;
                            }

                            // Otherwise add the item to the current stack
                            currentStack.end = Math.max(currentStack.end, item.end);
                            currentStack.items.push(item);
                        });
                        return stacks;
                    }
                    var stacks = stackItems(items);

                    // Now within each stack, we assign items to different levels.
                    // We also determine the necessary height of the track on the way, when it is expanded.
                    _.each(stacks, function (stack) {
                        _.each(stack.items, function (item, i) {
                            var items = stack.items;

                            // We don't need to place labeled items that have not been selected by the first step
                            // but if we find an item like that, we need to show a placeholder.
                            var label = item.annotation.get("label");
                            if (!this.trackExpanded[trackId] && label && !labelSelection[item.id]) {
                                stack.hasHiddenItems = true;
                                return;
                            };

                            // Find the stack level of the stack where this item fits in.
                            // We just collect all the levels that are already occupied at this time ...
                            var usedLevels = [];
                            var level;
                            for (var j = 0; j < i; ++j) {
                                level = stackLevels[items[j].id];
                                if ((level || level === 0) && util.overlaps(item, items[j])) {
                                    usedLevels[level] = true;
                                }
                            }
                            // ... and then look for the first free one.
                            for (level = 0; level < usedLevels.length && usedLevels[level]; ++level);

                            if (level > 2) stack.hasHiddenItems = true;
                            stackLevels[item.id] = level;
                            if (this.trackExpanded[trackId] && level >= height) height = level + 1;
                            item.className = this.PREFIX_STACKING_CLASS + level;
                        }, this);
                    }, this);

                    // Now we just cut each stack to contain only three levels if it is not expanded
                    this.preprocessedItems[trackId] = _.chain(stacks)
                        .map(function (stack) {
                            // If the track is expanded, we need to give each item a class representing the stack height,
                            // so that the CSS can adjust the top margin.
                            if (this.trackExpanded[trackId]) {
                                _.each(stack.items, function (item) {
                                    item.className += " height-" + height;
                                });
                                return stack.items;
                            }
                            if (!stack.hasHiddenItems) return stack.items;
                            // If the stack is three levels or less, everything is fine
                            // and we can just display all items in the stack.
                            if (this.trackExpanded[trackId] || !stack.hasHiddenItems) return stack.items;

                            // Otherwise we aggregate the spilled items into one or more placeholders
                            var items = _.partition(stack.items, function (item) {
                                return stackLevels[item.id] < 2;
                            });
                            var spilled = items[1];
                            var placeholders = _.map(stackItems(spilled), function (spilledStack) {
                                var trackId = spilledStack.items[0].trackId;
                                return {
                                    isPlaceholder: true,
                                    start: spilledStack.start,
                                    end: spilledStack.end,
                                    groupContent: spilledStack.items[0].groupContent,
                                    trackId: trackId,
                                    itemContent: PlaceholderTmpl({
                                        track: trackId,
                                        hiddenItems: spilledStack.items
                                    }),
                                    className: this.PREFIX_STACKING_CLASS + 2,
                                    editable: false
                                };
                            }, this);
                            return items[0].concat(placeholders);
                        }, this)
                        .flatten()
                        .value();
                }

                _.each(this.preprocessedItems[trackId].concat(this.trackItems[trackId]), function (item) {
                    // We need to change the group of each item to add some indicator of the height of the track
                    // We also need to, **in front of that**, add some indicator for the track,
                    // as to preserve the ordering.
                    item.group = "<div style=\"height: " + height * 23 + "px;\">" + item.groupContent + "</div>";
                    item.group = "<!-- track: " + annotationsTool.tracksOrder.indexOf(trackId) + " -->" + item.group;

                    // We also need to set the margin of all the items to shift them to their stacking level
                    function wrap(item, level) {
                        return "<div style=\"margin-top: " +
                            (-51 + (height - level) * 23) +
                            "px;\">" +
                            item +
                            "</div>";
                    }
                    if (item.isPlaceholder) {
                        item.content = wrap(item.itemContent, 2);
                    } else if (item.id) {
                        item.content = wrap(item.itemContent, stackLevels[item.id]);
                    }
                });
            },

            /**
             * Do preprocessing on all tracks.
             * @alias module:views-timeline.TimelineView#preprocessAllTracks
             */
            preprocessAllTracks: function () {
                _.each(this.trackItems, function (_, trackId) {
                    this.preprocessTrack(trackId);
                }, this);
            },

            /**
             * Check the position for the changed item
             * @alias module:views-timeline.TimelineView#changeItem
             * @param {Annotation} the annotation that has been changed
             */
            changeItem: function (annotation) {
                var value = this.getTimelineItemFromAnnotation(annotation);

                if (!_.isUndefined(value)) {
                    // Only update annotation view if the item has already been created
                    this.annotationItems[annotation.id] = this.generateItem(annotation, value.model);
                    this.preprocessTrack(value.trackId);
                    this.redraw();
                }
            },

            /**
             * Listener for the player timeupdate
             * @alias module:views-timeline.TimelineView#onPlayerTimeUpdate
             */
            onPlayerTimeUpdate: function () {
                var currentTime = this.playerAdapter.getCurrentTime(),
                    newDate = this.getFormatedDate(currentTime);

                this.timeline.setCustomTime(newDate);

                this.$el.find("span.time").html(annotationsTool.getWellFormatedTime(currentTime, true));

                this.moveToCurrentTime();
            },

            /**
             * Listener for the selection update event
             * @alias module:views-timeline.TimelineView#onSelectionUpdate
             * @param  {Array} selection The new array of selected item(s)
             */
            onSelectionUpdate: function (selection) {
                var data = this.filteredItems;

                // If no selection, we unselected elements currently selected and return
                if (selection.length === 0) {
                    this.timeline.unselectItem();
                    return;
                }

                // We look for the first item in the selection, that is actually currently visible
                var indexToSelect;
                var alreadySelected;
                _.find(selection, function (annotation) {
                    if (this.isAnnotationSelectedonTimeline(annotation)) {
                        alreadySelected = true;
                        return true;
                    }
                    indexToSelect = _.findIndex(data, function (item) {
                        return item.id === annotation.id;
                    });
                    return indexToSelect >= 0;
                }, this);
                if (alreadySelected) return;
                if (indexToSelect >= 0) this.timeline.selectItem(indexToSelect, false, true);
            },

            /**
             * Listener for the timeline timeupdate
             * @alias module:views-timeline.TimelineView#onTimelineMoved
             * @param {Event} event Event object
             */
            onTimelineMoved: function (event) {
                var newTime = this.getTimeInSeconds(event.time),
                    hasToPlay = (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING);


                if (hasToPlay) {
                    this.playerAdapter.pause();
                }

                this.playerAdapter.setCurrentTime((newTime < 0 || newTime > this.playerAdapter.getDuration()) ? 0 : newTime);

                if (hasToPlay) {
                    this.playerAdapter.play();
                }
            },

            /**
             * Listener for item modification
             * @alias module:views-timeline.TimelineView#onTimelineItemChanged
             */
            onTimelineItemChanged: function () {
                var hasToPlay = (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING),
                    values = this.getSelectedItemAndAnnotation(),
                    oldItemId,
                    duration,
                    end,
                    start,
                    annJSON,
                    successCallback,
                    destroyCallback,
                    self = this;

                // Pause the player if needed
                this.playerAdapter.pause();

                // Return if no values related to to item
                if (!values || !values.annotation) {
                    console.warn("Can not get infos from updated item!");
                    this.timeline.cancelChange();
                    return;
                }

                start = this.getTimeInSeconds(values.item.start);
                end = this.getTimeInSeconds(values.item.end);
                duration = end - start;

                // If the annotation is not owned by the current user or the annotation is moved outside the timeline,
                // the update is canceled
                if (!values.newTrack.get("isMine") || !values.annotation.get("isMine") ||
                    end > this.playerAdapter.getDuration() ||
                    start > this.playerAdapter.getDuration()) {
                    this.timeline.cancelChange();

                    this.annotationItems[values.annotation.id] = {
                        annotation: values.annotation,
                        start: values.item.start,
                        end: values.item.end,
                        itemContent: values.item.content,
                        groupContent: this.groupTemplate(values.oldTrack.toJSON()),
                        id: values.annotation.id,
                        trackId: values.oldTrack.id,
                        model: values.oldTrack,
                        className: values.item.className
                    };

                    this.preprocessTrack(values.oldTrack.id);
                    this.preprocessTrack(values.newTrack.id);
                    this.redraw();

                    if (hasToPlay) {
                        this.playerAdapter.play();
                    }
                    return;
                }

                // If the annotations has been moved on another track
                if (values.newTrack.id !== values.oldTrack.id) {
                    this.ignoreAdd = values.annotation.get("id");
                    this.ignoreDelete = this.ignoreAdd;

                    annJSON = values.annotation.toJSON();
                    oldItemId = annJSON.id;
                    annJSON.oldId = this.ignoreAdd;
                    annJSON.start = start;
                    annJSON.duration = duration;

                    delete annJSON.id;
                    delete annJSON.created_at;

                    destroyCallback = function () {
                        if (annotationsTool.localStorage) {
                            successCallback(values.newTrack.get("annotations").create(annJSON));
                        } else {
                            values.newTrack.get("annotations").create(annJSON, {
                                wait: true,
                                success: successCallback
                            });
                        }
                    },
                    successCallback = function (newAnnotation) {
                        newAnnotation.unset("oldId", {
                            silent: true
                        });
                        newAnnotation.save();

                        annJSON.id = newAnnotation.get("id");
                        annJSON.track = values.newTrack.id;

                        if (annJSON.label && annJSON.label.category && annJSON.label.category.settings) {
                            annJSON.category = annJSON.label.category;
                        }

                        self.annotationItems[annJSON.id] = {
                            annotation: values.annotation,
                            start: values.item.start,
                            end: values.item.end,
                            groupContent: values.item.groupContent,
                            itemContent: self.itemTemplate(annJSON),
                            id: annJSON.id,
                            trackId: values.newTrack.id,
                            isPublic: values.newTrack.get("isPublic"),
                            isMine: values.newTrack.get("isMine"),
                            model: values.newTrack
                        };

                        delete self.annotationItems[annJSON.oldId];

                        annotationsTool.setSelection([newAnnotation], true, true, true);

                        newAnnotation.set({
                            access: values.newTrack.get("access")
                        });

                        this.preprocessTrack(values.oldTrack.id);
                        this.preprocessTrack(values.newTrack.id);
                        self.redraw();

                        if (hasToPlay) {
                            self.playerAdapter.play();
                        }
                    };

                    values.annotation.destroy({
                        success: destroyCallback
                    });

                } else {
                    this.annotationItems[values.annotation.id] = values.item;
                    values.annotation.set({
                        start: start,
                        duration: duration
                    });
                    values.annotation.save();

                    annotationsTool.playerAdapter.setCurrentTime(values.annotation.get("start"));
                    this.preprocessTrack(values.item.trackId);
                    this.redraw();


                    if (hasToPlay) {
                        this.playerAdapter.play();
                    }
                }
            },

            /**
             * Listener for timeline item deletion
             * @alias module:views-timeline.TimelineView#onTimelineItemDeleted
             */
            onTimelineItemDeleted: function () {
                var annotation = this.getSelectedItemAndAnnotation().annotation;
                this.timeline.cancelDelete();
                annotationsTool.deleteOperation.start(annotation, this.typeForDeleteAnnotation);
            },

            /**
             * Listener for item insertion on timeline
             * @alias module:views-timeline.TimelineView#onTimelineItemAdded
             */
            onTimelineItemAdded: function () {
                // No possiblity to add annotation directly from the timeline
                this.timeline.cancelAdd();
            },

            /**
             * Listener for annotation suppression
             * @alias module:views-timeline.TimelineView#onAnnotationDestroyed
             */
            onAnnotationDestroyed: function (annotation) {
                if (this.ignoreDelete === annotation.get("id")) {
                    delete this.ignoreDelete;
                    return;
                }

                // This function can be called multiple times per deletion so we might not have to do anything
                var annotationItem = this.annotationItems[annotation.id];
                if (!annotationItem) return;

                var track = annotationItem.trackId;
                delete this.annotationItems[annotation.id];
                this.preprocessTrack(track);
                this.redraw();
            },

            /**
             * Reset the timeline zoom to see the whole timeline
             * @alias module:views-timeline.TimelineView#onTimelineResetZoom
             */
            onTimelineResetZoom: function () {
                this.timeline.setVisibleChartRange(this.startDate, this.endDate);
            },

            /**
             * Listener for track deletion
             * @alias module:views-timeline.TimelineView#onDeleteTrack
             * @param {Event} event the action event
             * @param {Integer} trackId Id of the track to delete
             */
            onDeleteTrack: function (event, trackId) {
                event.stopImmediatePropagation();

                var track = this.tracks.get(trackId),
                    self = this,
                    values,
                    newTrackId,
                    callback;

                // If track already deleted
                if (!track) {
                    return;
                }

                // Destroy the track and redraw the timeline
                callback = $.proxy(function () {
                    // delete track popover
                    $("#track" + trackId).popover("disable");

                    _.each(this.annotationItems, function (item) {
                        if (item.trackId === track.id) {
                            delete this.annotationItems[item.id];
                        }
                    }, this);

                    self.tracks.remove(track);

                    // If the track was selected
                    if (!annotationsTool.selectedTrack || annotationsTool.selectedTrack.id === track.id) {
                        if (self.tracks.length > 0) { // If there is still other tracks
                            self.tracks.each(function (t) {
                                if (t.get("isMine")) {
                                    newTrackId = t.id;
                                }
                            });
                            self.onTrackSelected(null, newTrackId);
                        }
                    } else {
                        self.onTrackSelected(null, annotationsTool.selectedTrack.id);
                    }

                    delete this.trackItems[track.id];

                    this.redraw();
                }, this);

                annotationsTool.deleteOperation.start(track, this.typeForDeleteTrack, callback);
            },

            /**
             * Update all the items placed on the given track
             * @alias module:views-timeline.TimelineView#changeTrack
             * @param  {Track} track The freshly updated track
             * @param  {PlainObject} [options] Options like silent: true to avoid a redraw (optionnal)
             */
            changeTrack: function (track, options) {
                // If the track is not visible, we do nothing
                if (!track.get(Track.FIELDS.VISIBLE)) {
                    return;
                }

                var newGroup,
                    trackJSON = track.toJSON(),
                    redrawRequired = false;

                trackJSON.isSupervisor = (annotationsTool.user.get("role") === ROLES.SUPERVISOR);
                newGroup = this.groupTemplate(trackJSON);

                _.each(_.values(this.annotationItems).concat(_.values(this.trackItems)), function (item) {
                    if (item.trackId === track.get("id") && item.groupContent !== newGroup) {
                        item.groupContent = newGroup;
                        item.isPublic = track.get("isPublic");
                        redrawRequired = true;
                    }
                }, this);

                if (!(options && options.silent) && redrawRequired) {
                    this.preprocessTrack(track.id);
                    this.redraw();
                }
            },

            /**
             * Update the track with the given id
             * @alias module:views-timeline.TimelineView#onUpdateTrack
             * @param {Event} event the action event
             * @param {Integer} trackId Id of the track to delete
             */
            onUpdateTrack: function (event, trackId) {
                event.stopImmediatePropagation();

                $("#track" + trackId).popover("hide");

                var track = this.tracks.get(trackId),
                    trackCurrentVisibility,
                    newTrackVisibility;

                if (!track) {
                    console.warn("Track " + trackId + " does not exist!");
                    return;
                }

                trackCurrentVisibility = track.get("access");

                if (trackCurrentVisibility === ACCESS.PRIVATE) {
                    newTrackVisibility = ACCESS.PUBLIC;
                } else {
                    newTrackVisibility = ACCESS.PRIVATE;
                }

                track.setAccess(newTrackVisibility);
                track.save();
            },

            /**
             * Listener for track selection
             * @alias module:views-timeline.TimelineView#onTrackSelected
             * @param {Event} event Event object
             * @param {Integer} The track Id of the selected track
             */
            onTrackSelected: function (event, trackId) {
                var track;

                if (_.isString(trackId) && !annotationsTool.localStorage) {
                    track = annotationsTool.video.getTrack(parseInt(trackId, 10));
                } else {
                    track = annotationsTool.video.getTrack(trackId);
                }

                // If the track does not exist, and it has been thrown by an event
                if ((!track && event) || (!track && trackId)) {
                    return;
                }

                annotationsTool.selectTrack(track);

                this.$el.find("div.selected").removeClass("selected");
                this.$el.find(".timeline-group[data-id='" + trackId + "']")
                    .closest(".timeline-groups-text").addClass("selected");
            },

            /**
             * Listener for window resizing
             * @alias module:views-timeline.TimelineView#onWindowsResize
             */
            onWindowResize: function () {
                this.preprocessAllTracks();
                this.redraw();
                if (annotationsTool.selectedTrack) {
                    this.onTrackSelected(null, annotationsTool.selectedTrack.id);
                }
            },

            /* --------------------------------------
              Utils functions
            ----------------------------------------*/

            /**
             * Get the formated date for the timeline with the given seconds.
             * The timeline displays dates/times in local time,
             * which is why we bias the time towards UTC.
             * @alias module:views-timeline.TimelineView#getFormatedDate
             * @param {Double} seconds The time in seconds to convert to Date
             * @returns {Date} Formated date for the timeline
             */
            getFormatedDate: function (seconds) {
                var newDate = new Date(seconds * 1000);
                newDate.setTime(newDate.getTime() + newDate.getTimezoneOffset() * 60 * 1000);
                return newDate;
            },

            /**
             * Transform the given date into a time in seconds
             * @alias module:views-timeline.TimelineView#getTimeInSeconds
             * @param {Date} date The formated date from timeline
             * @returns {Number} Date converted to time in seconds
             */
            getTimeInSeconds: function (date) {
                return date.getTime() / 1000 - date.getTimezoneOffset() * 60;
            },

            /**
             * Get the current selected annotion as object containing the timeline item and the annotation
             * @alias module:views-timeline.TimelineView#getSelectedItemAndAnnotation
             * @returns {Object} Object containing the annotation and the timeline item. "{item: "timeline-item", annotation: "annotation-object"}"
             */
            getSelectedItemAndAnnotation: function () {
                //var itemId = $("." + this.ITEM_SELECTED_CLASS + " .annotation-id").text(),
                var annotation = annotationsTool.getSelection()[0],
                    //selection = this.timeline.getSelection(),
                    item,
                    itemId,
                    newTrackId,
                    oldTrackId,
                    oldTrack,
                    newTrack;

                if (_.isUndefined(annotation) || _.isUndefined(this.annotationItems[annotation.get("id")])) {
                    return undefined;
                }

                itemId = annotation.get("id");

                item = this.annotationItems[itemId];
                newTrackId = item.trackId;
                oldTrackId = $(item.itemContent)[0].dataset.trackid;
                oldTrack = annotationsTool.getTrack(oldTrackId);
                newTrack = annotationsTool.getTrack(newTrackId);
                annotation = annotationsTool.getAnnotation(itemId, oldTrack);

                return {
                    annotation: annotation,
                    item: item,
                    annotationId: itemId,
                    trackId: newTrackId,
                    newTrack: newTrack,
                    oldTrack: oldTrack
                };
            },

            /**
             * Check if the given annotation is currently selected on the timeline
             * @alias module:views-timeline.TimelineView#isAnnotationSelectedonTimeline
             * @param  {Annotation}  annotation The annotation to check
             * @return {Boolean}            If the annotation is selected or not
             */
            isAnnotationSelectedonTimeline: function (annotation) {
                return this.$el.find("div." + this.ITEM_SELECTED_CLASS + " div.timeline-item div.annotation-id:contains(\"" + annotation.get("id") + "\")").length !== 0;
            },

            /**
             * Update the position of the controls to resize the item following the stacking level
             * @alias module:views-timeline.TimelineView#updateDraggingCtrl
             */
            updateDraggingCtrl: function () {
                var selectedElement = this.$el.find("." + this.ITEM_SELECTED_CLASS),
                    cssProperties,
                    item = this.getSelectedItemAndAnnotation();

                if (_.isUndefined(item)) {
                    // No current selection
                    return;
                }

                selectedElement = this.$el.find("." + this.ITEM_SELECTED_CLASS);
                cssProperties = {
                    "margin-top": parseInt(selectedElement.css("margin-top"), 10) + parseInt(selectedElement.find(".timeline-item").css("margin-top"), 10) + "px",
                    "height": selectedElement.find(".timeline-item").outerHeight() + "px"
                };

                this.$el.find(".timeline-event-range-drag-left").css(cssProperties);

                if (item && item.annotation && item.annotation.get("duration") < 1) {
                    cssProperties["margin-left"] = selectedElement.find(".timeline-item").outerWidth() + "px";
                } else {
                    cssProperties["margin-left"] = "0px";
                }

                this.$el.find(".timeline-event-range-drag-right").css(cssProperties);
            },

            /**
             * Get the item related to the given annotation
             * @alias module:views-timeline.TimelineView#getTimelineItemFromAnnotation
             * @param {Annotation} the annotation
             * @returns {Object} an item object extend by an index parameter
             */
            getTimelineItemFromAnnotation: function (annotation) {
                return this.annotationItems[annotation.id];
            },

            /**
            * Return the duration of an annotation for rendering in the timeline.
            * If the duration is not defined or less than a certain threshold,
            * a minimal duration will be returned so that the annotation is still visible in the timeline.
            * @alias module:views-timeline.TimelineView#annotationItemDuration
            * @param {Annotation} annotation The annotation to get the duration of.
            * @returns {Number} The duration of the annotation in the timeline.
            */
            annotationItemDuration: function (annotation) {
                var duration = annotation.get("duration");
                return duration && duration > this.DEFAULT_DURATION ? duration : this.DEFAULT_DURATION;
            },

            /**
             * Get track with the given track id. Fallback method include if issues with the standard one.
             * @alias module:views-timeline.TimelineView#getTrack
             * @param {int} trackId The id from the targeted track
             * @return {Track} a track if existing, or undefined.
             */
            getTrack: function (trackId) {
                var rTrack = this.tracks.get(trackId);

                if (!rTrack) {
                    // Fallback method
                    this.tracks.each(function (track) {
                        if (track.id === trackId) {
                            rTrack = track;
                        }
                    }, this);
                }
                return rTrack;
            },

            /**
             * Reset the view
             * @alias module:views-timeline.TimelineView#reset
             */
            reset: function () {
                var annotations;

                this.$el.hide();

                // Remove all event listener
                $(this.playerAdapter).unbind("pa_timeupdate", this.onPlayerTimeUpdate);
                links.events.removeListener(this.timeline, "timechanged", this.onTimelineMoved);
                links.events.removeListener(this.timeline, "change", this.onTimelineItemChanged);
                links.events.removeListener(this.timeline, "delete", this.onTimelineItemDeleted);
                annotationsTool.removeTimeupdateListener(this.onPlayerTimeUpdate, 1);
                $(window).unbind("resize", this.onWindowResize);

                this.undelegateEvents();

                if (this.createGroupModal) {
                    this.createGroupModal.remove();
                }

                if (this.updateGroupModal) {
                    this.updateGroupModal.remove();
                }

                this.tracks.each(function (track) {
                    annotations = track.get("annotations");
                    annotations.unbind("add");
                }, this);

                // Remove all elements
                this.annotationItems = {};
                this.trackItems = {};
                this.extraItems = {};
                this.preprocessedItems = {};
                this.$el.find("#timeline").empty();
                //this.timeline.deleteAllItems();
                this.timeline = null;
                delete this.timeline;
                this.filteredItems = [];
            }
        });
        return Timeline;
    }
);