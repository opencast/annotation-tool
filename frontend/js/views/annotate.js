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
 * A module representing the main view to create anotation
 * @module views-annotate
 */
define(
    [
        "jquery",
        "underscore",
        "i18next",
        "player-adapter",
        "views/annotate-tab",
        "templates/annotate",
        "templates/annotate-tab-title",
        "templates/annotate-toggle-free-text-button",
        "roles",
        "access",
        "backbone"
    ],
    function (
        $,
        _,
        i18next,
        PlayerAdapter,
        AnnotateTab,
        template,
        TabsButtonTemplate,
        toggleFreeTextButtonTemplate,
        ROLES,
        ACCESS,
        Backbone
    ) {
        "use strict";

        /**
         * List of default tabs, each object contains an id, name and an array of roles
         * @type {Object}
         */
        var DEFAULT_TABS = {
            ALL: {
                id: "all",
                name: i18next.t("annotate.categories.all"),
                filter: function (category) {
                    return category.isPublic() || category.isMine();
                },
                roles: []
            },
            PUBLIC: {
                id: "public",
                name: i18next.t("annotate.categories.public"),
                filter: function (category) {
                    return category.isPublic();
                },
                roles: [ROLES.ADMINISTRATOR],
                attributes: { access: ACCESS.PUBLIC }
            },
            MINE: {
                id: "mine",
                name: i18next.t("annotate.categories.mine"),
                filter: function (category) {
                    return category.isMine() && !category.isPublic();
                },
                roles: [ROLES.USER, ROLES.ADMINISTRATOR],
                attributes: { access: ACCESS.PRIVATE }
            }
        },

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate
         * @augments module:Backbone.View
         */
        Annotate = Backbone.View.extend({
            /**
             * Events to handle by the annotate view
             * @type {map}
             */
            events: {
                "keyup #new-annotation": "keydownOnAnnotate",
                "click #insert": "insert",
                "keydown #new-annotation": "onFocusIn",
                "focusout #new-annotation": "onFocusOut",
                "click #label-tabs-buttons a": "showTab",
                "click #editSwitch": "onSwitchEditModus",
                "click #toggle-free-text button": "toggleFreeTextAnnotations"
            },

            /**
             * Template for tabs button
             * @type {HandlebarsTemplate}
             */
            tabsButtonTemplate: TabsButtonTemplate,

            /**
             * Define if the view is or not in edit modus.
             * @type {boolean}
             */
            editModus: false,

            /**
             * Map with all the category tabs
             * @type {map}
             */
            categoriesTabs: {},

            /**
             * The default tabs when switching in edit modus
             * @type {map}
             */
            DEFAULT_TAB_ON_EDIT: DEFAULT_TABS.MINE.id,

            /**
             * Layout configuration
             * @type {Object}
             */
            layout: {
                freeText: true,
                categories: true
            },

            /**
             * constructor
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                var categories;

                // Set the current context for all these functions
                _.bindAll(
                    this,
                    "insert",
                    "onFocusIn",
                    "onFocusOut",
                    "changeTrack",
                    "addTab",
                    "onSwitchEditModus",
                    "checkToContinueVideo",
                    "switchEditModus",
                    "keydownOnAnnotate",
                    "toggleFreeTextAnnotationPane",
                    "toggleStructuredAnnotations"
                );

                // Parameter for stop on write
                this.continueVideo = false;

                this.$el.html(template());

                this.$el.find("#toggle-free-text").html(
                    toggleFreeTextButtonTemplate({
                        freeTextVisible: annotationTool.freeTextVisible
                    })
                );

                // New annotation input
                this.input = this.$el.find("#new-annotation");
                this.freeTextElement = this.$el.find("#input-container");
                this.categoriesElement = this.$el.find("#categories");
                this.tabsButtonsElement = this.$el.find("ul#label-tabs-buttons");
                this.tabsContainerElement = this.$el.find("div#label-tabs-contents");

                // Print selected track
                this.trackDIV = this.$el.find("span.currentTrack");
                this.changeTrack(annotationTool.selectedTrack);

                this.tracks = annotationTool.video.get("tracks");
                this.listenTo(this.tracks, "select", this.changeTrack);
                this.playerAdapter = attr.playerAdapter;

                this.layout = _.pick(attr, "freeText", "categories");
                if (!this.layout.freeText) this.freeTextElement.hide();
                if (!this.layout.categories) this.categoriesElement.hide();

                categories = annotationTool.video.get("categories");

                annotationTool.colorsManager.updateColors(categories.models);

                _.each(DEFAULT_TABS, function (params) {
                    this.addTab(categories, params);
                }, this);

                this.tabsContainerElement.find("div.tab-pane:first-child").addClass("active");
                this.tabsButtonsElement.find("a:first-child").parent().first().addClass("active");
            },

            /**
             * Proxy function for insert through 'enter' keypress
             * @param {event} event Event object
             */
            keydownOnAnnotate: function (e) {
                // If enter is pressed and shit not, we insert a new annotation
                if (e.keyCode === 13 && !e.shiftKey) {
                    this.insert();
                }
            },

            /**
             * Insert a new annotation
             * @param {event} event Event object
             */
            insert: function (event) {
                if (event) {
                    event.stopImmediatePropagation();
                }

                var value = this.input.val();

                if (!value) {
                    return;
                }

                annotationTool.createAnnotation({ text: value });

                if (this.continueVideo) {
                    this.playerAdapter.play();
                }

                this.input.val("");
                setTimeout(function () {
                    $("#new-annotation").focus();
                }, 500);
            },

            /**
             * Change the current selected track by the given one
             * @param {Track} track The new track
             */
            changeTrack: function (track) {
                // If the track is valid, we set it
                if (track) {
                    // TODO Until we update jQuery, we can't use `show` and `hide` here,
                    //   since our current jQuery version does not preserve
                    //   the `display` property correctly.
                    this.$el.find(".annotate").css("display", "");
                    this.$el.find(".no-track").hide();

                    this.trackDIV.html(track.get("name"));

                } else {
                    // Otherwise, we disable the input and inform the user that no track is set
                    this.$el.find(".annotate").css("display", "none");
                    this.$el.find(".no-track").show();
                    this.trackDIV.html("<span>" + i18next.t("annotate.no selected track") + "</span>");
                }
            },

            /**
             * Listener for when a user start to write a new annotation,
             * manage if the video has to be or not paused.
             */
            onFocusIn: function () {
                if (!this.$el.find("#pause-video").attr("checked") || (this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED)) {
                    return;
                }

                this.continueVideo = true;
                this.playerAdapter.pause();

                // If the video is moved, or played, we do no continue the video after insertion
                $(this.playerAdapter).one(PlayerAdapter.EVENTS.TIMEUPDATE, function () {
                    this.continueVideo = false;
                });
            },

            /**
             * Listener for when we leave the annotation input
             */
            onFocusOut: function () {
                setTimeout(this.checkToContinueVideo, 200);
            },

            /**
             * Check if the video must continue, and if yes, continue to play it
             */
            checkToContinueVideo: function () {
                if ((this.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) && this.continueVideo) {
                    this.continueVideo = false;
                    this.playerAdapter.play();
                }
            },

            /**
             * Show the tab related to the source from the event
             * @param {Event} event Event object
             */
            showTab: function (event) {
                var tabId = event.currentTarget.dataset.tabid;

                $(event.currentTarget).one("shown", _.bind(function () {
                    this.categoriesTabs[tabId].initCarousel();
                }, this));

                $(event.currentTarget).tab("show");
                this.categoriesTabs[tabId].select();
            },

            /**
             * Add a new categories tab in the annotate view
             * @param {Categories} categories Categories to add to the new tab
             * @param {object} attr Infos about the new tab like id, name, filter for categories and roles.
             */
            addTab: function (categories, attr) {
                var params = {
                        id: attr.id,
                        name: attr.name,
                        categories: categories,
                        filter: attr.filter,
                        roles: attr.roles,
                        attributes: attr.attributes
                    },
                    newButton = this.tabsButtonTemplate(params),
                    annotateTab;

                newButton = $(newButton).appendTo(this.tabsButtonsElement);
                params.button = newButton;

                params.id = "labelTab-" + params.id;
                annotateTab = new AnnotateTab(params);

                this.categoriesTabs[attr.id] = annotateTab;
                this.tabsContainerElement.append(annotateTab.$el);
            },

            /**
             * Listener for edit modus switch.
             * @param {Event} event Event related to this action
             */
            onSwitchEditModus: function (event) {
                var status = event.target.checked;

                this.switchEditModus(status);

                if (status) {
                    this.showTab({
                        currentTarget: this.categoriesTabs[this.DEFAULT_TAB_ON_EDIT].titleLink.find("a")[0]
                    });
                }
            },

            /**
             * Switch the edit modus to the given status.
             * @param  {boolean} status The current status
             */
            switchEditModus: function (status) {
                this.editModus = status;

                this.$el.find("#annotate-container").toggleClass("edit-on", status);

                // trigger an event that all element switch in edit modus
                annotationTool.trigger(annotationTool.EVENTS.ANNOTATE_TOGGLE_EDIT, status);
            },

            /**
             * Toggle layout for free text annotation only
             */
            toggleFreeTextAnnotationPane: function () {
                this.layout.freeText = !this.layout.freeText;
                // TODO You might have to adapt this as well
                this.freeTextElement.toggle();
            },

            /**
             * Toggle layout for labels annotation
             */
            toggleStructuredAnnotations: function () {
                this.layout.categories = !this.layout.categories;
                this.categoriesElement.toggle();
            },

            /**
             * Shows or hides the free text annotations
             */
            toggleFreeTextAnnotations: function () {
                annotationTool.toggleFreeTextAnnotations();

                this.$el.find("#toggle-free-text").html(
                    toggleFreeTextButtonTemplate({
                        freeTextVisible: annotationTool.freeTextVisible
                    })
                );
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             */
            remove: function () {
                _.each(this.categoriesTabs, function (categoriesTab) {
                    categoriesTab.remove();
                });
                return Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        return Annotate;
    }
);
