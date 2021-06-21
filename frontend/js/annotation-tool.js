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
define(
    [
        "jquery",
        "underscore",
        "backbone",
        "util",
        "i18next",
        "collections/videos",
        "views/main",
        "alerts",
        "templates/delete-modal",
        "templates/series-category",
        "player-adapter",
        "colors",
        "xlsx",
        "papaparse",
        "filesaver"
    ],
    function (
        $,
        _,
        Backbone,
        util,
        i18next,
        Videos,
        MainView,
        alerts,
        DeleteModalTmpl,
        SeriesCategoryTmpl,
        PlayerAdapter,
        ColorsManager,
        XLSX,
        PapaParse
    ) {
        "use strict";

        /**
         * The main object of the annotations tool
         * @namespace annotationTool
         */
        var annotationTool = window.annotationTool = _.extend({}, Backbone.Events, {

            EVENTS: {
                ANNOTATION_SELECTION: "at:annotation-selection",
                ACTIVE_ANNOTATIONS: "at:active-annotations",
                ANNOTATE_TOGGLE_EDIT: "at:annotate-switch-edit-modus",
                MODELS_INITIALIZED: "at:models-initialized",
                TIMEUPDATE: "at:timeupdate",
                USER_LOGGED: "at:logged",
                VIDEO_LOADED: "at:video-loaded"
            },

            timeUpdateIntervals: [],

            views: {},

            modelsInitialized: false,

            deleteOperation: {
                /**
                 * Function to delete element with warning
                 *
                 * @param {Object} target Element to be delete
                 * @param {TargetsType} type Type of the target to be deleted
                 */
                start: function (target, type, confirmCallback, closeCallback) {

                    if (!target.isEditable()) {
                        alerts.warning("You are not authorized to deleted this " + type.name + "!");
                        return;
                    }

                    var deleteModal = $(DeleteModalTmpl({
                        context: type.name,
                        content: type.getContent(target),
                        customMessage: type.customMessage ? type.customMessage(target) : ""
                    }));

                    function confirm() {
                        deleteModal.modal("toggle");
                        type.destroy(target, confirmCallback);
                    }
                    function confirmWithEnter(event) {
                        if (event.keyCode === 13) {
                            confirm();
                        }
                    };

                    // Listener for delete confirmation
                    deleteModal.find("#confirm-delete").one("click", confirm);

                    // Add possiblity to confirm with return key
                    $(window).on("keypress", confirmWithEnter);

                    // Unbind the listeners when the modal is hidden
                    deleteModal.one("hide", function () {
                        $(window).off("keypress", confirmWithEnter);
                        deleteModal.remove();
                        if (closeCallback) closeCallback();
                    });

                    // Show the modal
                    deleteModal.modal("show");
                }
            },

            seriesCategoryOperation: {
                /**
                 * Function to delete element with warning
                 *
                 * @param {Object} target Element to be delete
                 * @param {TargetsType} type Type of the target to be deleted
                 */
                start: function (target, categorySeriesCategoryId) {

                    var seriesCategoryModal = $(SeriesCategoryTmpl({
                        context: "HI",
                        content: "BI"
                    }));

                    function confirm() {
                        target.toVideoCategory(categorySeriesCategoryId);
                        seriesCategoryModal.modal("toggle");
                    }
                    function confirmWithEnter(event) {
                        if (event.keyCode === 13) {
                            confirm();
                        }
                    };

                    // Listener for delete confirmation
                    seriesCategoryModal.find("#confirm-delete").one("click", confirm);

                    // Add possiblity to confirm with return key
                    $(window).on("keypress", confirmWithEnter);

                    // Unbind the listeners when the modal is hidden
                    seriesCategoryModal.one("hide", function () {
                        $(window).off("keypress", confirmWithEnter);
                        seriesCategoryModal.remove();
                    });

                    // Show the modal
                    seriesCategoryModal.modal("show");
                }
            },

            /**
             * Initialize the tool
             * @param {module:configuration.Configuration} configuration The tool configuration
             */
            start: function (configuration, integration) {
                _.bindAll(
                    this,
                    "updateSelectionOnTimeUpdate",
                    "createAnnotation",
                    "getAnnotation",
                    "getSelection",
                    "getTrack",
                    "getTracks",
                    "getSelectedTrack",
                    "fetchData",
                    "importCategories",
                    "hasSelection",
                    "onDestroyRemoveSelection",
                    "onTimeUpdate",
                    "selectTrack",
                    "setSelection",
                    "addTimeupdateListener",
                    "removeTimeupdateListener",
                    "updateSelectionOnTimeUpdate"
                );

                _.extend(this, configuration, integration);

                this.deleteOperation.start = _.bind(this.deleteOperation.start, this);
                this.seriesCategoryOperation.start = _.bind(this.seriesCategoryOperation.start, this);

                this.addTimeupdateListener(this.updateSelectionOnTimeUpdate, 900);

                this.tracksOrder = [];

                this.freeTextVisible = true;

                this.colorsManager = new ColorsManager();

                this.listenToOnce(this, this.EVENTS.USER_LOGGED, function () {

                    $("#user-menu-label").html(this.user.get("nickname"));
                    $("#user-menu").show();

                    this.fetchData();
                });

                this.listenToOnce(this, this.EVENTS.MODELS_INITIALIZED, function () {
                    this.listenTo(
                        this.video.get("tracks"),
                        "add remove reset visibility",
                        function () {
                            this.orderTracks(this.tracksOrder);
                        }
                    );
                    this.orderTracks(this.tracksOrder);

                    this.views.main = new MainView();
                });

                this.listenToOnce(this, this.EVENTS.VIDEO_LOADED, function () {

                    if (!(this.playerAdapter instanceof PlayerAdapter)) {
                        throw "The player adapter is not valid! It must have PlayerAdapter as prototype.";
                    }

                    $(this.playerAdapter).on("pa_timeupdate", this.onTimeUpdate);

                    this.playerAdapter.load();
                });

                this.authenticate();
            },

            /**
             * Listen and retrigger timeupdate event from player adapter events with added intervals
             */
            onTimeUpdate: function () {
                var currentPlayerTime = this.playerAdapter.getCurrentTime();
                var currentTime = Date.now();
                var shouldUpdateAll = (
                    _.isUndefined(this.lastTimeUpdate)
                ) || (
                    this.playerAdapter.getStatus() !== PlayerAdapter.STATUS.PLAYING
                ) || (
                    currentTime - this.lastTimeUpdate > 1000
                );

                _.each(this.timeUpdateIntervals, function (interval) {
                    if (shouldUpdateAll || (
                        (currentTime - interval.lastUpdate) > interval.interval
                    )) {
                        this.trigger(
                            this.EVENTS.TIMEUPDATE + ":" + interval.interval,
                            currentPlayerTime
                        );
                        interval.lastUpdate = currentTime;
                    }
                }, this);

                this.lastTimeUpdate = currentTime;
            },

            /**
             * Add a timeupdate listener with the given interval
             * @param {Object} callback the listener callback
             * @param {Number} interval the interval between each timeupdate event
             */
            addTimeupdateListener: function (callback, interval) {
                var timeupdateEvent = this.EVENTS.TIMEUPDATE;

                if (!_.isUndefined(interval)) {
                    timeupdateEvent += ":" + interval;

                    // Check if the interval needs to be added to list
                    if (!_.findWhere(this.timeUpdateIntervals, { interval: interval })) {
                        // Add interval to list
                        this.timeUpdateIntervals.push({
                            interval: interval,
                            lastUpdate: 0
                        });
                    }
                }

                this.listenTo(this, timeupdateEvent, callback);
            },

            /**
             * Remove the given timepudate listener
             * @param {Object} callback the listener callback
             * @param {Number} interval the interval between each timeupdate event
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
             * @param {Object} annotation The destroyed annotation
             */
            onDestroyRemoveSelection: function (annotation) {
                this.setSelection(null);
            },

            /**
             * Set the given annotation(s) as current selection
             * @param {Array} selection The new selection
             * @param {Boolean} noToggle don't toggle already selected annotations
             * @param {any} hint Arbitrary data to pass along the selection event
             */
            setSelection: function (selection, noToggle, hint) {
                if (this.selection) {
                    this.stopListening(this.selection, "destroy", this.onDestroyRemoveSelection);

                    if (selection && this.selection.id === selection.id) {
                        if (noToggle) return;
                        selection = null;
                    }
                } else if (!selection) {
                    // Both selections are `null`, nothing to do
                    return;
                }

                var previousSelection = this.selection;
                this.selection = selection;

                if (this.selection) {
                    this.listenTo(this.selection, "destroy", this.onDestroyRemoveSelection);
                }

                this.trigger(
                    this.EVENTS.ANNOTATION_SELECTION,
                    selection,
                    previousSelection,
                    hint
                );
            },

            /**
             * Returns the current selection of the tool
             * @return {Annotation} The current selection or undefined if no selection.
             */
            getSelection: function () {
                return this.selection;
            },

            /**
             * Informs if there is or not some items selected
             * @return {Boolean} true if an annotation is selected or false.
             */
            hasSelection: function () {
                return !!this.selection;
            },

            /**
             * Update the ordering of the tracks and alert everyone who is interested.
             * @param {Array} order The new track order
             */
            orderTracks: function (order) {
                // convert the new order to string to compare reliably
                var strOrder = order.map(function (item) { return "" + item; });
                //   Make sure every visible track is represented in the order,
                // and only those, with non-explicitly ordered tracks in front.
                this.tracksOrder = _.chain(this.getTracks().getVisibleTracks())
                    .sortBy(function (track) {
                        // convert each track ID to string to reliably compare them
                        return strOrder.indexOf("" + track.id);
                    }, this)
                    .map("id")
                    .value();
                this.trigger("order", this.tracksOrder);
            },

            /**
             * Shows or hides the free text annotations
             */
            toggleFreeTextAnnotations: function () {
                this.freeTextVisible = !this.freeTextVisible;
                this.trigger("togglefreetext", this.freeTextVisible);
            },

            /**
             * Get all annotations that cover a given point in time.
             */
            getCurrentAnnotations: function () {
                return _.chain(this.video.get("tracks").getVisibleTracks())
                    .map(function (track) { return track.annotations.models; })
                    .flatten()
                    .filter(function (annotation) { return annotation.covers(
                        this.playerAdapter.getCurrentTime(),
                        this.MINIMAL_DURATION
                    ); }, this)
                    .value();
            },

            /**
             * Listener for player "timeupdate" event to highlight the current annotations
             */
            updateSelectionOnTimeUpdate: function () {
                var previousAnnotations = this.currentAnnotations || [];
                this.currentAnnotations = this.getCurrentAnnotations();

                if ((
                    this.currentAnnotations.length === previousAnnotations.length
                ) && (
                    !_.difference(this.currentAnnotations, previousAnnotations).length
                )) return;

                this.trigger(
                    this.EVENTS.ACTIVE_ANNOTATIONS,
                    this.currentAnnotations,
                    previousAnnotations
                );
            },

            /**
             * Check whether an annotation should be visible in the current configuration
             */
            isVisible: function (annotation) {
                if (!annotation.collection.track.get("visible")) return false;
                var category = annotation.category();
                if (category && !category.get("visible")) return false;
                if (!category && !annotationTool.freeTextVisible) return false;
                return true;
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
             * @param {Object} params The content of the new annotation
             * @return {Object} The created annotation
             */
            createAnnotation: function (params) {
                var annotation = this.selectedTrack.annotations
                    .create(_.extend(
                        params,
                        { start: this.playerAdapter.getCurrentTime() },
                        // The loop controller can constrain annotations
                        // to the current loop using this.
                        // @see module:views-loop.Loop#toggleConstrainAnnotations
                        this.annotationConstraints
                    ), {
                        wait: true,
                        success: _.bind(function () {
                            this.setSelection(annotation);
                        }, this)
                    });
                return annotation;
            },

            /////////////
            // GETTERs //
            /////////////

            /**
             * Get the track with the given Id
             * @param  {String} id The track Id
             * @return {Object} The track object or undefined if not found
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
             * @return {Object} The list of the tracks
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
             * @param {String} id The track Id
             * @return {Object} The track object or undefined if not found
             */
            getSelectedTrack: function () {
                return this.selectedTrack;
            },

            /**
             * Select the given track
             * @param {Object} track the track to select
             */
            selectTrack: function (track) {
                if (track === this.selectedTrack) return;
                var previousTrack = this.selectedTrack;
                this.selectedTrack = track;
                this.video.get("tracks")
                    .trigger("select", track, previousTrack);
            },

            /**
             * Get the annotation with the given Id
             * @param {String} annotationId The annotation
             * @param {String} trackId The track Id (Optional)
             * @return {Object} The annotation object or undefined if not found
             */
            getAnnotation: function (annotationId, trackId) {

                if (!_.isUndefined(trackId)) {
                    // If the track id is given, we only search for the annotation on it

                    var track = this.getTrack(trackId);

                    if (_.isUndefined(track)) {
                        console.warn("Not able to find the track with the given Id");
                        return undefined;
                    } else {
                        return track.annotations.get(annotationId);
                    }
                } else {
                    // If no trackId present, we search through all tracks

                    if (_.isUndefined(this.video)) {
                        console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                        return undefined;
                    } else {
                        var annotation;
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
             * @param {String} trackId The track Id (Optional)
             * @return {Array} The annotations
             */
            getAnnotations: function (trackId) {
                if (_.isUndefined(this.video)) {
                    console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                    return [];
                } else {
                    if (!_.isUndefined(trackId)) {
                        var track = this.getTrack(trackId);
                        if (!_.isUndefined(track)) {
                            return track.annotations.toArray();
                        }
                    } else {
                        var tracks = this.video.get("tracks");
                        tracks.each(function (t) {
                            return _.union(annotations, t.annotations.toArray());
                        }, this);
                    }
                }
            },

            ////////////////
            // IMPORTERs  //
            ////////////////

            /**
             * Import the given categories in the tool
             * @param {PlainObject} imported Object containing the .categories and .scales to insert in the tool
             * @param {PlainObject} defaultCategoryAttributes The default attributes to use to insert the imported categories (like access)
             */
            importCategories: function (imported, defaultCategoryAttributes) {

                if (!imported.categories || imported.categories.length === 0) {
                    return;
                }

                var scalesIdMap = {};

                _.each(imported.scales, function (scale) {
                    var scaleOldId = scale.id;
                    var scaleValuesToAdd = scale.scaleValues;
                    delete scale.id;
                    delete scale.scaleValues;

                    var newScale = this.video.get("scales").create(scale, { async: false });
                    scalesIdMap[scaleOldId] = newScale.get("id");

                    if (scaleValuesToAdd) {
                        _.each(scaleValuesToAdd, function (scaleValue) {
                            scaleValue.scale = newScale;
                            newScale.get("scaleValues").create(scaleValue);
                        });
                    }
                });

                _.each(imported.categories, function (category) {
                    var labelsToAdd = category.labels;
                    category.scale_id = scalesIdMap[category.scale_id];
                    delete category.labels;
                    var newCat = this.video.get("categories")
                        .create(_.extend(category, defaultCategoryAttributes), { async: false });

                    if (labelsToAdd) {
                        _.each(labelsToAdd, function (label) {
                            label.category = newCat;
                            newCat.get("labels").create(label);
                        });
                    }
                });
            },

            /**
             * Get all the annotations for the current user
             */
            fetchData: function () {
                $.when(this.getVideoExtId(), this.getVideoParameters()).then(
                    _.bind(function (videoExtId, videoParameters) {
                        // If we are using the localstorage
                        var video = new Videos().add({ video_extid: videoExtId }).at(0);
                        this.video = video;
                        video.set(videoParameters);
                        video.save(null, {
                            error: _.bind(function (model, response, options) {
                                if (response.status === 403) {
                                    alerts.fatal(i18next.t("annotation not allowed"));
                                    this.views.main.loadingBox.hide();
                                }
                            }, this)
                        });
                        var ready = $.Deferred();
                        this.listenToOnce(video, "ready", function () {
                            ready.resolve();
                        });
                        return ready;
                    }, this)
                ).then(_.bind(function () {
                    var tracks = this.video.get("tracks");

                    var ready = $.Deferred();
                    if (!tracks.filter(util.caller("isMine")).length) {
                        tracks.create({
                            name: i18next.t("default track.name", {
                                nickname: this.user.get("nickname")
                            }),
                            description: i18next.t("default track.description", {
                                nickname: this.user.get("nickname")
                            })
                        }, {
                            wait: true,
                            success: function () { ready.resolve(); }
                        });
                    } else {
                        tracks.showTracks(
                            tracks.filter(util.caller("isMine"))
                        );
                        ready.resolve();
                    }
                    return ready.then(function () { return tracks; });
                }, this)).then(_.bind(function (tracks) {
                    // At least one private track should exist, we select the first one
                    this.selectedTrack = tracks.filter(util.caller("isMine"))[0];

                    this.modelsInitialized = true;
                    this.trigger(this.EVENTS.MODELS_INITIALIZED);
                }, this));
            },

            ////////////////
            // Exporters  //
            ////////////////

            /**
             * Offer the user a spreadsheet version of the annotations for download.
             * @param {Track[]} tracks The tracks to include in the export
             * @param {Category[]} categories The tracks to include in the export
             * @param {Boolean} freeText Should free-text annotations be exported?
             */
            exportCSV: function (tracks, categories, freeText) {
                var bookData = this.gatherExportData(tracks, categories, freeText);
                var csv = PapaParse.unparse(JSON.stringify(bookData));
                saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "export.csv");
            },

            /**
             * Offer the user an excel version of the annotations for download.
             * @param {Track[]} tracks The tracks to include in the export
             * @param {Category[]} categories The tracks to include in the export
             * @param {Boolean} freeText Should free-text annotations be exported?
             */
            exportXLSX: function (tracks, categories, freeText) {
                var bookData = this.gatherExportData(tracks, categories, freeText);

                // Generate workbook
                var wb = XLSX.utils.book_new();
                wb.SheetNames.push("Sheet 1");

                // Generate worksheet
                var ws = XLSX.utils.aoa_to_sheet(bookData);

                // Scale column width to content (which is apparently non built-in in SheetJS)
                var objectMaxLength = [];

                bookData.forEach(function (arr) {
                    Object.keys(arr).forEach(function (key) {
                        var value = arr[key] || "";

                        // Arbitrarily increase len by one to avoid cases where just len would
                        // lead to too small columns
                        var len = value.toString().length + 1;

                        objectMaxLength[key] = Math.max(objectMaxLength[key] || 0, len);
                    });
                });

                var worksheetCols = objectMaxLength.map(function (width) {
                    return { width: width };
                });

                ws["!cols"] = worksheetCols;

                // Put worksheet
                wb.Sheets["Sheet 1"] = ws;

                // Export workbook
                var wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

                function s2ab(s) {
                    var buf = new ArrayBuffer(s.length); // convert s to arrayBuffer
                    var view = new Uint8Array(buf); // create uint8array as viewer
                    for (var i = 0; i < s.length; i++) {
                        view[i] = s.charCodeAt(i) & 0xFF; // convert to octet
                    }
                    return buf;
                }

                saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "export.xlsx");
            },

            gatherExportData: function (tracks, categories, freeText) {
                var bookData = [];
                var header = [];
                addResourceHeaders(header);
                header.push("Track name");
                header.push("Leadin");
                header.push("Leadout");
                header.push("Duration");
                header.push("Text");
                header.push("Category name");
                header.push("Label name");
                header.push("Label abbreviation");
                header.push("Scale name");
                header.push("Scale value name");
                header.push("Scale value value");
                addResourceHeaders(header, "comment");
                header.push("Comment text");
                header.push("Comment replies to");
                bookData.push(header);

                _.each(tracks, function (track) {
                    _.each(annotationTool.getAnnotations(track.id), function (annotation) {
                        var line = [];

                        var label = annotation.attributes.label;
                        // Exclude annotations that are currently not visible
                        if (label) {
                            if (categories && !categories.map(function (category) {
                                return category.id;
                            }).includes(label.category.id)) return;
                        } else {
                            if (!freeText) return;
                        }

                        addResource(line, annotation);
                        line.push(track.attributes.name);

                        line.push(util.formatTime(annotation.attributes.start));
                        line.push(util.formatTime(annotation.attributes.start + annotation.attributes.duration));
                        line.push(util.formatTime(annotation.attributes.duration));
                        line.push(annotation.attributes.text);

                        if (label) {
                            line.push(label.category.name);
                            line.push(label.value);
                            line.push(label.abbreviation);
                        } else {
                            line.push("");
                            line.push("");
                            line.push("");
                        }

                        if (annotation.attributes.scalevalue) {
                            line.push(annotation.attributes.scalevalue.scale.name);
                            line.push(annotation.attributes.scalevalue.name);
                            line.push(annotation.attributes.scalevalue.value);
                        } else {
                            line.push("");
                            line.push("");
                            line.push("");
                        }

                        bookData.push(line);

                        _.each(annotation.attributes.comments.models, function (comment) {
                            addCommentLine(line, comment);

                            if (comment.replies.length > 0) {
                                commentReplies(line, comment.replies.models);
                            }
                        });

                    });
                });

                return bookData;

                function addResourceHeaders(header, presuffix) {
                    if (presuffix == null) presuffix = "";
                    var prefix = "";
                    var suffix = "";
                    if (presuffix) {
                        prefix = presuffix + " ";
                        suffix = " of " + presuffix;
                    }
                    header.push(util.capitalize(prefix + "ID"));
                    header.push(util.capitalize(prefix + "Creation date"));
                    header.push(util.capitalize("Last update" + suffix));
                    header.push(util.capitalize(prefix + "Author nickname"));
                    header.push(util.capitalize(prefix + "Author mail"));
                }

                function addResource(line, resource) {
                    line.push(resource.id);
                    line.push(resource.attributes.created_at.toISOString());
                    line.push(resource.attributes.updated_at.toISOString());
                    line.push(resource.attributes.created_by_nickname);
                    line.push(resource.attributes.created_by_email);
                }

                function addCommentLine(line, comment) {
                    var commentLine = [];
                    Array.prototype.push.apply(commentLine, line);

                    addResource(commentLine, comment);

                    commentLine.push(comment.attributes.text);
                    if (comment.collection.replyTo) {
                        commentLine.push(comment.collection.replyTo.id);
                    } else {
                        commentLine.push("");
                    }

                    bookData.push(commentLine);
                }

                function commentReplies(line, replies) {
                    _.each(replies, function (comment) {
                        addCommentLine(line, comment);

                        commentReplies(line, comment.attributes.replies);
                    });
                }
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
                    if (track === annotationTool.selectedTrack) {
                        annotationTool.selectTrack(null);
                    }
                    _.invoke(
                        _.clone(track.annotations.models),
                        "destroy",
                        { error: function () { throw "cannot delete annotation"; } }
                    );
                    track.destroy({
                        success: function () {
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
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete category: " + error);
                        }
                    });
                },
                customMessage: function (target) {
                    if (target.get("seriesCategoryId")) {
                        return i18next.t("series category modal.custom message");
                    } else {
                        return "";
                    }
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
                        _.clone(scale.get("scaleValues").models),
                        "destroy",
                        { error: function () { throw "cannot delete scale value"; } }
                    );
                    scale.destroy({
                        success: function () {
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
