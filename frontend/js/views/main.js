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
 * @requires jQuery
 * @requires prototype-player_adapter
 * @requires collections-annotations
 * @requires views-annotate
 * @requires views-list
 * @requires views-timeline
 * @requires views-login
 * @requires views-scale-editor
 * @requires models-user
 * @requires models-track
 * @requires models-video
 * @requires backbone-annotations-sync
 * @requires roles
 * @requires filters-manager
 * @requires backbone
 * @requires localstorage
 * @requires bootstrap
 * @requires bootstrap.carousel
 * @requires boutstrap.tab
 */
define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "views/annotate",
        "views/list",
        "views/list-annotation",
        "views/timeline",
        "views/login",
        "views/scale-editor",
        "views/tracks-selection",
        "collections/annotations",
        "collections/users",
        "collections/videos",
        "models/user",
        "models/track",
        "models/video",
        "templates/categories-legend",
        "roles",
        "backbone",
        "handlebars",
        "localstorage",
        "bootstrap",
        "carousel",
        "tab"],

    function ($, _, PlayerAdapter, AnnotateView, ListView, ListAnnotationView, TimelineView, LoginView, ScaleEditorView, TracksSelectionView,
              Annotations, Users, Videos, User, Track, Video, CategoriesLegendTmpl, ROLES, Backbone) {

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
             * Template for the categories legend
             * @alias module:views-main.MainView#categoriesLegendTmpl
             * @type {HandlebarsTemplate}
             */
            categoriesLegendTmpl: CategoriesLegendTmpl,


            /**
             * Events to handle by the main view
             * @alias module:views-main.MainView#event
             * @type {Map}
             */
            events: {
                "click #logout"              : "logout",
                "click #print"               : "print",
                "click .opt-layout"          : "layoutUpdate",
                "click [class*='opt-tracks']": "tracksSelection",
                "keydown"                    : "setActiveAnnotationDelay"
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
                                "generateCategoriesLegend",
                                "logout",
                                "loadPlugins",
                                "onDeletePressed",
                                "onWindowResize",
                                "print",
                                "ready",
                                "tracksSelection",
                                "setLoadingProgress",
                                "updateTitle");
                var self = this;

                annotationsTool.bind(annotationsTool.EVENTS.NOTIFICATION, function (message) {
                    self.setLoadingProgress(this.loadingPercent, message);
                }, this);

                this.setLoadingProgress(10, "Starting tool.");


                this.setLoadingProgress(20, "Get users saved locally.");
                // Create a new users collection and get exciting local user
                annotationsTool.users = new Users();

                if (annotationsTool.localStorage) {
                    // Remove link for statistics exports, work only with backend implementation
                    this.$el.find("#export").parent().remove();
                } else {
                    this.$el.find("#export").attr("href", annotationsTool.exportUrl);
                }

                Backbone.localSync("read", annotationsTool.users, {
                    success: function (data) {
                        annotationsTool.users.add(data);
                    },
                    error: function (error) {
                        console.warn(error);
                    }
                });

                this.loginView              = new LoginView();
                annotationsTool.scaleEditor = new ScaleEditorView();

                this.listenTo(annotationsTool, "deleteAnnotation", annotationsTool.deleteAnnotation);

                annotationsTool.onWindowResize = this.onWindowResize;
                $(window).resize(this.onWindowResize);
                $(window).bind("keydown", $.proxy(this.onDeletePressed, this));

                annotationsTool.once(annotationsTool.EVENTS.READY, function () {
                    this.loadPlugins(annotationsTool.plugins);
                    this.generateCategoriesLegend(annotationsTool.video.get("categories").toExportJSON(true));
                    this.updateTitle(annotationsTool.video);

                    if (!annotationsTool.isFreeTextEnabled()) {
                        $("#opt-annotate-text").parent().hide();
                    }

                    if (!annotationsTool.isStructuredAnnotationEnabled()) {
                        $("#opt-annotate-categories").parent().hide();
                    }

                }, this);

                this.$el.find(".opt-tracks-" + annotationsTool.getDefaultTracks().name).addClass("checked");

                this.checkUserAndLogin();
            },

            /**
             * Loads the given plugins
             * @param  {Array} plugins The array of plugins to load
             * @alias module:views-main.MainView#loadPlugins
             */
            loadPlugins: function (plugins) {
                _.each(plugins, function (plugin) {
                    plugin();
                }, this);
            },

            /**
             * Updates the title of the page for print mode
             * @param  {object} video The video model
             * @alias module:views-main.MainView#updateTitle
             */
            updateTitle: function (video) {
                this.$el.find("#video-title").html(video.get("title"));
                this.$el.find("#video-owner").html("Owner: " + video.get("src_owner"));
                if (_.isUndefined(video.get("src_creation_date"))) {
                    this.$el.find("#video-date").remove();
                } else {
                    this.$el.find("#video-date").html("Date: " + video.get("src_creation_date"));
                }
            },

            /**
             * Generates the legend for all the categories (for printing)
             * @param  {array} categories The array containing all the categories
             * @alias module:views-main.MainView#generateCategoriesLegend
             */
            generateCategoriesLegend: function (categories) {
                this.$el.find("#categories-legend").html(this.categoriesLegendTmpl(categories));
            },

            /**
             * Creates the views for the annotations
             * @alias module:views-main.MainView#createViews
             */
            createViews: function () {
                this.setLoadingProgress(40, "Start creating views.");

                $("#video-container").show();

                this.setLoadingProgress(45, "Start loading video.");

                // Initialize the player
                annotationsTool.playerAdapter.load();
                this.setLoadingProgress(50, "Initializing the player.");

                annotationsTool.views.main = this;
                
                /**
                 * Loading the video dependant views
                 */
                var loadVideoDependantView = $.proxy(function () {

                    if (this.loadingPercent === 100) {
                        return;
                    }

                    this.setLoadingProgress(60, "Start creating views.");

                    if (annotationsTool.getLayoutConfiguration().timeline) {
                        // Create views with Timeline
                        this.setLoadingProgress(70, "Creating timeline.");
                        this.timelineView = new TimelineView({playerAdapter: annotationsTool.playerAdapter});
                        annotationsTool.views.timeline = this.timelineView;
                    }

                    if (annotationsTool.getLayoutConfiguration().annotate) {
                        // Create view to annotate
                        this.setLoadingProgress(80, "Creating annotate view.");
                        this.annotateView = new AnnotateView({playerAdapter: annotationsTool.playerAdapter});
                        this.listenTo(this.annotateView, "change-layout", this.onWindowResize);
                        this.annotateView.$el.show();
                        annotationsTool.views.annotate = this.annotateView;
                    }

                    if (annotationsTool.getLayoutConfiguration().list) {
                        // Create annotations list view
                        this.setLoadingProgress(90, "Creating list view.");
                        this.listView = new ListView();
                        this.listenTo(this.listView, "change-layout", this.onWindowResize);
                        this.listView.$el.show();
                        annotationsTool.views.list = this.listView;
                    }

                    this.ready();
                }, this);


                if (annotationsTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) {
                    loadVideoDependantView();
                } else {
                    $(annotationsTool.playerAdapter).one(PlayerAdapter.EVENTS.READY + " " + PlayerAdapter.EVENTS.PAUSE, loadVideoDependantView);
                }
                
            },

            /**
             * Function to signal that the tool is ready
             * @alias module:views-main.MainView#ready
             */
            ready: function () {
                this.setLoadingProgress(100, "Ready.");
                this.loadingBox.hide();
                this.onWindowResize();

                // Show logout button
                $("a#logout").css("display", "block");

                if (annotationsTool.getLayoutConfiguration().timeline) {
                    this.timelineView.redraw();
                }

                annotationsTool.trigger(annotationsTool.EVENTS.READY);
            },

            /**
             * Check if a user is logged into the tool, otherwise display the login modal
             * @alias module:views-main.MainView#checkUserAndLogin
             */
            checkUserAndLogin: function () {
                this.setLoadingProgress(30, "Get current user.");

                if (!annotationsTool.modelsInitialized) {
                    annotationsTool.once(annotationsTool.EVENTS.MODELS_INITIALIZED, this.createViews, this);
                }

                // If a user has been saved locally, we take it as current user
                if (annotationsTool.users.length > 0) {
                    annotationsTool.user = annotationsTool.users.at(0);

                    annotationsTool.trigger(annotationsTool.EVENTS.USER_LOGGED);

                    if (annotationsTool.modelsInitialized) {
                        this.createViews();
                    }
                } else {
                    var userExtData = {};
                    if (annotationsTool.useUserExtData) {
                        userExtData = annotationsTool.getUserExtData();
                    }
                    if (annotationsTool.skipLoginFormIfPossible) {
                        try {
                            annotationsTool.login(userExtData);
                            return;
                        } catch (error) {
                            console.warn(error);
                        }
                    }
                    this.loginView.show(userExtData);
                }
            },

            /**
             * Logout from the tool
             * @alias module:views-main.MainView#logout
             */
            logout: function () {
                // Stop the video
                annotationsTool.playerAdapter.pause();

                 // Hide logout button
                $("a#logout").hide();

                // Hide/remove the views
                annotationsTool.playerAdapter.pause();
                annotationsTool.playerAdapter.setCurrentTime(0);
                $("#video-container").hide();

                if (annotationsTool.getLayoutConfiguration().timeline) {
                    this.timelineView.reset();
                }

                if (annotationsTool.getLayoutConfiguration().annotate) {
                    this.annotateView.reset();
                }

                if (annotationsTool.getLayoutConfiguration().list) {
                    this.listView.reset();
                }

                this.loginView.reset();

                // Delete the different objects
                delete annotationsTool.tracks;
                delete annotationsTool.video;
                delete annotationsTool.user;

                this.loadingBox.find(".bar").width("0%");
                this.loadingBox.show();

                annotationsTool.users.each(function (user) {

                    Backbone.localSync("delete", user, {
                        success: function () {
                            console.log("current session destroyed.");
                        },
                        error: function (error) {
                            console.warn(error);
                        }
                    });

                });

                annotationsTool.modelsInitialized = false;

                if (annotationsTool.logoutUrl) {
                    document.location = annotationsTool.logoutUrl;
                } else {
                    location.reload();
                }
            },

            /**
             * Print the annotations
             * @alias module:views-main.MainView#print
             */
            print: function () {
                var oldStates = this.listView.setStateToAllViews(ListAnnotationView.STATES.PRINT);
                window.focus();
                if (document.readyState === "complete") {
                    window.print();

                    // If is Chrome, we need to refresh the window
                    if (/chrome/i.test(navigator.userAgent)) {
                        document.location.reload(false);
                    }
                } else {
                    setTimeout(this.print, 1000);
                }
                this.listView.setStates(oldStates);
            },

            /**
             * Filter the tracks following the option selected in the menu
             * @alias module:views-main.MainView#tracksSelection
             */
            tracksSelection: function (event) {
                var prefixFilter = "opt-tracks-";

                if ($(event.target).hasClass(prefixFilter + "public")) {
                    annotationsTool.getTracks().showAllPublic();
                } else if ($(event.target).hasClass(prefixFilter + "mine")) {
                    annotationsTool.getTracks().showMyTracks();
                } else {
                    if (_.isUndefined(this.tracksSelectionModal)) {
                        this.tracksSelectionModal = new TracksSelectionView();
                    }

                    this.tracksSelectionModal.show();
                }

                $("[class*='opt-tracks']").removeClass("checked");
                $("." + event.target.className).addClass("checked");
            },

            /**
             * Set the layout of the tools following the option selected in the menu
             * @alias module:views-main.MainView#layoutUpdate
             */
            layoutUpdate: function (event) {
                var enabled = !$(event.target).hasClass("checked"),
                    layoutElement = event.currentTarget.id.replace("opt-", ""),
                    checkMainLayout = function () {
                        if (!annotationsTool.views.annotate.visible && !annotationsTool.views.list.visible) {
                            $("#left-column").removeClass("span6");
                            $("#left-column").addClass("span12");
                        } else {
                            $("#left-column").addClass("span6");
                            $("#left-column").removeClass("span12");
                        }
                        annotationsTool.views.timeline.redraw();
                    };

                if (enabled) {
                    $(event.target).addClass("checked");
                } else {
                    $(event.target).removeClass("checked");
                }

                switch (layoutElement) {

                case "annotate-text":
                    this.annotateView.enableFreeTextLayout(enabled);
                    break;
                case "annotate-categories":
                    this.annotateView.enableCategoriesLayout(enabled);
                    break;
                case "view-annotate":
                    annotationsTool.views.annotate.toggleVisibility();
                    checkMainLayout();
                    break;
                case "view-list":
                    annotationsTool.views.list.toggleVisibility();
                    checkMainLayout();
                    break;
                }
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
                    !annotationsTool.hasSelection()) {
                    return;
                } else {
                    event.preventDefault();

                    annotation = annotationsTool.getSelection()[0];
                    if (annotation) {
                        annotationsTool.trigger("deleteAnnotation", annotation.get("id"), annotation.trackId);
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
                    annotationsTool.video.get("tracks").each(function (track) {
                        if (track.get("annotations").get(annotationId)) {
                            trackId = track.get("id");
                        }
                    });
                }

                annotation = annotationsTool.video.getAnnotation(annotationId, trackId);

                if (annotation) {
                    annotationsTool.deleteOperation.start(annotation, annotationsTool.deleteOperation.targetTypes.ANNOTATION);
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
                    loopFunctionHeight = !_.isUndefined(annotationsTool.loopFunction) && annotationsTool.loopFunction.isVisible() ?
                                            annotationsTool.loopFunction.$el.height() + 180 : 145,
                    videoContainerHeight = $("#video-container").height();


                // TODO: improve this part with a better layout management, more generic
                if (this.annotateView && this.listView) {
                    listContent = this.listView.$el.find("#content-list-scroll");
                    listContent.css("max-height", windowHeight - annotationsContainerHeight - 120);
                }

                if (this.timelineView) {
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
            },

            setActiveAnnotationDelay: function (event) {
                if (!annotationsTool.setDurationKeyEvent) return;
                if (!annotationsTool.activeAnnotation) return;

                var modifierKeys = ["altKey", "ctrlKey", "shiftKey", "metaKey"];
                var configuredEvent = _.defaults(
                    _.pick(annotationsTool.setDurationKeyEvent, modifierKeys, "key"),
                    _.object(_.map(modifierKeys, function (k) { return [k, false]; }))
                );
                var actualEvent = _.pick(event, modifierKeys, "key");
                if (!_.isEqual(configuredEvent, actualEvent)) return;

                event.preventDefault();

                var currentTime = annotationsTool.playerAdapter.getCurrentTime();
                var start = annotationsTool.activeAnnotation.get("start");
                annotationsTool.activeAnnotation.set("duration", currentTime - start);
                annotationsTool.activeAnnotation.save();
            }
        });
        return MainView;
    }
);