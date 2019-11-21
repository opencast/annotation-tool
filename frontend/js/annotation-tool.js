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
 * Module containing the tool main object
 * @module annotation-tool
 */
define(["jquery",
        "underscore",
        "backbone",
        "i18next",
        "collections/videos",
        "views/main",
        "views/alert",
        "templates/delete-modal",
        "templates/delete-warning-content",
        "player-adapter",
        "colors",
        "handlebarsHelpers"],

    function ($, _, Backbone, i18next, Videos, MainView, AlertView, DeleteModalTmpl, DeleteContentTmpl, PlayerAdapter, ColorsManager) {

        "use strict";

        /**
         * The main object of the annotations tool
         * @namespace annotationTool
         */
        var annotationTool = window.annotationTool = _.extend({}, Backbone.Events, {

            EVENTS: {
                ANNOTATION_SELECTION : "at:annotation-selection",
                ANNOTATE_TOGGLE_EDIT : "at:annotate-switch-edit-modus",
                MODELS_INITIALIZED   : "at:models-initialized",
                TIMEUPDATE           : "at:timeupdate",
                USER_LOGGED          : "at:logged",
                VIDEO_LOADED         : "at:video-loaded"
            },

            timeupdateIntervals: [],

            views: {},

            modelsInitialized: false,

            deleteModalTmpl: DeleteModalTmpl,

            deleteContentTmpl: DeleteContentTmpl,

            deleteOperation: {
                /**
                 * Function to delete element with warning
                 *
                 * @param {Object} target Element to be delete
                 * @param {TargetsType} type Type of the target to be deleted
                 */
                start: function (target, type, callback) {

                    var confirm = function () {
                        type.destroy(target, callback);
                        this.deleteModal.modal("toggle");
                    },
                        confirmWithEnter = function (event) {
                            if (event.keyCode === 13) {
                                confirm();
                            }
                        };

                    if (!target.isEditable()) {
                        this.alertWarning("You are not authorized to deleted this " + type.name + "!");
                        return;
                    }

                    confirmWithEnter = _.bind(confirmWithEnter, this);
                    confirm = _.bind(confirm, this);

                    // Change modal title
                    this.deleteModalHeader.text("Delete " + type.name);

                    // Change warning content
                    this.deleteModalContent.html(this.deleteContentTmpl({
                        type: type.name,
                        content: type.getContent(target)
                    }));

                    // Listener for delete confirmation
                    this.deleteModal.find("#confirm-delete").one("click", confirm);

                    // Add possiblity to confirm with return key
                    $(window).on("keypress", confirmWithEnter);

                    // Unbind the listeners when the modal is hidden
                    this.deleteModal.one("hide", function () {
                        $("#confirm-delete").off("click");
                        $(window).off("keypress", confirmWithEnter);
                    });

                    // Show the modal
                    this.deleteModal.modal("show");
                }
            },

            alertModal: new AlertView(),

            /**
             * Initialize the tool
             * @alias   annotationTool.start
             * @param  {module:annotation-tool-configuration.Configuration} config The tool configuration
             */
            start: function (config) {
                _.bindAll(this,
                          "updateSelectionOnTimeUpdate",
                          "createAnnotation",
                          "deleteAnnotation",
                          "getAnnotation",
                          "getSelection",
                          "getTrack",
                          "getTracks",
                          "getSelectedTrack",
                          "fetchData",
                          "importTracks",
                          "importCategories",
                          "hasSelection",
                          "onDestroyRemoveSelection",
                          "onTimeUpdate",
                          "selectTrack",
                          "setSelection",
                          "setSelectionById",
                          "addTimeupdateListener",
                          "removeTimeupdateListener",
                          "updateSelectionOnTimeUpdate");

                _.extend(this, config);

                this.deleteOperation.start = _.bind(this.deleteOperation.start, this);
                this.initDeleteModal();

                this.addTimeupdateListener(this.updateSelectionOnTimeUpdate, 900);

                this.currentSelection = [];

                this.tracksOrder = [];

                this.freeTextVisible = true;

                this.colorsManager = new ColorsManager();

                this.once(this.EVENTS.USER_LOGGED, function () {

                    $("#logout").html(i18next.t(
                        "menu.logout",
                        { username: this.user.get("nickname") }
                    ));

                    this.fetchData();
                }, this);

                this.once(this.EVENTS.MODELS_INITIALIZED, function () {
                    this.views.main = new MainView();
                }, this);

                var importTracks = function () {

                    var updateTracksOrder = _.bind(function (tracks) {
                        this.tracksOrder = _.chain(tracks.getVisibleTracks())
                            .map("id")
                            .sortBy(function (trackId) {
                                return _.indexOf(this.tracksOrder, trackId);
                            }, this).value();
                    }, this);
                    this.listenTo(this.video, "change:tracks", updateTracksOrder);
                    updateTracksOrder(this.getTracks());

                    var trackImported = false;

                    if (!_.isUndefined(this.tracksToImport)) {
                        if (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) {
                            this.importTracks(this.tracksToImport());
                            trackImported = true;
                        } else {
                            $(this.playerAdapter).one(
                                PlayerAdapter.EVENTS.READY + " " + PlayerAdapter.EVENTS.PAUSE,
                                _.bind(function () {
                                    if (trackImported) {
                                        return;
                                    }

                                    this.importTracks(this.tracksToImport());
                                    trackImported = true;
                                }, this)
                            );
                        }
                    }
                };
                importTracks = _.after(2, importTracks, this);
                this.once(this.EVENTS.MODELS_INITIALIZED, importTracks);
                this.once(this.EVENTS.VIDEO_LOADED, importTracks);

                this.once(this.EVENTS.VIDEO_LOADED, function () {

                    if (!(this.playerAdapter instanceof PlayerAdapter)) {
                        throw "The player adapter is not valid! It must have PlayerAdapter as prototype.";
                    }

                    $(this.playerAdapter).on("pa_timeupdate", this.onTimeUpdate);

                    this.playerAdapter.load();
                }, this);

                this.authenticate();
            },

            /**
             * Display an alert modal
             * @alias   annotationTool.alertError
             * @param  {String} message The message to display
             */
            alertError: function (message) {
                this.alertModal.show(message, AlertView.TYPES.ERROR);
            },

            /**
             * Display a fatal error.
             * In addition to what {@link alertError} does, this also disables user interaction.
             * It effectively "crashes" the application with a (hopefully useful) error message.
             * @alias annotationTool.alertFatal
             * @param {String} message The error message to display
             */
            alertFatal: function (message) {
                this.alertModal.show(message, AlertView.TYPES.FATAL);
            },

            /**
             * Display an warning modal
             * @alias   annotationTool.alertWarning
             * @param  {String} message The message to display
             */
            alertWarning: function (message) {
                this.alertModal.show(message, AlertView.TYPES.WARNING);
            },

            /**
             * Display an information modal
             * @alias   annotationTool.alertInfo
             * @param  {String} message The message to display
             */
            alertInfo: function (message) {
                this.alertModal.show(message, AlertView.TYPES.INFO);
            },

            /**
             * Function to init the delete warning modal
             * @alias   annotationTool.initDeleteModal
             */
            initDeleteModal: function () {
                $("#dialogs").append(this.deleteModalTmpl({ type: "annotation" }));
                this.deleteModal = $("#modal-delete").modal({ show: true, backdrop: false, keyboard: true });
                this.deleteModal.modal("toggle");
                this.deleteModalHeader  = this.deleteModal.find(".modal-header h3");
                this.deleteModalContent = this.deleteModal.find(".modal-body");
            },

            /**
             * Transform time in seconds (i.e. 12.344) into a well formated time (01:12:04)
             * @alias   annotationTool.getWellFormatedTime
             * @param {number} time the time in seconds
             * @param {boolean} [noRounted] Define if the number should be rounded or if the decimal should be simply removed. Default is rounding (false).
             */
            getWellFormatedTime: function (time, noRounding) {
                var twoDigit = function (number) {
                    return (number < 10 ? "0" : "") + number;
                },
                    base    = (_.isUndefined(noRounding) || !noRounding) ? Math.round(time) : Math.floor(time),
                    seconds = base % 60,
                    minutes = ((base - seconds) / 60) % 60,
                    hours   = (base - seconds - minutes * 60) / 3600;

                return twoDigit(hours) + ":" + twoDigit(minutes) + ":" + twoDigit(seconds);
            },

            /**
             * Listen and retrigger timeupdate event from player adapter events with added intervals
             * @alias   annotationTool.onTimeUpdate
             */
            onTimeUpdate: function () {
                var currentPlayerTime = this.playerAdapter.getCurrentTime(),
                    currentTime = new Date().getTime(),
                    value,
                    i;

                // Ensure that this is an timeupdate due to normal playback, otherwise trigger timeupdate event for all intervals
                if ((_.isUndefined(this.lastTimeUpdate)) || (this.playerAdapter.getStatus() !== PlayerAdapter.STATUS.PLAYING) ||
                    (currentTime - this.lastTimeUpdate > 1000)) {

                    // Ensure that the timestamp from the last update is set
                    if (_.isUndefined(this.lastTimeUpdate)) {
                        this.lastTimeUpdate = 1;
                    }

                    for (i = 0; i < this.timeupdateIntervals.length; i++) {
                        value = this.timeupdateIntervals[i];
                        this.trigger(this.EVENTS.TIMEUPDATE + ":" + value.interval, currentPlayerTime);
                        this.timeupdateIntervals[i].lastUpdate = currentTime;
                    }

                } else {
                    // Trigger all the current events
                    this.trigger(this.EVENTS.TIMEUPDATE + ":all", currentPlayerTime);

                    for (i = 0; i < this.timeupdateIntervals.length; i++) {
                        value = this.timeupdateIntervals[i];
                        if ((currentTime - value.lastUpdate) > parseInt(value.interval, 10)) {
                            this.trigger(this.EVENTS.TIMEUPDATE + ":" + value.interval, currentPlayerTime);
                            this.timeupdateIntervals[i].lastUpdate = currentTime;
                        }
                    }
                }

                this.lastTimeUpdate = new Date().getTime();
            },

            /**
             * Add a timeupdate listener with the given interval
             * @alias   annotationTool.addTimeupdateListener
             * @param {Object} callback the listener callback
             * @param {Number} (interval) the interval between each timeupdate event
             */
            addTimeupdateListener: function (callback, interval) {
                var timeupdateEvent = this.EVENTS.TIMEUPDATE;

                if (!_.isUndefined(interval)) {
                    timeupdateEvent += ":" + interval;

                    // Check if the interval needs to be added to list
                    // TODO Use `findWhere` once that is available
                    if (!_.find(this.timeupdateIntervals, function (value) {
                        return value.interval === interval;
                    }, this)) {
                        // Add interval to list
                        this.timeupdateIntervals.push({
                            interval: interval,
                            lastUpdate: 0
                        });
                    }
                }

                this.listenTo(this, timeupdateEvent, callback);
            },

            /**
             * Remove the given timepudate listener
             * @alias   annotationTool.removeTimeupdateListener
             * @param {Object} callback the listener callback
             * @param {Number} (interval) the interval between each timeupdate event
             */
            removeTimeupdateListener: function (callback, interval) {
                var timeupdateEvent = this.EVENTS.TIMEUPDATE;

                if (!_.isUndefined(interval)) {
                    timeupdateEvent += ":" + interval;
                }

                this.stopListening(this, timeupdateEvent, callback);
            },

            /**
             * Listener for destroy event on selected annotation to update the selection
             * @alias   annotationTool.onDestroyRemoveSelection
             * @param  {Object} annotation The destroyed annotation
             */
            onDestroyRemoveSelection: function (annotation) {
                var currentSelection = this.currentSelection,
                    item,
                    i;

                for (i = 0; i < currentSelection.length; i++) {
                    item = currentSelection[i];
                    if (item.get("id") == annotation.get("id")) {
                        currentSelection.splice(i, 1);
                        this.trigger(this.EVENTS.ANNOTATION_SELECTION, currentSelection);
                        return;
                    }
                }
            },

            /**
             * Set the given annotation(s) as current selection
             * @alias   annotationTool.setSelectionById
             * @param {Array} selection The new selection. This is an array of object containing the id of the annotation and optionnaly the track id. See example below.
             * @example
             * {
             *     id: "a123", // The id of the annotations
             *     trackId: "b23", // The track id (optional)
             * }
             * @param {Boolean} moveTo define if the video should be move to the start point of the selection
             * @param {Boolean} isManuallySelected define if the selection has been done manually or through a video timeupdate
             */
            setSelectionById: function (selectedIds, moveTo, isManuallySelected) {
                var selectionAsArray = [],
                    tmpAnnotation;

                if (_.isArray(selectedIds) && selectedIds.length > 0) {
                    _.each(selectedIds, function (selection) {
                        tmpAnnotation = this.getAnnotation(selection.id, selection.trackId);
                        if (!_.isUndefined(tmpAnnotation)) {
                            selectionAsArray.push(tmpAnnotation);
                        }
                    }, this);
                } else {
                    console.warn("Invalid selection: " + selectedIds);
                }

                this.setSelection(selectionAsArray, moveTo, isManuallySelected);
            },

            /**
             * Set the given annotation(s) as current selection
             * @alias   annotationTool.setSelection
             * @param {Array} selection The new selection
             * @param {Boolean} moveTo define if the video should be move to the start point of the selection
             * @param {Boolean} isManuallySelected define if the selection has been done manually or through a video timeupdate
             */
            setSelection: function (selection, moveTo, isManuallySelected) {

                var currentSelection = this.currentSelection,
                    isEqual =   function (newSelection) {
                        var equal = true,
                            annotation,
                            findAnnotation = function (newAnnotation) {
                                return newAnnotation.get("id") === annotation.get("id");
                            },
                            i;

                        if (currentSelection.length !== newSelection.length) {
                            return false;
                        }

                        for (i = 0; i < currentSelection.length; i++) {
                            annotation = currentSelection[i];
                            if (!_.find(newSelection, findAnnotation)) {
                                equal = false;
                                return equal;
                            }
                        }

                        return equal;
                    },
                    item,
                    i;

                this.isManuallySelected = isManuallySelected;
                if (isManuallySelected) {
                    this.activeAnnotation = selection[0];
                }

                if (_.isArray(selection) && selection.length > 0) {
                    if (isEqual(selection)) {
                        if (isManuallySelected) {
                            // If the selection is the same, we unselect it if this is a manual selection
                            // Remove listener for destroy event (unselect);
                            for (i = 0; i < currentSelection.length; i++) {
                                item = currentSelection[i];
                                this.stopListening(item, "destroy", this.onDestroyRemoveSelection);
                            }
                            currentSelection = [];
                            this.isManuallySelected = false;
                        } else {
                            // If the selection is not done manually we don't need to reselect it
                            return;
                        }
                    } else {
                        // else we set the new selection
                        currentSelection = selection;
                    }
                } else {
                    // If there is already no selection, no more work to do
                    if (!this.hasSelection()) {
                        return;
                    }

                    currentSelection = [];
                }

                // Add listener for destroy event (unselect);
                for (i = 0; i < currentSelection.length; i++) {
                    item = currentSelection[i];
                    this.listenTo(item, "destroy", this.onDestroyRemoveSelection);
                }

                this.currentSelection = currentSelection;

                // if the selection is not empty, we move the playhead to it
                if (currentSelection.length > 0 && moveTo) {
                    this.playerAdapter.setCurrentTime(selection[0].get("start"));
                }

                // Trigger the selection event
                this.trigger(this.EVENTS.ANNOTATION_SELECTION, currentSelection);
            },

            /**
             * Returns the current selection of the tool
             * @alias   annotationTool.getSelection
             * @return {Annotation} The current selection or undefined if no selection.
             */
            getSelection: function () {
                return this.currentSelection;
            },

            /**
             * Informs if there is or not some items selected
             * @alias   annotationTool.hasSelection
             * @return {Boolean} true if an annotation is selected or false.
             */
            hasSelection: function () {
                return (typeof this.currentSelection !== "undefined" && (_.isArray(this.currentSelection) && this.currentSelection.length > 0));
            },

            /**
             * Update the ordering of the tracks and alert everyone who is interested.
             * @alias  annotationTool.orderTracks
             * @param {Array} order The new track order
             */
            orderTracks: function (order) {
                this.tracksOrder = order;
                this.trigger("order", order);
            },

            /**
             * Shows or hides the free text annotations
             * @alias annotationTool.toggleFreeTextAnnotations
             */
            toggleFreeTextAnnotations: function () {
                this.freeTextVisible = !this.freeTextVisible;
                this.trigger("togglefreetext");
            },

            /**
             * Get all annotations that cover a given point in time.
             * @alias   annotationTool.getCurrentAnnotations
             * @param {Number} [time] The time you are interested in or the current player time if omitted
             */
            getCurrentAnnotations: function (time) {
                if (!time) {
                    time = this.playerAdapter.getCurrentTime();
                }
                return this.video.get("tracks")
                    .chain()
                    .map(function (track) { return track.get("annotations").models; })
                    .flatten()
                    .filter(function (annotation) { return annotation.covers(time, this.MINIMAL_DURATION); }, this)
                    .value();
            },

            /**
             * Listener for player "timeupdate" event to highlight the current annotations
             * @alias   annotationTool.updateSelectionOnTimeUpdate
             */
            updateSelectionOnTimeUpdate: function () {
                var currentTime = this.playerAdapter.getCurrentTime(),
                    selection = [],
                    annotations = [],
                    annotation,
                    start,
                    duration,
                    end,
                    i;

                if (typeof this.video === "undefined" || (this.isManuallySelected && this.hasSelection())) {
                    return;
                }

                this.setSelection(this.getCurrentAnnotations(), false);
            },

            //////////////
            // CREATORs //
            //////////////

            /**
             * Create an annotation on the selected track.
             * If the `params` do not contain a user (`created_by`), the new annotation belongs to the current user.
             * If it does not specify a `start` time, the current time of the playhead is used.
             * This function also makes the new annotation the "active" annotation which is operated on
             * by global operations like keyboard shortcuts.
             * @alias annotationTool.createAnnotation
             * @param {Object} params The content of the new annotation
             * @return {Object} The created annotation
             */
            createAnnotation: function (params) {
                if (!params.created_by && this.user) {
                    params.created_by = this.user.id;
                }
                if (!params.time) {
                    var time = Math.round(this.playerAdapter.getCurrentTime());
                    if (!_.isNumber(time) || time < 0) {
                        return undefined;
                    }
                    params.start = time;
                }

                var options = {};
                if (!this.localStorage) {
                    options.wait = true;
                }

                // The loop controller can constrain annotations to the current loop using this.
                // @see module:views-loop.Loop#toggleConstrainAnnotations
                _.extend(params, this.annotationConstraints);

                var annotation = this.selectedTrack.get("annotations").create(params, options);
                this.activeAnnotation = annotation;
                return annotation;
            },

            /////////////
            // GETTERs //
            /////////////

            /**
             * Get the track with the given Id
             * @alias   annotationTool.getTrack
             * @param  {String} id The track Id
             * @return {Object}    The track object or undefined if not found
             */
            getTrack: function (id) {
                if (_.isUndefined(this.video)) {
                    console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                    return undefined;
                } else {
                    return this.video.getTrack(id);
                }
            },

            /**
             * Get all the tracks
             * @alias   annotationTool.getTracks
             * @return {Object}    The list of the tracks
             */
            getTracks: function () {
                if (_.isUndefined(this.video)) {
                    console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                    return undefined;
                } else {
                    return this.video.get("tracks");
                }
            },

            /**
             * Get the track with the given Id
             * @alias   annotationTool.getTrack
             * @param  {String} id The track Id
             * @return {Object}    The track object or undefined if not found
             */
            getSelectedTrack: function () {
                return this.selectedTrack;
            },

            /**
             * Select the given track
             * @alias   annotationTool.selectTrack
             * @param  {Object} track the track to select
             */
            selectTrack: function (track) {
                this.selectedTrack = track;
                this.video.get("tracks").trigger("select", track);
            },

            /**
             * Get the annotation with the given Id
             * @alias   annotationTool.getAnnotation
             * @param  {String} annotationId The annotation
             * @param  {String} (trackId)      The track Id (Optional)
             * @return {Object}   The annotation object or undefined if not found
             */
            getAnnotation: function (annotationId, trackId) {
                var track,
                    annotation;

                if (!_.isUndefined(trackId)) {
                    // If the track id is given, we only search for the annotation on it

                    track = this.getTrack(trackId);

                    if (_.isUndefined(track)) {
                        console.warn("Not able to find the track with the given Id");
                        return undefined;
                    } else {
                        return track.getAnnotation(annotationId);
                    }
                } else {
                    // If no trackId present, we search through all tracks

                    if (_.isUndefined(this.video)) {
                        console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                        return undefined;
                    } else {
                        this.video.get("tracks").each(function (trackItem) {
                            var tmpAnnotation = trackItem.getAnnotation(annotationId);
                            if (!_.isUndefined(tmpAnnotation)) {
                                annotation = tmpAnnotation;
                            }
                        }, this);
                        return annotation;
                    }
                }
            },

            /**
             * Get an array containning all the annotations or only the ones from the given track
             * @alias   annotationTool.getAnnotations
             * @param  {String} (trackId)      The track Id (Optional)
             * @return {Array}   The annotations
             */
            getAnnotations: function (trackId) {
                var track,
                    tracks,
                    annotations = [];

                if (_.isUndefined(this.video)) {
                    console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                } else {
                    if (!_.isUndefined(trackId)) {
                        track = this.getTrack(trackId);
                        if (!_.isUndefined(track)) {
                            annotations = track.get("annotations").toArray();
                        }
                    } else {
                        tracks = this.video.get("tracks");
                        tracks.each(function (t) {
                            annotations = _.union(annotations, t.get("annotations").toArray());
                        }, this);
                    }
                }
                return annotations;
            },

            ////////////////
            // IMPORTERs  //
            ////////////////

            /**
             * Import the given tracks in the tool
             * @alias annotationTool.importTracks
             * @param {PlainObject} tracks Object containing the tracks in the tool
             */
            importTracks: function (tracks) {
                _.each(tracks, function (track) {
                    this.setLoadingProgress(
                        this.loadingPercent,
                        i18next.t("startup.importing track", { track: track.name })
                    );
                    if (_.isUndefined(this.getTrack(track.id))) {
                        this.video.get("tracks").create(track);
                    } else {
                        console.info("Can not import track %s: A track with this ID already exist.", track.id);
                    }
                }, this);
            },

            /**
             * Import the given categories in the tool
             * @alias annotationTool.importCategories
             * @param {PlainObject} imported Object containing the .categories and .scales to insert in the tool
             * @param {PlainObject} defaultCategoryAttributes The default attributes to use to insert the imported categories (like access)
             */
            importCategories: function (imported, defaultCategoryAttributes) {
                var videoCategories = this.video.get("categories"),
                    videoScales = this.video.get("scales"),
                    labelsToAdd,
                    newCat,
                    newScale,
                    scaleValuesToAdd,
                    scaleOldId,
                    scalesIdMap = {};

                if (!imported.categories || imported.categories.length === 0) {
                    return;
                }

                _.each(imported.scales, function (scale) {
                    scaleOldId = scale.id;
                    scaleValuesToAdd = scale.scaleValues;
                    delete scale.id;
                    delete scale.scaleValues;

                    newScale = videoScales.create(scale, { async: false });
                    scalesIdMap[scaleOldId] = newScale.get("id");

                    if (scaleValuesToAdd) {
                        _.each(scaleValuesToAdd, function (scaleValue) {
                            scaleValue.scale = newScale;
                            newScale.get("scaleValues").create(scaleValue);
                        });
                    }
                });

                _.each(imported.categories, function (category) {
                    labelsToAdd = category.labels;
                    category.scale_id = scalesIdMap[category.scale_id];
                    delete category.labels;
                    newCat = videoCategories.create(_.extend(category, defaultCategoryAttributes), { async: false });

                    if (labelsToAdd) {
                        _.each(labelsToAdd, function (label) {
                            label.category = newCat;
                            newCat.get("labels").create(label);
                        });
                    }
                });
            },

            //////////////
            // DELETERs //
            //////////////

            /**
             * Delete the annotation with the given id with the track with the given track id
             * @alias annotationTool.deleteAnnotation
             * @param {Integer} annotationId The id of the annotation to delete
             * @param {Integer} trackId Id of the track containing the annotation
             */
            deleteAnnotation: function (annotationId, trackId) {
                var annotation,
                    self = this;

                if (typeof trackId === "undefined") {
                    this.video.get("tracks").each(function (track) {
                        if (track.get("annotations").get(annotationId)) {
                            trackId = track.get("id");
                        }
                    });
                }

                annotation = self.video.getAnnotation(annotationId, trackId);

                if (annotation) {
                    self.deleteOperation.start(annotation, self.deleteOperation.targetTypes.ANNOTATION);
                } else {
                    console.warn("Not able to find annotation %i on track %i", annotationId, trackId);
                }
            },

            /**
             * Get all the annotations for the current user
             * @alias annotationTool.fetchData
             */
            fetchData: function () {
                var video,
                    videos = new Videos(),
                    tracks,
                    // function to conclude the retrieve of annotations
                    concludeInitialization = _.bind(function () {

                        // At least one private track should exist, we select the first one
                        var selectedTrack = tracks.getMine()[0];

                        if (!selectedTrack.get("id")) {
                            selectedTrack.on("ready", concludeInitialization, this);
                        } else {
                            this.selectedTrack = selectedTrack;

                            this.modelsInitialized = true;
                            this.trigger(this.EVENTS.MODELS_INITIALIZED);
                        }
                    }, this),

                    /**
                     * Create a default track for the current user if no private track is present
                     */
                    createDefaultTrack = _.bind(function () {

                        tracks = this.video.get("tracks");

                        if (this.localStorage) {
                            tracks = tracks.getTracksForLocalStorage();
                        }

                        if (tracks.getMine().length === 0) {
                            tracks.create({
                                name: i18next.t("default track.name", {
                                    nickname: this.user.get("nickname")
                                }),
                                description: i18next.t("default track.description", {
                                    nickname: this.user.get("nickname")
                                })
                            }, {
                                wait: true,
                                success: concludeInitialization
                            });
                        } else {
                            tracks.showTracks(
                                tracks.where({ isMine: true })
                            );
                            concludeInitialization();
                        }
                    }, this);

                $.when(this.getVideoExtId(), this.getVideoParameters()).then(
                    _.bind(function (videoExtId, videoParameters) {
                        // If we are using the localstorage
                        if (this.localStorage) {
                            videos.fetch({
                                success: _.bind(function () {
                                    if (videos.length === 0) {
                                        video = videos.create(videoParameters, { wait: true });
                                    } else {
                                        video = videos.at(0);
                                        video.set(videoParameters);
                                    }

                                    this.video = video;
                                }, this)
                            });

                            createDefaultTrack();
                        } else { // With REST storage
                            videos.add({ video_extid: videoExtId });
                            video = videos.at(0);
                            this.video = video;
                            video.set(videoParameters);
                            video.save(null, {
                                error: _.bind(function (model, response, options) {
                                    if (response.status === 403) {
                                        this.alertFatal(i18next.t("annotation not allowed"));
                                        this.views.main.loadingBox.hide();
                                    }
                                }, this)
                            });
                            if (video.get("ready")) {
                                createDefaultTrack();
                            } else {
                                video.once("ready", createDefaultTrack);
                            }
                        }
                    }, this)
                );
            }
        });

        /**
         * Type of target that can be deleted using the delete warning modal
         *
         * Each type object must contain these elements
         *
         * {
         *   name: "Name of the type", // String
         *   getContent: function(target){ // Function
         *       return "Content of the target element"
         *   },
         *   destroy: function(target){ // Function
         *       // Delete the target
         *   }
         * }
         */
        annotationTool.deleteOperation.targetTypes = {

            ANNOTATION: {
                name: "annotation",
                getContent: function (target) {
                    return target.get("text");
                },
                destroy: function (target, callback) {

                    target.destroy({

                        success: function () {
                            if (annotationTool.localStorage) {
                                annotationTool.video.get("tracks").each(function (value) {
                                    if (value.get("annotations").get(target.id)) {
                                        value.get("annotations").remove(target);
                                        value.save(null, { wait: true });
                                        return false;
                                    }
                                    return undefined;
                                });
                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete annotation: " + error);
                        }
                    });
                }
            },


            COMMENT: {
                name: "comment",
                getContent: function (target) {
                    return target.get("text");
                },
                destroy: function (target, callback) {

                    target.destroy({

                        success: function () {
                            if (annotationTool.localStorage) {
                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete comment: " + error);
                        }
                    });
                }
            },

            LABEL: {
                name: "label",
                getContent: function (target) {
                    return target.get("value");
                },
                destroy: function (target, callback) {
                    target.destroy({

                        success: function () {
                            if (annotationTool.localStorage) {
                                if (target.collection) {
                                    target.collection.remove(target);
                                }
                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete label: " + error);
                        }
                    });
                }
            },

            TRACK: {
                name: "track",
                getContent: function (target) {
                    return target.get("name");
                },
                destroy: function (track, callback) {
                    _.invoke(
                        _.clone(track.get("annotations").models),
                        "destroy",
                        { error: function () { throw "cannot delete annotation"; } }
                    );
                    track.destroy({
                        success: function () {
                            if (annotationTool.localStorage) {
                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete track: " + error);
                        }
                    });
                }
            },

            CATEGORY: {
                name: "category",
                getContent: function (target) {
                    return target.get("name");
                },
                destroy: function (category, callback) {
                    _.invoke(
                        _.clone(category.get("labels").models),
                        "destroy",
                        { error: function () { throw "cannot delete label"; } }
                    );
                    category.destroy({
                        success: function () {
                            if (annotationTool.localStorage) {
                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete category: " + error);
                        }
                    });
                }
            },

            SCALEVALUE: {
                name: "scale value",
                getContent: function (target) {
                    return target.get("name");
                },
                destroy: function (target, callback) {

                    target.destroy({

                        success: function () {
                            if (window.annotationTool.localStorage) {
                                if (target.collection) {
                                    target.collection.remove(target);
                                }

                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },

                        error: function (error) {
                            console.warn("Cannot delete scale value: " + error);
                        }
                    });
                }
            },

            SCALE: {
                name: "scale",
                getContent: function (target) {
                    return target.get("name");
                },
                destroy: function (scale, callback) {
                    _.invoke(
                        _.clone(scale.get("scalevalues").models),
                        "destroy",
                        { error: function () { throw "cannot delete scale value"; } }
                    );
                    scale.destroy({
                        success: function () {
                            if (window.annotationTool.localStorage) {
                                annotationTool.video.save();
                            }
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete scale: " + error);
                        }
                    });
                }
            }
        };

        return annotationTool;
    }
);
