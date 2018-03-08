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
 * @requires views-login
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
        "views/login",
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
        LoginView,
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
        Backbone
    ) {
        "use strict";

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
             * The player adapter passed during initialization part
             * @alias module:views-main.MainView#playerAdapter
             * @type {playerAdapter}
             */
            playerAdapter: null,

            /**
             * jQuery element for the loading box
             * @alias module:views-main.MainView#loadingBox
             * @type {DOMElement}
             */
            loadingBox: $("div#loading"),

            /**
             * Events to handle by the main view
             * @alias module:views-main.MainView#event
             * @type {Map}
             */
            events: {
                "click #export"              : "export",
                "click #about"               : "about",
                "click #logout"              : "logout",
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
                                "checkUserAndLogin",
                                "createViews",
                                "logout",
                                "onDeletePressed",
                                "onWindowResize",
                                "print",
                                "ready",
                                "setupKeyboardShortcuts",
                                "tracksSelection",
                                "setLoadingProgress");

                this.setLoadingProgress(10, i18next.t("startup.starting"));

                this.setLoadingProgress(20, i18next.t("startup.get users saved locally"));
                // Create a new users collection and get exciting local user
                annotationTool.users = new Users();

                if (annotationTool.localStorage) {
                    // Remove link for statistics exports, work only with backend implementation
                    this.$el.find("#export").parent().remove();
                }

                Backbone.localSync("read", annotationTool.users, {
                    success: function (data) {
                        annotationTool.users.add(data);
                    },
                    error: function (error) {
                        console.warn(error);
                    }
                });

                this.loginView = new LoginView();
                annotationTool.scaleEditor = new ScaleEditorView();

                this.listenTo(annotationTool, "deleteAnnotation", annotationTool.deleteAnnotation);

                annotationTool.onWindowResize = this.onWindowResize;
                $(window).resize(this.onWindowResize);
                $(window).bind("keydown", $.proxy(this.onDeletePressed, this));

                annotationTool.once(annotationTool.EVENTS.READY, function () {
                    this.updateTitle(annotationTool.video);
                    this.tracksSelectionModal = new TracksSelectionView();

                    if (!annotationTool.isFreeTextEnabled()) {
                        $("#opt-annotate-text").parent().hide();
                    }

                    if (!annotationTool.isStructuredAnnotationEnabled()) {
                        $("#opt-annotate-categories").parent().hide();
                    }

                }, this);

                this.checkUserAndLogin();
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
                this.setLoadingProgress(40, i18next.t("startup.creating views"));

                $("#video-container").show();

                this.setLoadingProgress(45, i18next.t("startup.loading video"));

                // Initialize the player
                annotationTool.playerAdapter.load();
                this.setLoadingProgress(50, i18next.t("startup.initializing the player"));

                annotationTool.views.main = this;

                /**
                 * Loading the video dependent views
                 */
                var loadVideoDependentViews = $.proxy(function () {

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

                    this.setLoadingProgress(60, i18next.t("startup.creating views"));

                    // Create views with Timeline
                    this.setLoadingProgress(70, i18next.t("startup.creating timeline"));
                    this.timelineView = new TimelineView({ playerAdapter: annotationTool.playerAdapter });
                    annotationTool.views.timeline = this.timelineView;
                    if (this.layoutConfiguration.timeline) {
                        this.timelineView.$el.show();
                    }

                    this.loopController = new LoopView();
                    annotationTool.loopFunction = this.loopController;
                    if (this.layoutConfiguration.loop) {
                        this.loopController.$el.show();
                    }

                    // Create view to annotate
                    this.setLoadingProgress(80, i18next.t("startup.creating annotation view"));
                    this.annotateView = new AnnotateView({ playerAdapter: annotationTool.playerAdapter });
                    annotationTool.views.annotate = this.annotateView;
                    if (this.layoutConfiguration.annotate) {
                        this.annotateView.$el.show();
                    }

                    // Create annotations list view
                    this.setLoadingProgress(90, i18next.t("startup.creating list view"));
                    this.listView = new ListView();
                    annotationTool.views.list = this.listView;
                    if (this.layoutConfiguration.list) {
                        this.listView.$el.show();
                    }

                    this.ready();
                }, this);


                if (annotationTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) {
                    loadVideoDependentViews();
                } else {
                    $(annotationTool.playerAdapter).one(PlayerAdapter.EVENTS.READY, loadVideoDependentViews);
                }
            },

            /**
             * Function to signal that the tool is ready
             * @alias module:views-main.MainView#ready
             */
            ready: function () {
                this.setLoadingProgress(100, i18next.t("startup.ready"));
                this.loadingBox.hide();
                this.onWindowResize();

                this.setupKeyboardShortcuts();

                // Show logout button
                $("a#logout").css("display", "block");

                if (this.layoutConfiguration.timeline) {
                    this.timelineView.redraw();
                }

                annotationTool.trigger(annotationTool.EVENTS.READY);
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
             * Check if a user is logged into the tool, otherwise display the login modal
             * @alias module:views-main.MainView#checkUserAndLogin
             */
            checkUserAndLogin: function () {
                this.setLoadingProgress(30, i18next.t("startup.get current user"));

                if (annotationTool.modelsInitialized) {
                    this.createViews();
                } else {
                    annotationTool.once(annotationTool.EVENTS.MODELS_INITIALIZED, this.createViews, this);
                }

                // If a user has been saved locally, we take it as current user
                if (annotationTool.users.length > 0) {
                    annotationTool.user = annotationTool.users.at(0);
                    annotationTool.trigger(annotationTool.EVENTS.USER_LOGGED);
                } else {
                    var userExtData = {};
                    if (annotationTool.useUserExtData) {
                        userExtData = annotationTool.getUserExtData();
                    }
                    if (annotationTool.skipLoginFormIfPossible) {
                        try {
                            annotationTool.login(userExtData);
                            return;
                        } catch (error) {
                            console.warn(error);
                        }
                    }
                    this.loginView.show(userExtData);
                }
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
             * @alias module:views-main.MainView#logout
             */
            logout: function () {
                annotationTool.users.each(function (user) {

                    Backbone.localSync("delete", user, {
                        success: function () {
                            console.log("current session destroyed.");
                        },
                        error: function (error) {
                            console.warn(error);
                        }
                    });

                });

                if (annotationTool.logoutUrl) {
                    window.location = annotationTool.logoutUrl;
                } else {
                    window.location.reload();
                }
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
                var listContent,
                    windowHeight = $(window).height(),
                    annotationsContainerHeight = $("#annotate-container").height(),
                    loopFunctionHeight = this.layoutConfiguration.loop
                        ? annotationTool.loopFunction.$el.height() + 180
                        : 145,
                    videoContainerHeight = $("#video-container").height();


                // TODO: improve this part with a better layout management, more generic
                if (this.layoutConfiguration.annotate && this.layoutConfiguration.list) {
                    listContent = this.listView.$el.find("#content-list-scroll");
                    listContent.css("max-height", windowHeight - annotationsContainerHeight - 120);
                }

                if (this.layoutConfiguration.timeline) {
                    this.timelineView.$el.find("#timeline").css("max-height", windowHeight - (videoContainerHeight + loopFunctionHeight));
                }
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
        });
        return MainView;
    }
);
