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
 * @requires jQuery
 * @requires underscore
 * @requires i18next
 * @requires player-adapter
 * @requires models-annotation
 * @requires collections-annotations
 * @requires collections-categories
 * @requires templates/annotate-tab-title.tmpl
 * @requires ROLES
 * @requires ACCESS
 * @requires handlebars
 * @requires backbone
 */
define(["jquery",
        "underscore",
        "i18next",
        "prototypes/player_adapter",
        "models/annotation",
        "collections/annotations",
        "collections/categories",
        "views/annotate-tab",
        "templates/annotate-tab-title",
        "roles",
        "access",
        "backbone",
        "handlebarsHelpers"],

    function ($, _, i18next, PlayerAdapter, Annotation, Annotations, Categories, AnnotateTab, TabsButtonTemplate, ROLES, ACCESS, Backbone) {

        "use strict";

        /**
         * Prefix for the name of the categories tab id
         * @type {String}
         */
        var TAB_LINK_PREFIX = "#labelTab-",

            /**
             * List of default tabs, each object contains an id, name and an array of roles
             * @type {Object}
             */
            DEFAULT_TABS = {
                ALL: {
                    id    : "all",
                    name  : i18next.t("annotate.categories.all"),
                    filter: function (category) {
                        return category.get("isPublic") || category.get("isMine");
                    },
                    roles : []
                },
                PUBLIC: {
                    id        : "public",
                    name      : i18next.t("annotate.categories.public"),
                    filter    : function (category) {
                        return category.get("isPublic");
                    },
                    roles     : [ROLES.SUPERVISOR, ROLES.ADMINISTRATOR],
                    attributes: {access: ACCESS.PUBLIC}
                },
                MINE: {
                    id        : "mine",
                    name      : i18next.t("annotate.categories.mine"),
                    filter    : function (category) {
                        return category.get("isMine") && !category.get("isPublic");
                    },
                    roles     : [ROLES.SUPERVISOR, ROLES.USER, ROLES.ADMINISTRATOR],
                    attributes: {access: ACCESS.PRIVATE}
                }
            },

            /**
             * @constructor
             * @see {@link http://www.backbonejs.org/#View}
             * @memberOf module:views-annotate
             * @augments module:Backbone.View
             * @alias module:views-annotate.Annotate
             */
            Annotate = Backbone.View.extend({

                /**
                 * Main container of the annotate view
                 * @alias module:views-annotate.Annotate#el
                 * @type {DOMElement}
                 */
                el: $("div#annotate-container"),


                /**
                 * Events to handle by the annotate view
                 * @alias module:views-annotate.Annotate#events
                 * @type {map}
                 */
                events: {
                    "keyup #new-annotation"             : "keydownOnAnnotate",
                    "click #insert"                     : "insert",
                    "click .toggle-collapse"            : "toggleVisibility",
                    "keydown #new-annotation"           : "onFocusIn",
                    "focusout #new-annotation"          : "onFocusOut",
                    "click #label-tabs-buttons a"       : "showTab",
                    "click #editSwitch"                 : "onSwitchEditModus"
                },

                /**
                 * Template for tabs button
                 * @alias module:views-annotate.Category#tabsButtonTemplate
                 * @type {HandlebarsTemplate}
                 */
                tabsButtonTemplate: TabsButtonTemplate,

                /**
                 * Element containing the tabs buttons
                 * @alias module:views-annotate.Category#tabsButtonsElement
                 * @type {DOMElement}
                 */
                tabsButtonsElement: $("ul#label-tabs-buttons"),

                /**
                 * Element containing the tabs contents
                 * @alias module:views-annotate.Category#tabsContainerElement
                 * @type {DOMElement}
                 */
                tabsContainerElement: $("div#label-tabs-contents"),

                /**
                 * Define if the view is or not in edit modus.
                 * @alias module:views-annotate.Category#editModus
                 * @type {boolean}
                 */
                editModus: false,

                /**
                 * Map with all the category tabs
                 * @alias module:views-annotate.Category#categoriesTabs
                 * @type {map}
                 */
                categoriesTabs: {},

                /**
                 * The default tabs when switching in edit modus
                 * @alias module:views-annotate.Category#DEFAULT_TAB_ON_EDIT
                 * @type {map}
                 */
                DEFAULT_TAB_ON_EDIT: DEFAULT_TABS.MINE.id,


                /**
                 * Layout configuration
                 * @type {Object}
                 */
                layout: {
                    freeText   : true,
                    categories : true
                },

                visible: true,

                /**
                 * constructor
                 * @alias module:views-annotate.Category#initialize
                 * @param {PlainObject} attr Object literal containing the view initialization attributes.
                 */
                initialize: function (attr) {
                    var categories;

                    // Set the current context for all these functions
                    _.bindAll(this,
                              "insert",
                              "reset",
                              "onFocusIn",
                              "onFocusOut",
                              "changeTrack",
                              "addTab",
                              "onSwitchEditModus",
                              "checkToContinueVideo",
                              "switchEditModus",
                              "keydownOnAnnotate",
                              "enableCategoriesLayout",
                              "enableFreeTextLayout",
                              "setLayoutFull",
                              "toggleVisibility");

                    // Parameter for stop on write
                    this.continueVideo = false;

                    // New annotation input
                    this.input = this.$("#new-annotation");
                    this.freeTextElement = this.$el.find("#input-container");
                    this.categoriesElement = this.$el.find("#categories");

                    // Print selected track
                    this.trackDIV = this.$el.find("span.currentTrack");
                    this.changeTrack(annotationsTool.selectedTrack);

                    this.tracks = annotationsTool.video.get("tracks");
                    this.tracks.bind("selected_track", this.changeTrack, this);
                    this.playerAdapter = attr.playerAdapter;

                    if (annotationsTool.isStructuredAnnotationEnabled()) {
                        categories = annotationsTool.video.get("categories");

                        annotationsTool.colorsManager.updateColors(categories.models);

                        _.each(DEFAULT_TABS, function (params) {
                            this.addTab(categories, params);
                        }, this);
                    } else {
                        this.layout.categories = false;
                        this.categoriesElement.hide();
                        this.$el.find("#annotate-categories").parent().hide();
                    }

                    if (!annotationsTool.isFreeTextEnabled()) {
                        this.layout.freeText = false;
                        this.freeTextElement.hide();
                        this.$el.find("#annotate-text").parent().hide();
                    }

                    this.$el.find("#annotate-full").addClass("checked");

                    this.tabsContainerElement.find("div.tab-pane:first-child").addClass("active");
                    this.tabsButtonsElement.find("a:first-child").parent().first().addClass("active");

                    // Add backbone events to the model
                    _.extend(this, Backbone.Events);
                },

                /**
                 * Proxy function for insert through 'enter' keypress
                 * @alias module:views-annotate.Annotate#keydownOnAnnotate
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
                 * @alias module:views-annotate.Annotate#insert
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

                    annotationsTool.createAnnotation({ text: value });

                    if (this.continueVideo) {
                        annotationsTool.playerAdapter.play();
                    }

                    this.input.val("");
                    setTimeout(function () {
                        $("#new-annotation").focus();
                    }, 500);
                },

                /**
                 * Change the current selected track by the given one
                 * @alias module:views-annotate.Annotate#changeTrack
                 * @param {Track} track The new track
                 */
                changeTrack: function (track) {
                    // If the track is valid, we set it
                    if (track) {
                        this.input.attr("disabled", false);

                        if (this.layout.freeText) {
                            this.freeTextElement.show();
                        }

                        if (this.layout.categories) {
                            this.categoriesElement.show();
                        }

                        this.$el.find(".no-track").hide();
                        this.trackDIV.html(track.get("name"));
                    } else {
                        // Otherwise, we disable the input and inform the user that no track is set
                        this.freeTextElement.hide();
                        this.categoriesElement.hide();
                        this.input.attr("disabled", true);
                        this.$el.find(".no-track").show();
                        this.trackDIV.html("<span>" + i18next.t("annotate.no selected track") + "</span>");
                    }
                },

                /**
                 * Listener for when a user start to write a new annotation,
                 * manage if the video has to be or not paused.
                 * @alias module:views-annotate.Annotate#onFocusIn
                 */
                onFocusIn: function () {
                    if (!this.$el.find("#pause-video").attr("checked") || (annotationsTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED)) {
                        return;
                    }

                    this.continueVideo = true;
                    this.playerAdapter.pause();

                    // If the video is moved, or played, we do no continue the video after insertion
                    $(annotationsTool.playerAdapter).one(PlayerAdapter.EVENTS.TIMEUPDATE, function () {
                        this.continueVideo = false;
                    });
                },

                /**
                 * Listener for when we leave the annotation input
                 * @alias module:views-annotate.Annotate#onFocusOut
                 */
                onFocusOut: function () {
                    setTimeout(this.checkToContinueVideo, 200);
                },

                /**
                 * Check if the video must continue, and if yes, continue to play it
                 * @alias module:views-annotate.Annotate#checkToContinueVideo
                 */
                checkToContinueVideo: function () {
                    if ((annotationsTool.playerAdapter.getStatus() === PlayerAdapter.STATUS.PAUSED) && this.continueVideo) {
                        this.continueVideo = false;
                        this.playerAdapter.play();
                    }
                },

                /**
                 * Show the tab related to the source from the event
                 * @alias module:views-annotate.Annotate#showTab
                 * @param {Event} event Event object
                 */
                showTab: function (event) {
                    var tabId = event.currentTarget.attributes.getNamedItem("href").value;

                    tabId = tabId.replace(TAB_LINK_PREFIX, "");

                    $(event.currentTarget).one("shown", $.proxy(function () {
                        //this.categoriesTabs[tabId].render();
                        this.categoriesTabs[tabId].initCarousel();
                    }, this));

                    $(event.currentTarget).tab("show");
                    this.categoriesTabs[tabId].select();
                },

                /**
                 * Add a new categories tab in the annotate view
                 * @alias module:views-annotate.Annotate#addTab
                 * @param {Categories} categories Categories to add to the new tab
                 * @param {object} attr Infos about the new tab like id, name, filter for categories and roles.
                 */
                addTab: function (categories, attr) {
                    var params = {
                            id        : attr.id,
                            name      : attr.name,
                            categories: categories,
                            filter    : attr.filter,
                            roles     : attr.roles,
                            attributes: attr.attributes
                        },
                        newButton = this.tabsButtonTemplate(params),
                        annotateTab;

                    newButton = $(newButton).appendTo(this.tabsButtonsElement);
                    params.button = newButton;

                    annotateTab = new AnnotateTab(params);

                    this.categoriesTabs[attr.id] = annotateTab;
                    this.tabsContainerElement.append(annotateTab.$el);
                },

                /**
                 * Listener for edit modus switch.
                 * @alias module:views-annotate.Annotate#onSwitchEditModus
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
                 * @alias module:views-annotate.Annotate#switchEditModus
                 * @param  {boolean} status The current status
                 */
                switchEditModus: function (status) {
                    this.editModus = status;

                    this.$el.toggleClass("edit-on", status);

                    // trigger an event that all element switch in edit modus
                    annotationsTool.trigger(annotationsTool.EVENTS.ANNOTATE_TOGGLE_EDIT, status);
                },

                /**
                 * Change the layout to full layout, with all possiblities to annotate
                 * @alias module:views-annotate.Annotate#setLayoutFull
                 * @param {Event} event Event object
                 */
                setLayoutFull: function (event) {
                    if (!$(event.target).hasClass("checked")) {
                        if (annotationsTool.isStructuredAnnotationEnabled()) {
                            this.categoriesElement.show();
                        }
                        if (annotationsTool.isFreeTextEnabled()) {
                            this.freeTextElement.show();
                        }
                        this.$el.find("#annotate-text").removeClass("checked");
                        this.$el.find("#annotate-categories").removeClass("checked");
                        $(event.target).addClass("checked");
                        this.trigger("change-layout");
                    }
                },

                /**
                 * Enable layout for free text annotation only
                 * @alias module:views-annotate.Annotate#enableFreeTextLayout
                 * @param {boolean} [enabled] Define if the layout must be enable or disable
                 */
                enableFreeTextLayout: function (enabled) {
                    if (_.isUndefined(enabled)) {
                        this.layout.freeText = !this.layout.freeText;
                    } else if (this.layout.freeText == enabled) {
                        return;
                    } else {
                        this.layout.freeText = enabled;
                    }

                    if (this.layout.freeText && annotationsTool.isFreeTextEnabled()) {
                        this.freeTextElement.show();
                        if (!this.layout.categories) {
                            $(".toggle-collapse").show();
                        }
                    } else {
                        this.freeTextElement.hide();
                        if (!this.layout.categories) {
                            $(".toggle-collapse").hide();
                        }
                    }

                    this.trigger("change-layout");
                },

                /**
                 * Enable layout for labels annotation
                 * @alias module:views-annotate.Annotate#enableCategoriesLayout
                 * @param {boolean} [enabled] Define if the layout must be enable or disable
                 */
                enableCategoriesLayout: function (enabled) {
                    if (_.isUndefined(enabled)) {
                        this.layout.categories = !this.layout.categories;
                    } else if (this.layout.categories == enabled) {
                        return;
                    } else {
                        this.layout.categories = enabled;
                    }

                    if (this.layout.categories && annotationsTool.isStructuredAnnotationEnabled()) {
                        this.categoriesElement.show();
                        if (!this.layout.freeText) {
                            $(".toggle-collapse").show();
                        }
                    } else {
                        this.categoriesElement.hide();
                        if (!this.layout.freeText) {
                            $(".toggle-collapse").hide();
                        }
                    }

                    this.trigger("change-layout");
                },

                /**
                 * Toggle the visibility of the annotate part
                 * @alias module:views-annotate.Annotate#toggleVisibility
                 * @param {Event} event Event object
                 */
                toggleVisibility: function () {
                    this.visible = !this.visible;
                    this.$el.fadeToggle();
                    this.trigger("change-layout");
                },

                /**
                 * Reset the view
                 * @alias module:views-annotate.Annotate#reset
                 */
                reset: function () {
                    this.$el.hide();
                    delete this.tracks;
                    this.undelegateEvents();

                    if (annotationsTool.isStructuredAnnotationEnabled()) {
                        this.tabsContainerElement.empty();
                        this.$el.find("#editSwitch input").attr("checked", false);
                        this.tabsButtonsElement.find(".tab-button").remove();
                    }
                }
            });
        return Annotate;
    }
);