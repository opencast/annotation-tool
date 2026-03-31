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
        "access",
        "util",
        "i18next",
        "models/video",
        "views/main",
        "views/modal-container",
        "alerts",
        "templates/delete-modal",
        "player-adapter",
        "colors",
        "xlsx",
        "papaparse",
        "filesaver",
        "jquery.colorPicker"
    ],
    function (
        $,
        _,
        Backbone,
        ACCESS,
        util,
        i18next,
        Video,
        MainView,
        ModalContainerView,
        alerts,
        DeleteModalTmpl,
        PlayerAdapter,
        ColorManager,
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
                        alerts.warning(i18next.t("delete operations.unauthorized", { context: type.name }));
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

            /**
             * Initialize the tool
             * @param {module:configuration.Configuration} configuration The tool configuration
             */
            start: function (configuration, integration) {
                _.bindAll(
                    this,
                    "createAnnotation",
                    "fetchData",
                    "importCategories",
                    "importQuestionnaires",
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

                this.addTimeupdateListener(this.updateSelectionOnTimeUpdate, 900);

                this.tracksOrder = [];

                this.freeTextVisible = true;

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

                    this.colorManager = new ColorManager(this.video.get("categories"));
                    $.fn.colorPicker.defaults.colors = ColorManager.COLORS;

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
             * Get all the annotations for the current user
             */
            fetchData: function () {
                this.getVideoParameters().then(_.bind(function (videoParameters) {
                    // If we are using the localstorage
                    this.video = new Video(videoParameters);
                    return this.video.save();
                }, this)).then(undefined, _.bind(function (response) {
                    if (response.status === 403) {
                        alerts.fatal(i18next.t("annotation not allowed"));
                    } else {
                        alerts.fatal(i18next.t("unexpected error"));
                    }
                    return $.Deferred().reject();
                }, this)).then(_.bind(function () {
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
                    }
                    tracks.showTracks(
                        tracks.filter(function (track) {
                            return track.isMine()
                                || track.get("access") === ACCESS.SHARED_WITH_EVERYONE;
                        })
                    );
                    ready.resolve();

                    return ready.then(function () { return tracks; });
                }, this)).then(_.bind(function (tracks) {
                    // At least one private track should exist, we select the first one
                    this.selectedTrack = tracks.filter(util.caller("isMine"))[0];

                    this.modelsInitialized = true;
                    this.trigger(this.EVENTS.MODELS_INITIALIZED);
                }, this));
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
             * Select the given track
             * @param {Object} track the track to select
             */
            selectTrack: function (track) {
                if (track === this.selectedTrack) return;
                var previousTrack = this.selectedTrack;
                this.selectedTrack = track;
                this.video.get("tracks").trigger("select", track, previousTrack);
            },

            /**
             * Switch to different tab in goldenLayout
             * @alias annotationTool.switchTab
             */
            switchTab: function (component_name) {
                // TODO: use MainView instead
                var goldenLayout = annotationTool.views.main.goldenlayout;
                for (var i = 0; i < goldenLayout._getAllContentItems().length; i++) {
                    if (goldenLayout._getAllContentItems()[i].componentName == component_name) {
                        var contentItem = goldenLayout._getAllContentItems()[i];
                        contentItem.parent.setActiveContentItem(contentItem);
                    }
                }
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
                this.tracksOrder = _.chain(this.video.get("tracks").getVisibleTracks())
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
                var categories = annotation.getCategories();
                if (categories.length) {
                    return _.chain(categories)
                        .invoke("get", "visible")
                        .every().value();
                } else {
                    // Free text annotation
                    return annotationTool.freeTextVisible;
                }
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
                        { start: this.playerAdapter.getCurrentTime() },
                        // The loop controller can constrain annotations
                        // to the current loop using this.
                        // @see module:views-loop.Loop#toggleConstrainAnnotations
                        this.annotationConstraints,
                        params
                    ), {
                        wait: true,
                        success: _.bind(function () {
                            this.setSelection(annotation);
                        }, this)
                    });
                return annotation;
            },

            ////////////////
            // IMPORTERs  //
            ////////////////

            /**
             * Import the given categories in the tool
             * @todo CC | Optimize: Extend overrides settings -and- mutates the input. A recursive extend variant would be better.
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

                    var newScale = annotationTool.video.get("scales").create(scale, { async: false });
                    scalesIdMap[scaleOldId] = newScale.get("id");

                    if (scaleValuesToAdd) {
                        _.each(scaleValuesToAdd, function (scaleValue) {
                            scaleValue.scale = newScale;
                            newScale.get("scaleValues").create(scaleValue);
                        });
                    }
                });

                var videoCategories = this.video.get("categories");
                _.each(imported.categories, function (category) {
                    var labelsToAdd = category.labels;

                    category.scale_id = scalesIdMap[category.scale_id];
                    delete category.labels;

                    let attr = _.clone(defaultCategoryAttributes);
                    attr.settings = _.extend({}, attr.settings, category.settings, { hasScale: !!category.scale_id });

                    var newCat = videoCategories.create(_.extend({}, category, attr), { async: false });

                    if (labelsToAdd) {
                        _.each(labelsToAdd, function (label) {
                            label.category = newCat;
                            newCat.get("labels").create(label);
                        });
                    }
                });
            },

            /**
             * Import the given questionnaires in the tool.
             * 1) Enforce array format and flatten, if nested (allows object|array notation to be passed)
             *    Input => Transform => Output example: {} | [{}] => [{}] | [[{}]] => [{}]
             * @param {string} questionnairesRaw String containing raw questionnaire data (assumed: object|array notation)
             * @param {PlainObject|undefined} defaultQuestionnaireAttributes The default attributes to use to insert the imported questionnaires (like access)
             */
            importQuestionnaires: function (questionnairesRaw, defaultQuestionnaireAttributes) {
                if (!questionnairesRaw) {
                    return;
                }

                const questionnaires = JSON.parse("[" + questionnairesRaw + "]").flat(); // 1)
                const videoQuestionnaires = this.video.get("questionnaires");

                // @todo CC | Review: Good solution? Does not seem best-practice to have listener here.
                // Prevent rendering broken data and show error
                this.listenToOnce(videoQuestionnaires, "error", function (model) {
                    videoQuestionnaires.remove(model.cid);

                    throw new Error(i18next.t("import operations.wrong format"));
                });

                _.each(questionnaires, function (questionnaire) {
                    questionnaire.title = questionnaire.prompt;
                    questionnaire.content = {
                        prompt: questionnaire.prompt,
                        schema: questionnaire.schema,
                        form: questionnaire.form
                    };

                    delete questionnaire.prompt;
                    delete questionnaire.schema;
                    delete questionnaire.form;

                    videoQuestionnaires
                        .create(_.extend(questionnaire, defaultQuestionnaireAttributes), { async: false });
                });
            },

            addModal: function (header, contentView, buttonText) {
                var container = new ModalContainerView(
                    {
                        buttonText: buttonText,
                        contentView: contentView,
                        header: header
                    }
                );

                return function closeModal() {
                    container.close();
                };
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

                // Header indexes: 0-4
                addResourceHeaders(header);
                // Header indexes: 5-22
                header.push("Track name"); // 5
                header.push("Leadin");
                header.push("Leadout");
                header.push("Duration");
                header.push("Text");
                header.push("Category name"); // 10
                header.push("Label name");
                header.push("Label abbreviation");
                header.push("Scale name");
                header.push("Scale value name");
                header.push("Scale value value"); // 15
                addResourceHeaders(header, "comment"); // 16-20
                header.push("Comment text");
                header.push("Comment replies to");
                header.push("Type"); // 23
                bookData.push(header);

                _.each(tracks, function (track) {
                    track.annotations.each(function (annotation) {
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

                        addResource(line, annotation, track);

                        _.each(annotation.attributes.content.models, function (content) {
                            addContentLine(line, content);
                        });

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

                function addResource(line, resource, track) {
                    line.push(resource.id);
                    line.push(resource.attributes.created_at.toISOString());
                    line.push(resource.attributes.updated_at.toISOString());
                    line.push(resource.attributes.created_by_nickname);
                    line.push(resource.attributes.created_by_email);

                    line.push(track.attributes.name);
                    line.push(util.formatTime(resource.attributes.start));
                    line.push(util.formatTime(resource.attributes.start + resource.attributes.duration));
                    line.push(util.formatTime(resource.attributes.duration));
                }

                function addCommentLine(line, comment) {
                    var commentLine = [];
                    Array.prototype.push.apply(commentLine, line);

                    commentLine[16] = comment.attributes.id;
                    commentLine[17] = comment.attributes.created_at.toISOString();
                    commentLine[18] = comment.attributes.updated_at.toISOString();
                    commentLine[19] = comment.attributes.updated_by_nickname;
                    commentLine[20] = "";
                    commentLine[21] = comment.attributes.text;

                    if (comment.collection.replyTo) {
                        commentLine[22] = comment.collection.replyTo.id;
                    }

                    commentLine[23] = "comment";

                    bookData.push(commentLine);
                }

                function commentReplies(line, replies) {
                    _.each(replies, function (comment) {
                        addCommentLine(line, comment);

                        commentReplies(line, comment.attributes.replies);
                    });
                }

                function addContentLine(line, content) {
                    var contentLine = [];
                    Array.prototype.push.apply(contentLine, line);

                    var category = content.getCategory();
                    var label = content.getLabel();
                    var scaleValue = content.getScaleValue();

                    contentLine[9] = content.getText();
                    contentLine[10] = category ? category.attributes.name : "";
                    contentLine[11] = label ? label.attributes.value : "";
                    contentLine[12] = label ? label.attributes.abbreviation : "";

                    if (!!scaleValue) {
                        contentLine[13] = scaleValue.collection.scale.get("name");
                        contentLine[14] = scaleValue.attributes.name;
                        contentLine[15] = scaleValue.attributes.value;
                    }

                    contentLine[23] = (scaleValue) ? "content-scale" : "content";

                    bookData.push(contentLine);
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
                    return target.getTitleAttribute();
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
                    if (target.get("series_category_id")) {
                        // TODO: Fix custom message does not output anything
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
            },
            QUESTIONNAIRE: {
                name: "questionnaire",
                getContent: function (target) {
                    return target.get("title");
                },
                destroy: function (questionnaire, callback) {
                    questionnaire.destroy({
                        success: function () {
                            if (callback) {
                                callback();
                            }
                        },
                        error: function (error) {
                            console.warn("Cannot delete questionnaire: " + error);
                        }
                    });
                },
                customMessage: function (target) {}
            }
        };

        return annotationTool;
    }
);
