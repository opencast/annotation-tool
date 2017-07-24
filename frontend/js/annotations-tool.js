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
 * @module annotations-tool
 * @requires jQuery
 * @requires backbone
 * @requires i18next
 * @requires moment
 * @requires views-main
 * @requires views-alert
 * @requires views-list-annotation
 * @requires templates/delete-modal.tmpl
 * @requires templates/delete-warning-content.tmpl
 * @requires player-adapter
 * @requires handlebars
 * @requires annotation-sync
 */
define(["jquery",
        "underscore",
        "backbone",
        "i18next",
        "moment",
        "collections/videos",
        "views/main",
        "views/alert",
        "views/list-annotation",
        "templates/delete-modal",
        "templates/delete-warning-content",
        "prototypes/player_adapter",
        "roles",
        "colors",
        "annotation-sync",
        "handlebarsHelpers"],

    function ($, _, Backbone, i18next, moment, Videos, MainView, AlertView, ListAnnotation, DeleteModalTmpl, DeleteContentTmpl, PlayerAdapter, ROLES, ColorsManager, annotationSync) {

        "use strict";

        /**
         * The main object of the annotations tool
         * @namespace annotationsTool
         */
        var annotationsTool = window.annotationsTool = _.extend({

            EVENTS: {
                ANNOTATION_SELECTION : "at:annotation-selection",
                ANNOTATE_TOGGLE_EDIT : "at:annotate-switch-edit-modus",
                MODELS_INITIALIZED   : "at:models-initialized",
                NOTIFICATION         : "at:notification",
                READY                : "at:ready",
                TIMEUPDATE           : "at:timeupdate",
                USER_LOGGED          : "at:logged"
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

                    if (!target.get("isMine") && this.getUserRole() !== ROLES.ADMINISTRATOR) {
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
                    $(window).bind("keypress", confirmWithEnter);

                    // Unbind the listeners when the modal is hidden
                    this.deleteModal.one("hide", function () {
                        $("#confirm-delete").unbind("click");
                        $(window).unbind("keypress", confirmWithEnter);
                    });

                    // Show the modal
                    this.deleteModal.modal("show");
                }
            },

            alertModal: new AlertView(),

            /**
             * Initialize the tool
             * @alias   annotationsTool.start
             * @param  {module:annotations-tool-configuration.Configuration} config The tool configuration
             */
            start: function (config) {
                _.bindAll(this, "updateSelectionOnTimeUpdate",
                          "createTrack",
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
                          "onClickSelectionById",
                          "onDestroyRemoveSelection",
                          "onMouseDown",
                          "onMouseUp",
                          "onTimeUpdate",
                          "selectTrack",
                          "setSelection",
                          "setSelectionById",
                          "addTimeupdateListener",
                          "removeTimeupdateListener",
                          "updateSelectionOnTimeUpdate",
                          "potentiallyOpenCurrentItems");

                _.extend(this, config);

                if (this.loadVideo) {
                    this.loadVideo();
                }

                if ((this.isBrowserIE9() && !(this.playerAdapter.__proto__ instanceof this.PlayerAdapter)) ||
                    (!this.isBrowserIE9() && !(this.playerAdapter instanceof PlayerAdapter))) {
                    throw "The player adapter is not valid! It must have PlayerAdapter as prototype.";
                }

                // Set up the storage layer
                Backbone.sync = annotationSync;

                this.deleteOperation.start = _.bind(this.deleteOperation.start, this);
                this.initDeleteModal();

                this.addTimeupdateListener(this.updateSelectionOnTimeUpdate, 900);
                this.addTimeupdateListener(this.potentiallyOpenCurrentItems, 900);

                this.currentSelection = [];

                this.once(this.EVENTS.USER_LOGGED, this.fetchData);
                this.once(this.EVENTS.MODELS_INITIALIZED, function () {
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
                }, this);

                this.colorsManager = new ColorsManager();

                this.views.main = new MainView(this.playerAdapter);

                $(this.playerAdapter).bind("pa_timeupdate", this.onTimeUpdate);

                $(window).bind("mousedown", this.onMouseDown);
                $(window).bind("mouseup", this.onMouseUp);

                return this;
            },

            /**
             * Formats the given date
             * @alias annotationsTool.formatDate
             */
            formatDate: function (date) {
                return moment(date).format("L");
            },

            /**
             * Log in the current user of the tool
             * @alias annotationsTool.login
             * @param {Object} The Attributes of the user that is to be logged in.
             * @param {Object} callbacks Callbacks for the user creation
             * @return {User} The logged in user
             * @see module:models-user.User#initialize
             */
            login: function (attributes, callbacks) {
                var user = this.users.create(attributes, { wait: true });
                if (!user) throw "Invalid user";
                user.bind(callbacks);
                user.save();
                this.user = user;
                this.users.trigger("login");
                this.trigger(this.EVENTS.USER_LOGGED);
                return user;
            },

            /**
             * Display an alert modal
             * @alias   annotationsTool.alertError
             * @param  {String} message The message to display
             */
            alertError: function (message) {
                this.alertModal.show(message, AlertView.TYPES.ERROR);
            },

            /**
             * Display a fatal error.
             * In addition to what {@link alertError} does, this also disables user interaction.
             * It effectively "crashes" the application with a (hopefully useful) error message.
             * @alias annotationsTool.alertFatal
             * @param {String} message The error message to display
             */
            alertFatal: function (message) {
                this.alertModal.show(message, AlertView.TYPES.FATAL);
            },

            /**
             * Display an warning modal
             * @alias   annotationsTool.alertWarning
             * @param  {String} message The message to display
             */
            alertWarning: function (message) {
                this.alertModal.show(message, AlertView.TYPES.WARNING);
            },

            /**
             * Display an information modal
             * @alias   annotationsTool.alertInfo
             * @param  {String} message The message to display
             */
            alertInfo: function (message) {
                this.alertModal.show(message, AlertView.TYPES.INFO);
            },

            /**
             * Function to init the delete warning modal
             * @alias   annotationsTool.initDeleteModal
             */
            initDeleteModal: function () {
                $("#dialogs").append(this.deleteModalTmpl({type: "annotation"}));
                this.deleteModal = $("#modal-delete").modal({show: true, backdrop: false, keyboard: true });
                this.deleteModal.modal("toggle");
                this.deleteModalHeader  = this.deleteModal.find(".modal-header h3");
                this.deleteModalContent = this.deleteModal.find(".modal-body");
            },

            /**
             * Transform time in seconds (i.e. 12.344) into a well formated time (01:12:04)
             * @alias   annotationsTool.getWellFormatedTime
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
             * Check if the current browser is Safari 6
             * @alias   annotationsTool.isBrowserSafari6
             * @return {boolean} true if the browser is safari 6, otherwise false
             */
            isBrowserSafari6: function () {
                return (navigator.appVersion.search("Version/6") > 0 && navigator.appVersion.search("Safari") > 0);
            },

            /**
             * Check if the current browser is Microsoft Internet Explorer 9
             * @alias   annotationsTool.isBrowserIE9
             * @return {boolean} true if the browser is IE9, otherwise false
             */
            isBrowserIE9: function () {
                return (navigator.appVersion.search("MSIE 9") > 0);
            },

            /**
             * Listener for mouse down event to get infos about the click
             * @alias   annotationsTool.onMouseDown
             */
            onMouseDown: function () {
                this.timeMouseDown = undefined;
                this.startMouseDown = new Date();
                this.isMouseDown = true;
            },

            /**
             * Listener for mouse up event to get infos about the click
             * @alias   annotationsTool.onMouseUp
             */
            onMouseUp: function () {
                this.timeMouseDown = new Date() - this.startMouseDown;
                this.startMouseDown = undefined;
                this.isMouseDown = false;
            },

            /**
             * Listen and retrigger timeupdate event from player adapter events with added intervals
             * @alias   annotationsTool.onTimeUpdate
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
             * @alias   annotationsTool.addTimeupdateListener
             * @param {Object} callback the listener callback
             * @param {Number} (interval) the interval between each timeupdate event
             */
            addTimeupdateListener: function (callback, interval) {
                var timeupdateEvent = this.EVENTS.TIMEUPDATE,
                    value,
                    i = 0;

                if (!_.isUndefined(interval)) {
                    timeupdateEvent += ":" + interval;

                    // Check if the interval needs to be added to list
                    _.bind(function () {
                        for (i = 0; i < this.timeupdateIntervals.length; i++) {
                            value = this.timeupdateIntervals[i];

                            if (value.interval === interval) {
                                return;
                            }
                        }

                        // Add interval to list
                        this.timeupdateIntervals.push({
                            interval: interval,
                            lastUpdate: 0
                        });
                    }, this)();
                }

                this.listenTo(this, timeupdateEvent, callback);
            },

            /**
             * Remove the given timepudate listener
             * @alias   annotationsTool.removeTimeupdateListener
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

            ///////////////////////////////////////////////
            // Function related to annotation selection  //
            ///////////////////////////////////////////////

            /**
             * Proxy to select annotation by Id on mouse click
             * @alias   annotationsTool.onClickSelectionById
             * @param {Array} selection The new selection. This is an array of object containing the id of the annotation and optionnaly the track id. See example below.
             * @example
             * {
             *     id: "a123", // The id of the annotations
             *     trackId: "b23", // The track id (optional)
             * }
             * @param {Boolean} moveTo define if the video should be move to the start point of the selection
             * @param {Boolean} isManuallySelected define if the selection has been done manually or through a video timeupdate
             */
            onClickSelectionById: function (selectedIds, moveTo, isManuallySelected) {
                if (!this.isMouseDown && this.timeMouseDown < 300) {
                    this.setSelectionById(selectedIds, moveTo, isManuallySelected);
                }
            },

            /**
             * Listener for destroy event on selected annotation to update the selection
             * @alias   annotationsTool.onDestroyRemoveSelection
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
             * @alias   annotationsTool.setSelectionById
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
             * @alias   annotationsTool.setSelection
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
             * @alias   annotationsTool.getSelection
             * @return {Annotation} The current selection or undefined if no selection.
             */
            getSelection: function () {
                return this.currentSelection;
            },

            /**
             * Informs if there is or not some items selected
             * @alias   annotationsTool.hasSelection
             * @return {Boolean} true if an annotation is selected or false.
             */
            hasSelection: function () {
                return (typeof this.currentSelection !== "undefined" && (_.isArray(this.currentSelection) && this.currentSelection.length > 0));
            },

            /**
             * Get all annotations that cover a given point in time.
             * @alias   annotationsTool.getCurrentAnnotations
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
             * @alias   annotationsTool.updateSelectionOnTimeUpdate
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

            /**
             * Listener for player "timeupdate" event to open the current annotations in the list view
             * @alias   annotationsTool.potentiallyOpenCurrentItems
             */
            potentiallyOpenCurrentItems: function () {
                var previousAnnotations = [];

                return function () {
                    if (!this.autoExpand) return;

                    var listView = this.views.main.listView;
                    if (!listView) return;

                    _.each(previousAnnotations, function (annotation) {
                        listView.getViewFromAnnotation(annotation.id).collapse(true);
                    });
                    var currentAnnotations = this.getCurrentAnnotations();
                    _.each(currentAnnotations, function (annotation) {
                        listView.getViewFromAnnotation(annotation.id).expand(true);
                    });
                    previousAnnotations = currentAnnotations;
                };
            }(),

            //////////////
            // CREATORs //
            //////////////

            /**
             * Create a new track
             * @alias   annotationsTool.createTrack
             * @param  {Object} parameters The content of the new track
             * @param  {Object} (options) The options for the Backone.js options for the model creation
             * @return {Object}  The created track
             */
            createTrack: function (parameters, options) {
                var defaultOptions = {
                    wait: true
                }; // TODO define default options for all tracks

                return this.video.get("tracks").create(parameters, (_.isUndefined(options) ? defaultOptions : options));
            },

            /**
             * Create an annotation on the selected track.
             * If the `params` do not contain a user (`created_by`), the new annotation belongs to the current user.
             * If it does not specify a `start` time, the current time of the playhead is used.
             * This function also makes the new annotation the "active" annotation which is operated on
             * by global operations like keyboard shortcuts.
             * @alias annotationsTool.createAnnotation
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
             * @alias   annotationsTool.getTrack
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
             * @alias   annotationsTool.getTracks
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
             * @alias   annotationsTool.getTrack
             * @param  {String} id The track Id
             * @return {Object}    The track object or undefined if not found
             */
            getSelectedTrack: function () {
                return this.selectedTrack;
            },

            /**
             * Select the given track
             * @alias   annotationsTool.selectTrack
             * @param  {Object} track the track to select
             */
            selectTrack: function (track) {
                this.selectedTrack = track;
                this.video.get("tracks").trigger("selected_track", track);
            },

            /**
             * Get the annotation with the given Id
             * @alias   annotationsTool.getAnnotation
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
                        return;
                    } else {
                        return track.getAnnotation(annotationId);
                    }
                } else {
                    // If no trackId present, we search through all tracks

                    if (_.isUndefined(this.video)) {
                        console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                        return;
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
             * @alias   annotationsTool.getAnnotations
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
             * @alias annotationsTool.importTracks
             * @param {PlainObject} tracks Object containing the tracks in the tool
             */
            importTracks: function (tracks) {
                _.each(tracks, function (track) {
                    this.trigger(this.EVENTS.NOTIFICATION, "Importing track " + track.name);
                    if (_.isUndefined(this.getTrack(track.id))) {
                        this.createTrack(track);
                    } else {
                        console.info("Can not import track %s: A track with this ID already exist.", track.id);
                    }
                }, this);
            },

            /**
             * Import the given categories in the tool
             * @alias annotationsTool.importCategories
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

                    newScale = videoScales.create(scale, {async: false});
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
                    newCat = videoCategories.create(_.extend(category, defaultCategoryAttributes));

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
             * @alias annotationsTool.deleteAnnotation
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
             * @alias annotationsTool.fetchData
             */
            fetchData: function () {
                var video,
                    videos = new Videos(),
                    tracks,
                    self = this,
                    selectedTrack,

                    // function to conclude the retrieve of annotations
                    concludeInitialization = _.bind(function () {

                        // At least one private track should exist, we select the first one
                        selectedTrack = tracks.getMine()[0];

                        if (!selectedTrack.get("id")) {
                            selectedTrack.bind("ready", concludeInitialization(), this);
                        } else {
                            this.selectedTrack = selectedTrack;
                        }

                        this.modelsInitialized = true;
                        this.trigger(this.EVENTS.MODELS_INITIALIZED);
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
                                name        : i18next.t("default track.name", { nickname: this.user.get("nickname") }),
                                description : i18next.t("default track.description", { nickname: this.user.get("nickname") })
                            }, {
                                wait    : true,
                                success : concludeInitialization
                            });
                        } else {
                            tracks.showTracks(_.first(tracks.filter(this.getDefaultTracks().filter), this.MAX_VISIBLE_TRACKS || Number.MAX_VALUE));
                            concludeInitialization();
                        }
                    }, this);

                // If we are using the localstorage
                if (this.localStorage) {
                    videos.fetch({
                        success: function () {
                            if (videos.length === 0) {
                                video = videos.create(self.getVideoParameters(), {wait: true});
                            } else {
                                video = videos.at(0);
                                video.set(self.getVideoParameters());
                            }

                            self.video = video;
                        }
                    });

                    createDefaultTrack();
                } else { // With Rest storage
                    videos.add({video_extid: this.getVideoExtId()});
                    video = videos.at(0);
                    this.video = video;
                    video.set(self.getVideoParameters());
                    video.save({}, {
                        error: _.bind(function (model, response, options) {
                            if (response.status === 403) {
                                this.alertFatal('You are not allowed to annotate this video!');
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
            }
        }, _.clone(Backbone.Events));



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
        annotationsTool.deleteOperation.targetTypes = {

            ANNOTATION: {
                name: "annotation",
                getContent: function (target) {
                    return target.get("text");
                },
                destroy: function (target, callback) {

                    target.destroy({

                        success: function () {
                            if (annotationsTool.localStorage) {
                                annotationsTool.video.get("tracks").each(function (value) {
                                    if (value.get("annotations").get(target.id)) {
                                        value.get("annotations").remove(target);
                                        value.save({wait: true});
                                        return false;
                                    }
                                });
                                annotationsTool.video.save();
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
                            if (annotationsTool.localStorage) {
                                if (target.collection) {
                                    target.collection.remove(target);
                                }

                                annotationsTool.video.save();
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
                            if (annotationsTool.localStorage) {
                                if (target.collection) {
                                    target.collection.remove(target);
                                }
                                annotationsTool.video.save();
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
                    var annotations = track.get("annotations"),
                        /**
                         * Recursive function to delete synchronously all annotations
                         */
                        destroyAnnotation = function () {
                            var annotation;

                            // End state, no more annotation
                            if (annotations.length === 0) {
                                return;
                            }
                            annotation = annotations.at(0);
                            annotation.destroy({
                                error: function () {
                                    throw "Cannot delete annotation!";
                                },
                                success: function () {
                                    annotations.remove(annotation);
                                    destroyAnnotation();
                                }
                            });
                        };
                    // Call the recursive function
                    destroyAnnotation();
                    track.destroy({
                        success: function () {
                            if (annotationsTool.localStorage) {
                                annotationsTool.video.save();
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
                    var labels = category.get("labels"),
                        /**
                         * Recursive function to delete synchronously all labels
                         */
                        destroyLabels = function () {
                            var label;

                            // End state, no more label
                            if (labels.length === 0) {
                                return;
                            }

                            label = labels.at(0);
                            label.destroy({
                                error: function () {
                                    throw "Cannot delete label!";
                                },
                                success: function () {
                                    labels.remove(label);
                                    destroyLabels();
                                }
                            });
                        };
                    // Call the recursive function
                    destroyLabels();
                    category.destroy({
                        success: function () {
                            if (annotationsTool.localStorage) {
                                annotationsTool.video.save();
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
                            if (window.annotationsTool.localStorage) {
                                if (target.collection) {
                                    target.collection.remove(target);
                                }

                                annotationsTool.video.save();
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
                    var scaleValues = scale.get("scaleValues"),
                        /**
                         * Recursive function to delete synchronously all scaleValues
                         */
                        destroyScaleValues = function () {
                            var scaleValue;
                            // End state, no more label
                            if (scaleValues.length === 0) {
                                return;
                            }
                            scaleValue = scaleValues.at(0);
                            scaleValue.destroy({
                                error: function () {
                                    throw "Cannot delete scaleValue!";
                                },
                                success: function () {
                                    scaleValues.remove(scaleValue);
                                    destroyScaleValues();
                                }
                            });
                        };

                    // Call the recursive function
                    destroyScaleValues();

                    scale.destroy({
                        success: function () {
                            if (window.annotationsTool.localStorage) {
                                annotationsTool.video.save();
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

        return annotationsTool;
    }
);
