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
 * A module representing the main view
 * @module views-main
 * @requires jquery
 * @requires underscore
 * @requires mousetrap
 * @requires i18next
 * @requires player-adapter
 * @requires collections-annotations
 * @requires views-annotate
 * @requires views-list
 * @requires views-timeline
 * @requires views-loop
 * @requires views-scale-editor
 * @requires models-user
 * @requires models-track
 * @requires models-video
 * @requires roles
 * @requires filters-manager
 * @requires backbone
 * @requires localstorage
 * @requires bootstrap
 */
define(["jquery",
        "underscore",
        "mousetrap",
        "i18next",
        "player-adapter",
        "views/about",
        "views/annotate",
        "views/list",
        "views/list-annotation",
        "views/timeline",
        "views/loop",
        "views/scale-editor",
        "views/tracks-selection",
        "views/print",
        "collections/annotations",
        "collections/users",
        "collections/videos",
        "models/user",
        "models/track",
        "models/video",
        "roles",
        "backbone",
        "goldenlayout",
        "handlebars",
        "localstorage",
        "bootstrap"],

    function (
        $,
        _,
        Mousetrap,
        i18next,
        PlayerAdapter,
        AboutDialog,
        AnnotateView,
        ListView,
        ListAnnotationView,
        TimelineView,
        LoopView,
        ScaleEditorView,
        TracksSelectionView,
        PrintView,
        Annotations,
        Users,
        Videos,
        User,
        Track,
        Video,
        ROLES,
        Backbone,
        GoldenLayout
    ) {
        "use strict";

        var goldenLayout;

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-main
         * @alias module:views-main.MainView
         */
        var MainView = Backbone.View.extend({

            /**
             * Main container of the appplication
             * @alias module:views-main.MainView#el
             * @type {DOMElement}
             */
            el: $("body"),

            /**
             * jQuery element for the loading box
             * @alias module:views-main.MainView#loadingBox
             * @type {DOMElement}
             */
            loadingBox: $("#loading"),

            /**
             * Events to handle by the main view
             * @alias module:views-main.MainView#event
             * @type {Map}
             */
            events: {
                "click #export"              : "export",
                "click #about"               : "about",
                "click #logout"              : "onLogout",
                "click #print"               : "print",
                "click .opt-layout"          : "layoutUpdate",
                "click .opt-tracks-select"   : "tracksSelection",
                "click #opt-auto-expand"     : "toggleAutoExpand"
            },

            /**
             * Constructor
             * @alias module:views-main.MainView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function () {
                _.bindAll(this, "layoutUpdate",
                                "createViews",
                                "onDeletePressed",
                                "onWindowResize",
                                "print",
                                "ready",
                                "setupKeyboardShortcuts",
                                "tracksSelection",
                                "setLoadingProgress");

                this.setLoadingProgress(10, i18next.t("startup.starting"));

                this.setLoadingProgress(20, i18next.t("startup.get users saved locally"));

                if (annotationTool.localStorage) {
                    // Remove link for statistics exports, work only with backend implementation
                    this.$el.find("#export").parent().remove();
                }

                annotationTool.scaleEditor = new ScaleEditorView();

                this.listenTo(annotationTool, "deleteAnnotation", annotationTool.deleteAnnotation);

                $(window).bind("keydown", $.proxy(this.onDeletePressed, this));

                this.once(MainView.EVENTS.READY, function () {
                    this.updateTitle(annotationTool.video);
                    this.tracksSelectionModal = new TracksSelectionView();

                    if (!annotationTool.isFreeTextEnabled()) {
                        $("#opt-annotate-text").parent().hide();
                    }

                    if (!annotationTool.isStructuredAnnotationEnabled()) {
                        $("#opt-annotate-categories").parent().hide();
                    }

                }, this);
                this.createViews();
            },

            /**
             * Updates the title of the page to reflect the video title
             * @param  {object} video The video model
             * @alias module:views-main.MainView#updateTitle
             */
            updateTitle: function (video) {
                this.$el.find("#video-title").text(video.get("title") || i18next.t("untitled video"));
            },

            /**
             * Creates the views for the annotations
             * @alias module:views-main.MainView#createViews
             */
            createViews: function () {

                this.layoutConfiguration = _.clone(annotationTool.getLayoutConfiguration());
                for (var view in this.layoutConfiguration) {
                    this.$el.find("#opt-view-" + view).each(_.bind(function (index, element) {
                        if (this.layoutConfiguration[view]) {
                            $(element).addClass("checked");
                        } else {
                            $(element).removeClass("checked");
                        }
                    }, this));
                }

                /**
                 * Loading the video dependent views
                 */
                var loadVideoDependentViews = _.bind(function () {

                    var layout = goldenLayout.root.contentItems[0];

                    layout.addChild({
                        type: "column",
                        content: [{
                            type: "component",
                            componentName: "annotate",
                            title: i18next.t("views.annotate")
                        }, {
                            type: "component",
                            componentName: "list",
                            title: i18next.t("views.list")
                        }]
                    });

                    var leftColumn = layout.contentItems[0];
                    leftColumn.addChild({
                        type: "component",
                        componentName: "timeline",
                        title: i18next.t("views.timeline"),
                        isClosable: false
                    });
                    leftColumn.addChild({
                        type: "component",
                        componentName: "loop",
                        title: i18next.t("views.loop")
                    });

                    this.setLoadingProgress(60, i18next.t("startup.creating views"));

                    this.ready();
                }, this);

                this.setLoadingProgress(40, i18next.t("startup.creating views"));

                // Get a reference to the calling object for use in closures.
                // Note that `bind`- and `proxy`-like things do not work with GoldenLayout
                // since it calls its component factories as constructors.
                // The curious shall meditate on the following example:
                //
                //     var Foo = _.bind(function () { console.log(this.foo); }, { foo: 42 });
                //     var foo = new Foo();
                //
                var self = this;
                goldenLayout = new GoldenLayout({
                    // Since most of the views depend on the player,
                    // we initially only create that view
                    // and add the others dynamically later,
                    // once the video has loaded.
                    content: [{
                        type: "row",
                        content: [{
                            type: "column",
                            content: [{
                                type: "component",
                                componentName: "player",
                                title: i18next.t("views.player"),
                                isClosable: false
                            }]
                        }]
                    }]
                }, document.getElementById("main-container"));

                goldenLayout.registerComponent("player", function (container, componentState) {

                    container.on("resize", function () {
                        annotationTool.playerAdapter.resetSize();
                    });

                    annotationTool.once(annotationTool.EVENTS.VIDEO_LOADED, function () {
                        if (annotationTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) {
                            loadVideoDependentViews();
                        } else {
                            $(annotationTool.playerAdapter).one(PlayerAdapter.EVENTS.READY, loadVideoDependentViews);
                        }
                    });

                    self.setLoadingProgress(50, i18next.t("startup.loading video"));

                    annotationTool.loadVideo(container.getElement()[0]);
                });

                goldenLayout.registerComponent("annotate", function (container, componentState) {
                    self.annotateView = annotationTool.views.annotate =
                        new AnnotateView({
                            playerAdapter: annotationTool.playerAdapter,
                            el: container.getElement()
                        });
                });

                goldenLayout.registerComponent("list", function (container, componentState) {
                    self.listView = annotationTool.views.list =
                        new ListView({ el: container.getElement() });
                });

                goldenLayout.registerComponent("timeline", function (container, componentState) {
                    container.on("resize", function () {
                        self.timelineView.onWindowResize();
                    });

                    self.timelineView = annotationTool.views.timeline =
                        new TimelineView({
                            el: container.getElement(),
                            playerAdapter: annotationTool.playerAdapter
                        });
                });

                goldenLayout.registerComponent("loop", function (container, componentState) {
                    self.loopController = annotationTool.loopFunction =
                        new LoopView({
                            el: container.getElement(),
                            playerAdapter: annotationTool.playerAdapter,
                            timeline: annotationTool.views.timeline
                        });
                });

                this.setLoadingProgress(50, i18next.t("startup.initializing the player"));
                goldenLayout.init();
            },

            /**
             * Function to signal that the tool is ready
             * @alias module:views-main.MainView#ready
             */
            ready: function () {
                this.setLoadingProgress(100, i18next.t("startup.ready"));
                this.loadingBox.hide();
                this.onWindowResize();
                $(window).resize(this.onWindowResize);

                this.setupKeyboardShortcuts();

                // Show logout button
                $("#logout").css("display", "block");

                this.trigger(MainView.EVENTS.READY);
            },

            /**
             * Initialize global keyboard shortcuts
             * @alias module:views-main.MainView#setupKeyboardShortcuts
             */
            setupKeyboardShortcuts: function () {

                var setActiveAnnotationDuration = _.bind(function () {
                    if (!annotationTool.activeAnnotation) return;

                    var currentTime = annotationTool.playerAdapter.getCurrentTime();
                    var start = annotationTool.activeAnnotation.get("start");
                    annotationTool.activeAnnotation.set("duration", currentTime - start);
                    annotationTool.activeAnnotation.save();
                }, this);

                var addComment = _.bind(function () {
                    if (!annotationTool.activeAnnotation) return;
                    var annotationView = this.listView.getViewFromAnnotation(
                        annotationTool.activeAnnotation.get("id")
                    );
                    annotationView.toggleCommentsState();
                    var wasPlaying = annotationTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PLAYING;
                    annotationTool.playerAdapter.pause();
                    annotationView.once("cancel", function () {
                        if (wasPlaying) {
                            annotationTool.playerAdapter.play();
                        }
                    });
                }, this);

                Mousetrap.bind('.', setActiveAnnotationDuration);
                Mousetrap.bind('r', function (event) {
                    // We prevent the default behavior, i.e. inserting the letter "r", here,
                    // because otherwise the newly created comment would be prepopulated with,
                    // well, an "r".
                    event.preventDefault();
                    addComment();
                });
            },

            /**
             * The about dialog
             * @alias module:views-main.MainView#aboutDialog
             */
            aboutDialog: new AboutDialog(),

            /**
             * Offer the user a spreadsheet version of the annotations for download.
             * @alias module:views-main.Main#export
             */
            export: function () {
                var tracksToExport = annotationTool.video.get("tracks").getVisibleTracks();
                var categoriesToExport = annotationTool.video.get("categories").filter(function (category) {
                    return category.get("visible");
                });
                annotationTool.export(annotationTool.video, tracksToExport, categoriesToExport);
            },

            /**
             * Show a dialog with information about the tool
             * @alias module:views-main.MainView#about
             */
            about: function () {
                this.aboutDialog.show();
            },

            /**
             * Logout from the tool
             * @alias module:views-main.MainView#onLogout
             */
            onLogout: function () {
                annotationTool.logout();
            },

            /**
             * Print the annotations
             * @alias module:views-main.MainView#print
             */
            print: function () {
                window.focus();
                if (document.readyState === "complete") {
                    var printView = new PrintView(annotationTool);
                    printView.render();
                    window.print();
                    printView.remove();

                    // If is Chrome, we need to refresh the window
                    // TODO WHY??!?!
                    if (/chrome/i.test(navigator.userAgent)) {
                        document.location.reload(false);
                    }
                } else {
                    setTimeout(this.print, 1000);
                }
            },

            /**
             * Show the track management dialog
             * @alias module:views-main.MainView#tracksSelection
             */
            tracksSelection: function (event) {
                this.tracksSelectionModal.show();
            },

            /**
             * Set the layout of the tools following the option selected in the menu
             * @alias module:views-main.MainView#layoutUpdate
             */
            layoutUpdate: function (event) {
                var enabled = !$(event.target).hasClass("checked"),
                    layoutElement = event.currentTarget.id.replace("opt-", ""),
                    checkMainLayout = _.bind(function () {
                        if (!this.layoutConfiguration.annotate && !this.layoutConfiguration.list) {
                            $("#left-column").removeClass("span6");
                            $("#left-column").addClass("span12");
                        } else {
                            $("#left-column").addClass("span6");
                            $("#left-column").removeClass("span12");
                        }
                        annotationTool.views.timeline.redraw();
                    }, this);

                if (enabled) {
                    $(event.target).addClass("checked");
                } else {
                    $(event.target).removeClass("checked");
                }

                var isView = false;
                var view = layoutElement.replace(/^view-/, function () { isView = true; return ""; });
                if (isView) this.layoutConfiguration[view] = enabled;

                switch (layoutElement) {

                case "annotate-text":
                    this.annotateView.enableFreeTextLayout(enabled);
                    break;
                case "annotate-categories":
                    this.annotateView.enableCategoriesLayout(enabled);
                    break;
                case "view-annotate":
                    annotationTool.views.annotate.$el.fadeToggle();
                    checkMainLayout();
                    break;
                case "view-list":
                    annotationTool.views.list.$el.fadeToggle();
                    checkMainLayout();
                    break;
                case "view-loop":
                    annotationTool.loopFunction.$el.fadeToggle();
                    break;
                }
                this.onWindowResize();
            },

            /**
             * Toggle the automatic expanding/collapsing of the annotations relevant to the current player time
             * @alias module:views-main.MainView#toggleAutoExpand
             */
            toggleAutoExpand: function (event) {
                $(event.currentTarget).toggleClass("checked");
                annotationTool.autoExpand = !annotationTool.autoExpand;
            },

            /**
             * Annotation through the "<-" key
             * @alias module:views-main.MainView#onDeletePressed
             * @param  {Event} event Event object
             */
            onDeletePressed: function (event) {
                var annotation;

                if (event.keyCode !== 8 ||
                    document.activeElement.tagName.toUpperCase() === "TEXTAREA" ||
                    document.activeElement.tagName.toUpperCase() === "INPUT" ||
                    !annotationTool.hasSelection()) {
                    return;
                } else {
                    event.preventDefault();

                    annotation = annotationTool.getSelection()[0];
                    if (annotation) {
                        annotationTool.trigger("deleteAnnotation", annotation.get("id"), annotation.trackId);
                    }
                }
            },

            /**
             * Delete the annotation with the given id with the track with the given track id
             * @alias module:views-main.MainView#deleteAnnotation
             * @param {integer} annotationId The id of the annotation to delete
             * @param {integer} trackId Id of the track containing the annotation
             */
            deleteAnnotation: function (annotationId, trackId) {
                var annotation;

                if (typeof trackId === "undefined") {
                    annotationTool.video.get("tracks").each(function (track) {
                        if (track.get("annotations").get(annotationId)) {
                            trackId = track.get("id");
                        }
                    });
                }

                annotation = annotationTool.video.getAnnotation(annotationId, trackId);

                if (annotation) {
                    annotationTool.deleteOperation.start(annotation, annotationTool.deleteOperation.targetTypes.ANNOTATION);
                } else {
                    console.warn("Not able to find annotation %i on track %i", annotationId, trackId);
                }
            },

            /**
             * Listener for window resizing
             * @alias module:views-main.MainView#onWindowResize
             */
            onWindowResize: function () {
                goldenLayout.updateSize();
            },

            /**
             * Update loading box with given percent & message
             * @alias module:views-main.MainView#setLoadingProgress
             * @param {integer} percent loaded of the tool
             * @param {string} current loading operation message
             */
            setLoadingProgress: function (percent, message) {
                this.loadingPercent = percent;

                this.loadingBox.find(".bar").width(this.loadingPercent + "%");
                this.loadingBox.find(".info").text(message);
            }
        }, {
            EVENTS: {
                READY: "ready"
            }
        });
        return MainView;
    }
);
