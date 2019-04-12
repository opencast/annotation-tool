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
        "views/timeline",
        "views/loop",
        "views/scale-editor",
        "views/tracks-selection",
        "views/print",
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
        TimelineView,
        LoopView,
        ScaleEditorView,
        TracksSelectionView,
        PrintView,
        Backbone,
        GoldenLayout
    ) {
        "use strict";

        var goldenLayout;

        var annotationShortcutState;
        var annotationShortcutTimer;

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
                "click #export": "export",
                "click #about": "about",
                "click #logout": "onLogout",
                "click #print": "print",
                "click #opt-annotate-text": "toggleFreeTextAnnotations",
                "click #opt-annotate-categories": "toggleStructuredAnnotations",
                "click .opt-tracks-select": "tracksSelection",
                "click #opt-auto-expand": "toggleAutoExpand",
                "click .opt-view": "toggleView",
                "click .opt-template": "loadTemplate",
                "keyup": "handleAnnotationShortcut",
                "blur #annotation-shortcut-focus": "interruptAnnotationShortcut"
            },

            /**
             * Constructor
             * @alias module:views-main.MainView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function () {
                _.bindAll(this, "createViews",
                                "onDeletePressed",
                                "onWindowResize",
                                "print",
                                "ready",
                                "setupKeyboardShortcuts",
                                "interruptAnnotationShortcut",
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
                var views = [
                    "player",
                    "timeline",
                    "annotate",
                    "list",
                    "loop"
                ];

                var closableViews = ["list", "annotate", "loop"];
                this.viewConfigs = _.object(_.map(views, function (view) { return [
                    view, {
                        type: "component",
                        componentName: view,
                        title: i18next.t("views." + view)
                    }
                ]; }));

                // The loop controller does not need to be very high by default.
                // In fact it looks rather strange if it is.
                this.viewConfigs.loop.height = 15;

                _.each(_.difference(views, closableViews), function (view) {
                    this.viewConfigs[view].isClosable = false;
                }, this);
                var viewConfig = _.bind(function (view) {
                    return this.viewConfigs[view];
                }, this);

                var templates = {
                    default: {
                        type: "row",
                        content: [{
                            type: "column",
                            content: [
                                "player",
                                "timeline"
                            ].map(viewConfig)
                        }, {
                            type: "column",
                            content: [
                                "annotate",
                                "list"
                            ].map(viewConfig)
                        }]
                    },
                    "with loops": {
                        type: "row",
                        content: [{
                            type: "column",
                            content: [
                                "player",
                                "loop",
                                "timeline"
                            ].map(viewConfig)
                        }, {
                            type: "column",
                            content: [
                                "annotate",
                                "list"
                            ].map(viewConfig)
                        }]
                    },
                    alternative: {
                        type: "row",
                        content: [{
                            type: "column",
                            content: [
                                "player",
                                "annotate"
                            ].map(viewConfig)
                        }, {
                            type: "column",
                            content: [
                                "timeline",
                                "list"
                            ].map(viewConfig)
                        }]
                    },
                    reviewing: {
                        type: "column",
                        content: [{
                            type: "row",
                            content: [
                                "player",
                                "annotate"
                            ].map(viewConfig)
                        }, this.viewConfigs.timeline]
                    },
                    "fullscreen timeline": {
                        type: "stack",
                        content: [
                            "timeline",
                            "player"
                        ].map(viewConfig)
                    }
                };

                // Create menu items for the templates
                //   Note that this should no longer be necessary
                //   once the index is (mostly) rendered using a template as well.
                $("#templates-menu").after(
                    _.map([
                        // Note that we explicitly **list** the templates here
                        //   instead of relying on the keys of the above map
                        //   to impose an order!
                        "default",
                        "with loops",
                        "alternative",
                        "reviewing",
                        "fullscreen timeline"
                    ], function (template) {
                        return '<li><button class="opt-template" type="button" data-template="' + template + '">' +
                            i18next.t("menu.view.templates." + template) +
                            '</button></li>';
                    }).join("")
                );

                var viewMenuItems = _.object(_.map(closableViews, function (view) { return [
                    view, $(".opt-view[data-view=" + view + "]")
                ]; }));

                function disableViewMenuItem(view) {
                    viewMenuItems[view].addClass("checked");
                }

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

                var layout = localStorage.getItem("layout");
                if (layout === "custom") {
                    layout = JSON.parse(localStorage.getItem("layout-custom")).content;
                } else if (layout in templates) {
                    layout = [templates[layout]];
                } else {
                    layout = [templates.default];
                }
                goldenLayout = new GoldenLayout({
                    content: layout,
                    settings: {
                        showPopoutIcon: false,
                        showMaximiseIcon: false,
                        selectionEnabled: true
                    }
                }, document.getElementById("main-container"));

                // We have no control over the order in which GoldenLayout initializes its views.
                // However, some of the views depend on others, most notably the player.
                // Thus, when called to create a view that needs the player,
                // we need to be able to defer the actual initialization logic of that view
                // to a point in time where the player is fully initialized.
                // This is a very primitive dependency injection mechanism.
                // It can not deal with circular dependencies
                // and diamond dependency chains lead to the common (transitive) dependencies
                // being initialized multiple times.
                // Note that this currently assumes that components that others depend on
                // can never be closed!
                // Or rather: Closing them and reopening them re-resolves their dependencies,
                // which -- in combination with the above -- can lead to surprising behavior.
                this.views = {};
                function resolveView(name, view) {
                    self.views[name] = view;
                    self.trigger("view:" + name, view);
                    self.trigger("view");
                }
                function requireViews(dependencies, callback) {
                    var resolvedDependencies = [];
                    var missingDependencies = [];
                    _.each(dependencies, function (dependency) {
                        var view = self.views[dependency];
                        if (view) {
                            resolvedDependencies.push(view);
                        } else {
                            missingDependencies.push(dependency);
                        }
                    });
                    if (resolvedDependencies.length === dependencies.length) {
                        callback.apply(null, resolvedDependencies);
                    } else {
                        var doTheThing = _.after(missingDependencies.length, function () {
                            var resolvedDependencies = _.map(dependencies, function (dependency) {
                                return self.views[dependency];
                            });
                            callback.apply(null, resolvedDependencies);
                        });
                        _.each(missingDependencies, function (dependency) {
                            self.once("view:" + dependency, doTheThing);
                        });
                    }
                }

                goldenLayout.registerComponent("player", function (container) {
                    self.setLoadingProgress(50, i18next.t("startup.loading video"));

                    container.on("resize", function () {
                        annotationTool.playerAdapter.resetSize();
                    });

                    function videoLoaded() {
                        self.setLoadingProgress(60, i18next.t("startup.creating views"));
                        resolveView("player", annotationTool.playerAdapter);
                    }
                    annotationTool.once(annotationTool.EVENTS.VIDEO_LOADED, function () {
                        if (annotationTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) {
                            videoLoaded();
                        } else {
                            $(annotationTool.playerAdapter).one(PlayerAdapter.EVENTS.READY, videoLoaded);
                        }
                    });

                    annotationTool.loadVideo(container.getElement()[0]);
                });

                goldenLayout.registerComponent("timeline", function (container) {
                    requireViews(["player"], function (player) {
                        var timeline = new TimelineView({
                            el: container.getElement(),
                            playerAdapter: player
                        });
                        container.on("resize", function () {
                            timeline.onWindowResize();
                        });
                        resolveView("timeline", timeline);
                    });
                });

                function setupClosing(view, container) {
                    $(".opt-" + view).show();

                    container.on("destroy", function () {

                        viewMenuItems[view].removeClass("checked");
                        viewMenuItems[view].prop("disabled", false);

                        $(".opt-" + view).hide();

                        self.views[view].remove();
                        delete self.views[view];
                    });

                    disableViewMenuItem(view);
                }

                goldenLayout.registerComponent("list", function (container) {
                    requireViews(["player"], function (player) {
                        setupClosing("list", container);
                        resolveView("list", new ListView({
                            el: container.getElement(),
                            playerAdapter: player,
                            autoExpand: $("#opt-auto-expand").hasClass("checked")
                        }));
                    });
                });
                goldenLayout.registerComponent("annotate", function (container) {
                    requireViews(["player"], function (player) {
                        setupClosing("annotate", container);
                        resolveView("annotate", new AnnotateView({
                            playerAdapter: player,
                            el: container.getElement(),
                            freeText: $("#opt-annotate-text").hasClass("checked"),
                            categories: $("#opt-annotate-categories").hasClass("checked")
                        }));
                    });
                });

                goldenLayout.registerComponent("loop", function (container) {
                    requireViews(["player", "timeline"], function (player, timeline) {
                        setupClosing("loop", container);
                        resolveView("loop", new LoopView({
                            el: container.getElement(),
                            playerAdapter: player,
                            timeline: timeline
                        }));
                    });
                });

                function visibleChildren(config) {
                    if (config.type === "component") {
                        return 1;
                    } else {
                        return config.content
                            .map(visibleChildren)
                            .reduce(function (acc, n) { return acc + n; });
                    }
                }
                var numberVisibleViews = visibleChildren(goldenLayout.config.content[0]);
                this.listenTo(this, "view", _.after(numberVisibleViews, function () {

                    _.each(closableViews, function (view) {
                        goldenLayout.createDragSource(
                            viewMenuItems[view].find(".drag-source"),
                            this.viewConfigs[view]
                        );
                    }, this);

                    var viewOptionsDropdown = $("#view-options .dropdown-toggle");
                    //$("#view-options .dropdown-menu").off("mouseleave");
                    $("#view-options .dropdown-menu").mouseleave(function (event) {
                        if (event.buttons & 1) {
                            // Note that we explicitly assume the menu to be open!
                            // Otherwise, how would this event ever happen?
                            viewOptionsDropdown.dropdown("toggle");
                        }
                    });
                    this.ready();
                    this.stopListening(this, "view");
                }));


                goldenLayout.on("stateChanged", function (event) {
                    localStorage.setItem("layout-custom", JSON.stringify(goldenLayout.toConfig()));
                    localStorage.setItem("layout", "custom");
                });
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

                var setActiveAnnotationDuration = function () {
                    if (!annotationTool.activeAnnotation) return;

                    var currentTime = annotationTool.playerAdapter.getCurrentTime();
                    var start = annotationTool.activeAnnotation.get("start");
                    annotationTool.activeAnnotation.set("duration", currentTime - start);
                    annotationTool.activeAnnotation.save();
                };

                var addComment = _.bind(function () {
                    if (!annotationTool.activeAnnotation) return;
                    if (!this.views.list) return;
                    var annotationView = this.views.list.getViewFromAnnotation(
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

                this.interruptAnnotationShortcut();
            },

            /**
             * Handle numeric key sequences to easily insert structured annotations.
             * Pressing a numeric key selects first the corresponding category,
             * then the label, and then -- if necessary -- a scale value.
             * The sequence is interrupted by pressing any other key,
             * or changing the input focus in any way.
             * @alias module:views-main.MainView#handleAnnotationShortcut
             */
            handleAnnotationShortcut: function (event) {
                if (
                    ["input", "textarea"].includes(event.target.tagName.toLowerCase())
                        || !event.key.match(/^[1-9]$/)
                ) {
                    this.interruptAnnotationShortcut();
                    return;
                }

                this.$el.find("#annotation-shortcut-focus")[0].focus();

                var selectedEntity = Number(event.key) - 1;

                // Note that this might fail horribly when the entities change in between keys of the sequence


                if (!annotationShortcutState.category) {
                    annotationShortcutState.category = annotationTool.video.get("categories").at(selectedEntity);
                    if (!annotationShortcutState.category) {
                        this.interruptAnnotationShortcut();
                        return;
                    }
                    var scaleId = annotationShortcutState.category.get("scale_id");
                    if (!scaleId) {
                        var scale = annotationShortcutState.category.get("scale");
                        if (scale) {
                            scaleId = scale.id;
                        }
                    }
                    annotationShortcutState.scale = annotationTool.video.get("scales").get(scaleId);
                } else if (!annotationShortcutState.label) {
                    annotationShortcutState.label = annotationShortcutState.category.get("labels").at(selectedEntity);
                    if (!annotationShortcutState.label) {
                        this.interruptAnnotationShortcut();
                        return;
                    }
                    annotationShortcutState.params.label = annotationShortcutState.label;
                    annotationShortcutState.params.text = annotationShortcutState.label.get("value");
                } else {
                    var scaleValue = annotationShortcutState.scale.get("scaleValues").at(selectedEntity);
                    if (!scaleValue) {
                        this.interruptAnnotationShortcut();
                        return;
                    }
                    annotationShortcutState.params.scalevalue = scaleValue;
                }

                if (scaleValue || annotationShortcutState.label && !annotationShortcutState.scale) {
                    var annotation = annotationTool.createAnnotation(annotationShortcutState.params);
                    annotationTool.setSelection([annotation], true);
                    this.interruptAnnotationShortcut();
                } else {
                    clearTimeout(annotationShortcutTimer);
                    annotationShortcutTimer = setTimeout(this.interruptAnnotationShortcut, 3000);
                }
            },

            /**
             * Interrupt an in-process annotation key combination
             * @alias module:views-main.MainView#interruptAnnotationShortcut
             */
            interruptAnnotationShortcut: function () {
                annotationShortcutState = { params: {} };
                clearTimeout(annotationShortcutTimer);
                annotationShortcutTimer = null;
            },

            /**
             * Add/remove a view from the layout
             * @param {Event} event The event
             */
            toggleView: function (event) {
                var view = event.currentTarget.dataset.view;
                var root = goldenLayout.root.contentItems[0];
                if (this.views[view]) {
                    // Note that the objects returned by `ContentItem#getComponentsByName`
                    // unfortunately do now allow for their own removal from the layout,
                    // hence our copying some of the functionality of that method.
                    root.getItemsByFilter(function (item) {
                        return item.componentName === view;
                    })[0].remove();
                } else {
                    var parent = goldenLayout.selectedItem || root;
                    parent.addChild(this.viewConfigs[view]);
                }
            },

            /**
             * Load the specified layout template
             * @param {Event} event The event
             */
            loadTemplate: function (event) {
                localStorage.setItem("layout", event.currentTarget.dataset.template);
                location.reload();
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
             * Enable/disable the free text annotations pane in the annotate view
             * @alias module:views-main.MainView#toggleFreeTextAnnotations
             */
            toggleFreeTextAnnotations: function () {
                $("#opt-annotate-text").toggleClass("checked");
                this.views.annotate.toggleFreeTextAnnotations();
            },

            /**
             * Enable/disable the structured annotations pane in the annotate view
             * @alias module:views-main.MainView#toggleStructuredAnnotations
             */
            toggleStructuredAnnotations: function () {
                $("#opt-annotate-categories").toggleClass("checked");
                this.views.annotate.toggleStructuredAnnotations();
            },

            /**
             * Toggle the automatic expanding/collapsing of the annotations relevant to the current player time
             * @alias module:views-main.MainView#toggleAutoExpand
             */
            toggleAutoExpand: function (event) {
                $(event.currentTarget).toggleClass("checked");
                this.views.list.autoExpand = !this.views.list.autoExpand;
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
