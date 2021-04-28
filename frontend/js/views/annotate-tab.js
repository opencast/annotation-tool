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
 * A module representing the view for the categories tab
 * @module views-annotate-tab
 */
define(["jquery",
        "underscore",
        "i18next",
        "views/annotate-category",
        "templates/annotate-tab",
        "backbone",
        "handlebars",
        "filesaver"],

    function (
        $,
        _,
        i18next,
        CategoryView,
        Template,
        Backbone,
        Handlebars
    ) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-tab
         * @augments module:Backbone.View
         * @alias module:views-annotate-tab.AnnotateTab
         */
        var AnnotateTab = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-annotate-tab.AnnotateTab#tagName
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @alias module:views-annotate-tab.AnnotateTab#className
             * @type {string}
             */
            className: "tab-pane",

            /**
             * Define if the view is or not in edit modus.
             * @alias module:views-annotate-tab.AnnotateTab#editModus
             * @type {boolean}
             */
            editModus: false,

            /**
             * List of categories in this tab
             * @alias module:views-annotate-tab.AnnotateTab#categories
             * @type {Categories}
             */
            categories: undefined,

            /**
             * List of category views in this tab
             * @alias module:views-annotate-tab.AnnotateTab#categoryViews
             * @type {array}
             */
            categoryViews: undefined,

            /**
             * Tab template
             * @alias module:views-annotate-tab.AnnotateTab#template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Template for the carousel items
             * @alias module:views-annotate-tab.AnnotateTab#itemContainerTemplate
             * @type {HandlebarsTemplate}
             */
            itemContainerTemplate: Handlebars.compile("<div class=\"item row-fluid\">\
                                                        <div class=\"span12\">\
                                                          <div class=\"row-fluid categories-container\">\
                                                          </div>\
                                                        </div>\
                                                      </div>"),

            /**
             * Template for pagination link
             * @alias module:views-annotate-tab.AnnotateTab#paginationBulletTemplate
             * @type {HandlebarsTemplate}
             */
            paginationBulletTemplate: Handlebars.compile("<li><button type=\"button\" class=\"page-link\" data-page=\"{{number}}\">{{number}}</button></li>"),

            /**
             * Element containing the "carousel"
             * @alias module:views-annotate-tab.AnnotateTab#carouselElement
             * @type {DOMElement}
             */
            carouselElement: undefined,

            /**
             * Element containing the pagination
             * @alias module:views-annotate-tab.AnnotateTab#carouselPagination
             * @type {DOMElement}
             */
            carouselPagination: undefined,

            /**
             * Element containing the all the categories
             * @alias module:views-annotate-tab.AnnotateTab#categoriesContainer
             * @type {DOMElement}
             */
            categoriesContainer: undefined,

            /**
             * Current container for categories group in the carousel
             * @alias module:views-annotate-tab.AnnotateTab#itemsCurrentContainer
             * @type {DOMElement}
             */
            itemsCurrentContainer: undefined,

            /**
             * Element represeting the tab top link
             * @alias module:views-annotate-tab.AnnotateTab#titleLink
             * @type {DOMElement}
             */
            titleLink: undefined,

            /**
             * Events to handle by the annotate-tab view
             * @alias module:views-annotate-tab.AnnotateTabView#events
             * @type {map}
             */
            events: {
                "click #carousel-prev"    : "moveCarouselPrevious",
                "click #carousel-next"    : "moveCarouselNext",
                "click .page-link"        : "moveCarouselToFrame"
            },

            /**
             * Constructor
             * @alias module:views-annotate-tab.AnnotateTabView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                if (!attr.id || !attr.name || !attr.categories) {
                    throw "Tab id,name and categories must be given as constuctor attributes!";
                }

                // Set the current context for all these functions
                _.bindAll(this,
                  "select",
                  "addCategories",
                  "addCategory",
                  "onAddCategory",
                  "removeOne",
                  "addCarouselItem",
                  "moveCarouselToFrame",
                  "moveCarouselPrevious",
                  "moveCarouselNext",
                  "onCarouselSlid",
                  "onSwitchEditModus",
                  "onExport",
                  "onImport",
                  "chooseFile",
                  "switchEditModus",
                  "insertCategoryView",
                  "initCarousel",
                  "render");

                this.categories                = attr.categories;
                this.filter                    = attr.filter;
                this.roles                     = attr.roles;
                this.defaultCategoryAttributes = attr.attributes;

                this.categoryViews = [];

                if (attr.edit) {
                    this.edit = true;
                }

                this.currentPage = 0;
                this.render();

                this.addCategories(this.categories, this.filter);

                this.titleLink = attr.button;
                this.titleLink.find("i.add").on("click", this.onAddCategory);
                this.titleLink.find("i.export").on("click", this.onExport);
                this.titleLink.find("i.import").on("click", this.chooseFile);

                this.titleLink.find(".file").on("click", function (event) {
                    // We need to stop the propagation of this click event,
                    // which we trigger ourselves in `chooseFile`
                    // to open the file dialog,
                    // up to the tab itself,
                    // where it would be swallowed by Bootstrap
                    // using `preventDefault`.
                    event.stopPropagation();
                });
                this.titleLink.find(".file").on("change", this.onImport);

                this.listenTo(this.categories, "add", this.addCategory);
                this.listenTo(this.categories, "remove", this.removeOne);

                this.listenTo(annotationTool, annotationTool.EVENTS.ANNOTATE_TOGGLE_EDIT, this.onSwitchEditModus);

                this.hasEditMode = _.contains(this.roles, annotationTool.user.get("role"));

                return this;
            },

            /**
             * Display the list
             * @alias module:views-annotate-tab.AnnotateTab#render
             */
            render: function () {

                // We want to keep the event handlers on the subviews intact,
                // so we remove them from the DOM prior to clearing the view;
                // Otherwise, jQUery would remove them.
                _.each(this.categoryViews, function (categoryView) {
                    categoryView.$el.detach();
                });

                this.$el.html(this.template({}, {
                    partials: {
                        "carousel-item": this.itemContainerTemplate,
                        "pagination-bullet": this.paginationBulletTemplate
                    }
                }));

                this.carouselElement = this.$el.find(".carousel");
                this.carouselPagination = this.$el.find(".pagination ul");
                this.categoriesContainer = this.carouselElement.find(".carousel-inner");
                this.itemsCurrentContainer = this.carouselElement.find(".categories-container");

                var categoryViews = this.categoryViews;
                this.categoryViews = [];
                _.each(categoryViews, this.insertCategoryView, this);

                this.updateNavigation();
                this.carouselElement.find(".item").eq(this.currentPage).addClass("active");

                this.initCarousel();
            },

            /**
             * Make the tab ready to be displayed after it having been selected.
             * @alias module:views-annotate-tab.AnnotateTab#select
             */
            select: function () {
                _.each(this.categoryViews, function (view) {
                    view.updateInputWidth();
                }, this);
            },

            /**
             * Add a list of category
             * @alias module:views-annotate-tab.AnnotateTab#addCategories
             * @param {Categories} categories list of categories
             */
            addCategories: function (categories, filter) {
                categories.each(function (category) {
                    if (filter(category)) {
                        this.addCategory(category, categories, { skipTests: true });
                    }
                }, this);
            },

            /**
             * Add a category to the category view
             * @alias module:views-annotate-tab.AnnotateTab#addCategory
             * @param {Category}  category The category to add
             * @param {Categories} [collection]    The collection, if the category is already part of one
             * @param {object} [options] Options to define if the category should be filtered or not (skipTests)
             */
            addCategory: function (category, collection, options) {
                var categoryView;

                if (!options.skipTests && !this.filter(category)) {
                    return;
                }

                categoryView = new CategoryView({
                    category : category,
                    editModus: this.editModus,
                    roles    : this.roles
                });

                this.insertCategoryView(categoryView);
            },

            /**
             * Listener for category creation request from UI
             * @alias module:views-annotate-tab.AnnotateTab#onAddCategory
             */
            onAddCategory: function () {
                var attributes = {
                    name    : i18next.t("annotate.new category name"),
                    settings: {
                        color   : "#" + annotationTool.colorsManager.getNextColor(),
                        hasScale: false
                    }
                };
                this.categories.create(
                    _.extend(attributes, this.defaultCategoryAttributes),
                    {
                        wait: true,
                        success: _.bind(function () {
                            // Move the carousel to the container of the new item
                            this.carouselElement.carousel(Math.floor(
                                this.categories.length / annotationTool.CATEGORIES_PER_TAB
                            ));
                        }, this)
                    }
                );
            },

            /**
             * Remove the given category from the views list
             * @alias module:views-annotate-tab.AnnotateTab#removeOne
             * @param {Category} Category from which the view has to be deleted
             */
            removeOne: function (delCategory) {
                _.find(this.categoryViews, function (catView, index) {
                    if (delCategory === catView.model) {
                        catView.remove();
                        // If this is the last item on the last page
                        if (
                            index === this.categoryViews.length - 1
                                && index % annotationTool.CATEGORIES_PER_TAB === 0
                                && this.currentPage > 0
                        ) {
                            --this.currentPage;
                        }
                        this.categoryViews.splice(index, 1);
                        this.render();
                        return true;
                    }
                    return false;
                }, this);
            },

            /**
             * Insert the given category in the carousel
             * @alias module:views-annotate-tab.AnnotateTab#insertCategoryView
             * @param  {CategoryView} categoryView the view to insert
             */
            insertCategoryView: function (categoryView) {
                // Create a new carousel if the current one is full
                if (this.categoryViews.length > 0 && this.categoryViews.length % annotationTool.CATEGORIES_PER_TAB === 0) {
                    this.addCarouselItem();
                }

                this.categoryViews.push(categoryView);
                this.itemsCurrentContainer.append(categoryView.$el);
            },

            /**
             * Add a new carousel item to this tabe
             * @alias module:views-annotate-tab.AnnotateTab#addCarouselItem
             */
            addCarouselItem: function () {
                var length = this.categoryViews.length,
                    pageNumber = Math.floor(length / annotationTool.CATEGORIES_PER_TAB) + 1;

                this.categoriesContainer.append(this.itemContainerTemplate());

                this.itemsCurrentContainer = this.carouselElement.find(".item").last().find(".categories-container");

                if (pageNumber > 1) {
                    this.carouselPagination.parent().css("display", "block");
                }

                this.carouselPagination.find("li:last").before(this.paginationBulletTemplate({ number: pageNumber }));
            },

            /**
             * Initialize the categories carousel
             * @alias module:views-annotate-tab.AnnotateTab#initCarousel
             */
            initCarousel: function () {
                this.carouselElement
                    .carousel({ interval: false })
                    .on("slid", this.onCarouselSlid);
            },

            /**
             * Move the carousel to item related to the event target
             * @alias module:views-annotate-tab.AnnotateTab#moveCarouselToFrame
             * @param  {Event} event Event object
             */
            moveCarouselToFrame: function (event) {
                var target = $(event.target);
                this.carouselElement.carousel(parseInt(target.data("page"), 10) - 1);
            },

            /**
             * Move carousel to next element
             * @alias module:views-annotate-tab.AnnotateTab#moveCarouselNext
             */
            moveCarouselNext: function () {
                this.carouselElement.carousel("next");
            },

            /**
             * Move carousel to previous element
             * @alias module:views-annotate-tab.AnnotateTab#moveCarouselPrevious
             */
            moveCarouselPrevious: function () {
                this.carouselElement.carousel("prev");
            },

            /**
             * Listener for carousel slid event.
             * @alias module:views-annotate-tab.AnnotateTab#onCarouselSlid
             * @param {Event} event the event to handle
             */
            onCarouselSlid: function (event) {
                this.currentPage = $(event.target).find(".active").index();
                this.updateNavigation();

                _.each(this.categoryViews, function (catView) {
                    catView.updateInputWidth();
                }, this);
            },

            /**
             * Sync the pagination items with the state of the carousel
             * @alias module:views-annotate-tab.AnnotateTab#updateNavigation
             */
            updateNavigation: function() {
                var pageLinks = this.carouselPagination.find(".page-link").parent();
                pageLinks.removeClass("active");
                $(pageLinks[this.currentPage]).addClass("active");
            },

            /**
             * Export the categories from this tab
             * @alias module:views-annotate-tab.AnnotateTab#onExport
             */
            onExport: function () {
                var json = {
                        categories: [],
                        scales    : []
                    },
                    tmpScales = {},
                    tmpScaleId;

                _.each(this.categories.filter(this.filter), function (category) {
                    tmpScaleId = category.attributes.scale_id;

                    if (tmpScaleId && !tmpScales[tmpScaleId]) {
                        tmpScales[tmpScaleId] = annotationTool.video.get("scales").get(tmpScaleId);
                    }

                    json.categories.push(category.toExportJSON());
                }, this);

                _.each(tmpScales, function (scale) {
                    if (scale) {
                        json.scales.push(scale.toExportJSON());
                    }
                });

                saveAs(new Blob([JSON.stringify(json)], { type: "application/octet-stream" }), "export-categories.json");
            },

            /**
             * Import new categories
             * @alias module:views-annotate-tab.AnnotateTab#onImport
             * @param  {event} evt Event object
             */
            onImport: function (evt) {

                var reader = new FileReader(),
                    file = evt.target.files[0],
                    defaultCategoryAttributes = this.defaultCategoryAttributes;

                reader.onload = (function () {
                    return function (e) {
                        // Render thumbnail.
                        var importAsString = e.target.result,
                            importAsJSON;

                        try {
                            importAsJSON = JSON.parse(importAsString);
                            annotationTool.importCategories(importAsJSON, defaultCategoryAttributes);
                        } catch (error) {
                            // TODO pop up an error modal to the user
                            console.warn("The uploaded file is not valid!");
                        }
                    };
                })(file);

                // Read in the image file as a data URL.
                reader.readAsText(file);
            },

            /**
             * Listener for edit modus switch.
             * @alias module:views-annotate-tab.AnnotateTab#onSwitchEditModus
             * @param {boolean} status The new status
             */
            onSwitchEditModus: function (status) {
                if (this.hasEditMode) {
                    this.switchEditModus(status);
                } else if (status) {
                    this.titleLink.css("visibility", "hidden");
                } else {
                    this.titleLink.css("visibility", "visible");
                }
            },

            /**
             * Simulate the a click on file input box to choose a file to import
             * @alias module:views-annotate-tab.AnnotateTab#chooseFile
             */
            chooseFile: function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.titleLink.find(".file").click();
            },

            /**
             *  Switch the edit modus to the given status.
             *  @alias module:views-annotate-tab.AnnotateTab#switchEditModus
             *  @param  {Boolean} status The current status
             */
            switchEditModus: function (status) {
                this.titleLink.toggleClass("edit-on", status);
                this.$el.toggleClass("edit-on", status);
                this.editModus = status;
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             * @alias module:views-annotate-tab.AnnotateTab#remove
             */
            remove: function () {
                _.each(this.categoryViews, function (categoryView) {
                    categoryView.remove();
                });
                Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        return AnnotateTab;
    }
);
