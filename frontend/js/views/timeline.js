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
 * @requires jquery
 * @requires underscore
 * @requires i18next
 * @requires player-adapter
 * @requires models-annotation
 * @requires collections-annotations
 * @requires templates/timeline-group.tmpl
 * @requires templates/timeline-item.tmpl
 * @requires templates/timeline-modal-group.tmpl
 * @requires ACCESS
 * @requires ROLES
 * @requires filters-manager
 * @requires backbone
 * @requires handlebars
 * @requires timeline
 * @requires bootstrap.tooltip
 * @requires bootstrap.popover
 */
define(["jquery",
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
        "templates/timeline-modal-add-group",
        "templates/timeline-modal-update-group",
        "access",
        "roles",
        "FiltersManager",
        "backbone",
        "timeline",
        "tooltip",
        "popover",
        "jquery.appear",
        "handlebarsHelpers"
    ],

       function ($, _, i18next, PlayerAdapter, Annotation, Track, Annotations, Tracks, GroupTmpl, GroupEmptyTmpl,
            ItemTmpl, ModalAddGroupTmpl, ModalUpdateGroupTmpl, ACCESS, ROLES, FiltersManager, Backbone, links) {

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
                "click #add-track"   : "initTrackCreation",
                "click #reset-zoom"  : "onTimelineResetZoom",
                "click #zoom-in"     : "zoomIn",
                "click #zoom-out"    : "zoomOut",
                "click #move-right"  : "moveRight",
                "click #move-left"   : "moveLeft",
                "click #filter-none" : "disableFilter",
                "click .filter"      : "switchFilter"
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
             * @alias module:views-timeline.TimelineView#allItems
             * @type {map}
             */
            allItems: {},

            /**
             * Array containing only the items who passed the filters
             * @alias module:views-timeline.TimelineView#filteredItems
             * @type {array}
             */
            filteredItems: [],

            /**
             * Map from annotation id to stacking level
             * @alias module:views-timeline.TimelineView#stackingLevel
             * @type {object}
             */
            stackingLevel: {},

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
                    "getStackLevel",
                    "getTrack",
                    "onWindowResize",
                    "onTimelineResetZoom",
                    "initTrackCreation",
                    "initTrackUpdate",
                    "filterItems",
                    "switchFilter",
                    "updateFiltersRender",
                    "disableFilter",
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

                this.filtersManager = new FiltersManager(annotationsTool.filtersManager);
                this.filtersManager.filters.timerange.end = attr.playerAdapter.getDuration();
                this.filtersManager.filters.timerange.active = true;
                this.filtersManager.filters.visibleTracks = {
                    active: true,
                    tracks: {},
                    condition: function (item) {
                        if (_.isUndefined(item.model) || !_.isUndefined(item.voidItem)) {
                            return true;
                        }

                        return this.tracks[item.model.get("id")];
                    },
                    filter: function (list) {
                        return _.filter(list, function (item) {
                            return this.condition(item);
                        }, this);
                    }
                };

                this.listenTo(this.filtersManager, "switch", this.updateFiltersRender);

                // Type use for delete operation
                this.typeForDeleteAnnotation = annotationsTool.deleteOperation.targetTypes.ANNOTATION;
                this.typeForDeleteTrack = annotationsTool.deleteOperation.targetTypes.TRACK;

                this.endDate = this.getFormatedDate(this.playerAdapter.getDuration());
                this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate(), 0, 0, 0);

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
                this.timeline.draw(this.filteredItems, this.options);

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
                    this.filterItems();
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
                var visibleTracksFilter = this.filtersManager.filters.visibleTracks,
                    tracks,
                    $tracks,
                    timelineHeight,
                    self = this;

                this.timeline.draw(this.filteredItems, this.option);

                // If no tracks have been added to the tracks filters (if enable), we search which one are visisble
                if (!_.isUndefined(visibleTracksFilter) && visibleTracksFilter.active && _.size(visibleTracksFilter.tracks) === 0) {
                    tracks = visibleTracksFilter.tracks;

                    timelineHeight = this.$timeline.height();

                    _.each(annotationsTool.getTracks().slice(0, (timelineHeight / 60).toFixed()), function (track) {
                        tracks[track.get("id")] = true;
                    }, this);

                    self.filteredItems = self.filterItems();
                    self.redraw();
                } else {
                    if (annotationsTool.hasSelection()) {
                        this.onSelectionUpdate(annotationsTool.getSelection());
                        this.updateDraggingCtrl();
                    }

                    if (annotationsTool.selectedTrack) {
                        this.onTrackSelected(null, annotationsTool.selectedTrack.id);
                    }

                    // Remove the popover div from old track elements
                    $("div.popover.fade.right.in").remove();

                    // If the visisble tracks filter is enable, we check where tracks are visible
                    if (!_.isUndefined(visibleTracksFilter) && visibleTracksFilter.active) {
                        tracks = visibleTracksFilter.tracks;

                        $tracks = this.$timeline.find(".timeline-groups-text").appear({
                            context: this.$timeline
                        });

                        $tracks.on("appear", _.debounce(function () {
                            var id = this.dataset.trackid;
                            if (!tracks[id]) {
                                tracks[id] = true;
                                self.filteredItems = self.filterItems();
                                self.redraw();
                            }
                        }, 200));

                        $tracks.on("disappear", _.debounce(function () {
                            var id = this.dataset.trackid;
                            if (tracks[id]) {
                                tracks[id] = false;
                                self.filteredItems = self.filterItems();
                                self.redraw();
                            }
                        }, 200));
                    }
                }
            },

            /**
             * Update the timerange filter with the timerange
             * @alias module:views-timeline.TimelineView#timerangeChange
             */
            timerangeChange: function () {
                var timerange = this.timeline.getVisibleChartRange();

                this.filtersManager.filters.timerange.start = new Date(timerange.start).getTime();
                this.filtersManager.filters.timerange.end = new Date(timerange.end).getTime();

                this.filteredItems = this.filterItems();
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
                this.allItems[id] = item;
                if (!isPartOfList) {
                    this.filterItems();
                    this.redraw();
                }
            },

            /**
             * Remove the timeline item with the given id
             * @param  {string} id The id of the item to remove
             * @alias module:views-timeline.TimelineView#removeItem
             */
            removeItem: function (id, refresh) {
                delete this.allItems[id];
                if (refresh) {
                    this.filterItems();
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

                this.allItems[annotation.id] = this.generateItem(annotation, track);

                if (!isList) {
                    this.filterItems();
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
                this.allItems["track_" + track.id] = this.generateVoidItem(track);

                annotations = track.get("annotations");
                annotations.each(annotationWithList, this);
                annotations.bind("add", proxyToAddAnnotation, this);
                annotations.bind("change", this.changeItem, this);

                if (!_.isUndefined(this.filtersManager.filters.visibleTracks)) {
                    this.filtersManager.filters.visibleTracks.tracks[track.get("id")] = true;
                }

                this.filterItems();
                this.redraw();
            },

            /**
             * Add a list of tracks, creating a view for each of them
             * @alias module:views-timeline.TimelineView#addTracksList
             * @param {Array | List} tracks The list of tracks to add
             */
            addTracksList: function (tracks) {
                this.allItems = {};
                if (tracks.length === 0) {
                    this.filterItems();
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
                    group: this.groupTemplate(trackJSON)
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
                endTime = startTime + annotation.get("duration");
                start = this.getFormatedDate(startTime);
                end = this.getFormatedDate(endTime);

                // If annotation is at the end of the video, we mark it for styling
                annotationJSON.atEnd = (videoDuration - endTime) < 3;

                var stackingLevel = this.stackingLevel[annotation.id] = this.getStackLevel(annotation);

                return {
                    model: track,
                    id: annotation.id,
                    trackId: track.id,
                    isPublic: track.get("isPublic"),
                    isMine: track.get("isMine"),
                    editable: track.get("isMine"),
                    start: start,
                    end: end,
                    content: this.itemTemplate(annotationJSON),
                    group: this.groupTemplate(trackJSON),
                    className: this.PREFIX_STACKING_CLASS + stackingLevel
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



                //this.redraw();
                //this.onTrackSelected(null, annotationsTool.selectedTrack.id);
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
             * Go through the list of items with the current active filter and save it in the filtered items array.
             * @alias module:views-timeline.TimelineView#filterItems
             * @return {Array} The list of filtered items
             */
            filterItems: function () {
                var tempList = _.values(this.allItems);

                tempList = this.filtersManager.filterAll(tempList);
                this.filteredItems = _.chain(tempList)
                    .filter(function (item) {
                        if (!item.id) return true;
                        var annotation = annotationsTool.getAnnotation(item.id);
                        if (!annotation) return true;
                        var category = annotation.category();
                        if (!category) return true;
                        return category.get("visible");
                    })
                    .sortBy(function (item) {
                        return _.isUndefined(item.model) ? 0 : item.model.get("name");
                    })
                    .value();

                if (this.filteredItems.length === 0) {
                    this.filteredItems.push({
                        trackId: this.VOID_TRACK.id,
                        isMine: this.VOID_TRACK.isMine,
                        isPublic: true,
                        start: this.startDate - 5000,
                        end: this.startDate - 4500,
                        content: this.VOID_ITEM_TMPL,
                        group: this.groupEmptyTemplate(this.VOID_TRACK)
                    });
                }

                return this.filteredItems;
            },

            /**
             * Switch on/off the filter related to the given event
             * @alias module:views-list.List#switchFilter
             * @param  {Event} event
             */
            switchFilter: function (event) {
                var active = !$(event.target).hasClass("checked"),
                    id = event.target.id.replace("filter-", "");

                this.filtersManager.switchFilter(id, active);
            },

            /**
             * Update the DOM elements related to the filters on filters update.
             * @alias module:views-timeline.TimelineView#updateFilterRender
             * @param  {PlainObject} attr The plain object representing the updated filter
             */
            updateFiltersRender: function (attr) {

                if (attr.active) {
                    this.$el.find("#filter-" + attr.id).addClass("checked");
                } else {
                    this.$el.find("#filter-" + attr.id).removeClass("checked");
                }

                this.filterItems();
                this.redraw();
            },

            /**
             * Disable all the list filter
             * @alias module:views-list.List#disableFilter
             */
            disableFilter: function () {
                this.$el.find(".filter").removeClass("checked");
                this.filtersManager.disableFilters();
                this.filterItems();
                this.redraw();
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
                    this.allItems[annotation.id] = this.generateItem(annotation, value.model);
                    this.filterItems();
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

                if (!this.isAnnotationSelectedonTimeline(selection[0])) {
                    _.each(data, function (item, index) {
                        if (selection[0].get("id") === item.id) {
                            this.timeline.selectItem(index, false, true);
                        }
                    }, this);
                }
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

                duration = this.getTimeInSeconds(values.item.end) - this.getTimeInSeconds(values.item.start);
                start = this.getTimeInSeconds(values.item.start);

                // If the annotation is not owned by the current user or the annotation is moved outside the timeline,
                // the update is canceled
                if (!values.newTrack.get("isMine") || !values.annotation.get("isMine") ||
                    this.getTimeInSeconds(values.item.end) > this.playerAdapter.getDuration() ||
                    start > this.playerAdapter.getDuration()) {
                    this.timeline.cancelChange();

                    this.allItems[values.annotation.id] = {
                        start: values.item.start,
                        end: values.item.end,
                        content: values.item.content,
                        group: this.groupTemplate(values.oldTrack.toJSON()),
                        id: values.annotation.id,
                        trackId: values.oldTrack.id,
                        model: values.oldTrack,
                        className: values.item.className
                    };

                    this.filterItems();
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
                        console.log(newAnnotation.id);
                        var stackingLevel = self.stackingLevel[newAnnotation.id] = self.getStackLevel(newAnnotation);
                        newAnnotation.unset("oldId", {
                            silent: true
                        });
                        newAnnotation.save();

                        annJSON.id = newAnnotation.get("id");
                        annJSON.track = values.newTrack.id;

                        if (annJSON.label && annJSON.label.category && annJSON.label.category.settings) {
                            annJSON.category = annJSON.label.category;
                        }

                        self.addItem(annJSON.id, {
                            start: values.item.start,
                            end: values.item.end,
                            group: values.item.group,
                            content: self.itemTemplate(annJSON),
                            id: annJSON.id,
                            trackId: values.newTrack.id,
                            isPublic: values.newTrack.get("isPublic"),
                            isMine: values.newTrack.get("isMine"),
                            className: self.PREFIX_STACKING_CLASS + stackingLevel,
                            model: values.newTrack
                        }, false);

                        self.removeItem(annJSON.oldId, false);

                        annotationsTool.setSelection([newAnnotation], true, true, true);

                        newAnnotation.set({
                            access: values.newTrack.get("access")
                        });

                        self.filterItems();
                        self.redraw();

                        if (hasToPlay) {
                            self.playerAdapter.play();
                        }
                    };

                    values.annotation.destroy({
                        success: destroyCallback
                    });

                } else {
                    this.allItems[values.annotation.id] = values.item;
                    values.annotation.set({
                        start: start,
                        duration: duration
                    });
                    values.annotation.save();

                    annotationsTool.playerAdapter.setCurrentTime(values.annotation.get("start"));
                    this.filterItems();
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

                if (this.allItems[annotation.id]) {
                    this.removeItem(annotation.id, true);
                }
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

                    values = _.values(this.allItems);

                    _.each(values, function (item) {
                        if (item.trackId === track.id) {
                            delete this.allItems[item.id];
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

                    if (this.allItems["track_" + track.id]) {
                        delete this.allItems["track_" + track.id];
                    }

                    this.filterItems();
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

                _.each(this.allItems, function (item) {
                    if (item.trackId === track.get("id") && item.group !== newGroup) {
                        item.group = newGroup;
                        item.isPublic = track.get("isPublic");
                        redrawRequired = true;
                    }
                }, this);

                if (!(options && options.silent) && redrawRequired) {
                    this.filterItems();
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
                this.$el.find(".timeline-group[data-id='" + trackId + "']").parent().addClass("selected");
            },

            /**
             * Listener for window resizing
             * @alias module:views-timeline.TimelineView#onWindowsResize
             */
            onWindowResize: function () {
                this.redraw();
                if (annotationsTool.selectedTrack) {
                    this.onTrackSelected(null, annotationsTool.selectedTrack.id);
                }
            },

            /* --------------------------------------
              Utils functions
            ----------------------------------------*/

            /**
             * Get the formated date for the timeline with the given seconds
             * @alias module:views-timeline.TimelineView#getFormatedDate
             * @param {Double} seconds The time in seconds to convert to Date
             * @returns {Date} Formated date for the timeline
             */
            getFormatedDate: function (seconds) {
                var newDate = new Date(seconds * 1000);
                newDate.setHours(newDate.getHours() - 1);
                return newDate;
            },

            /**
             * Transform the given date into a time in seconds
             * @alias module:views-timeline.TimelineView#getTimeInSeconds
             * @param {Date} date The formated date from timeline
             * @returns {Double} Date converted to time in seconds
             */
            getTimeInSeconds: function (date) {
                var time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000;
                return Math.round(Number(time)); // Ensue that is really a number
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

                if (_.isUndefined(annotation) || _.isUndefined(this.allItems[annotation.get("id")])) {
                    return undefined;
                }

                itemId = annotation.get("id");

                item = this.allItems[itemId];
                newTrackId = item.trackId;
                oldTrackId = $(item.content)[0].dataset.trackid;
                oldTrack = annotationsTool.getTrack(oldTrackId);
                newTrack = annotationsTool.getTrack(newTrackId);
                annotation = annotationsTool.getAnnotation(itemId, oldTrack);

                return {
                    annotation: annotation,
                    item: this.allItems[itemId],
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
                return this.allItems[annotation.id];
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
             * Get the top value from the annotations to avoid overlapping
             * @alias module:views-timeline.TimelineView#getStackLevel
             * @param {Annotation} annotation The target annotation
             * @returns {Integer} top for the target annotation
             */
            getStackLevel: function (annotation) {
                // TODO Should we really check this and then work with the collection?
                if (!annotation.collection) return 0;

                var start = annotation.get("start");
                var end = start + this.annotationItemDuration(annotation);

                var usedLevels = annotation.collection.chain()
                    .filter(function (other) {
                        var otherStart = other.get("start");
                        var otherEnd = otherStart + this.annotationItemDuration(other);

                        return annotation.id !== other.id &&
                            otherStart <= end &&
                            otherEnd >= start &&
                            this.allItems[other.id];
                    }, this)
                    .map(function (annotation) {
                        return this.stackingLevel[annotation.id];
                    }, this)
                    .sortBy();

                return usedLevels.find(function (level, index) {
                    // The used levels are sorted at this point,
                    // so the first discontinuity we find is a hole where we can place an annotation.
                    return level === index;
                }).value() || usedLevels.value().length;
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
                this.allItems = {};
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