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
define(
    [
        "jquery",
        "underscore",
        "backbone",
        "handlebars",
        "views/annotate-category",
        "templates/annotate-tab",
        "filesaver"
    ],
    function (
        $,
        _,
        Backbone,
        Handlebars,
        CategoryView,
        Template
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-tab
         * @augments module:Backbone.View
         */
        var AnnotateTab = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @type {string}
             */
            className: "tab-pane",

            /**
             * List of categories in this tab
             * @type {Categories}
             */
            categories: undefined,

            /**
             * List of category views in this tab
             * @type {array}
             */
            categoryViews: undefined,

            /**
             * Tab template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Template for the carousel items
             * @type {HandlebarsTemplate}
             */
            itemContainerTemplate: Handlebars.compile("<div class=\"item row-fluid\">\
                                                          <div class=\"row-fluid categories-container\">\
                                                          </div>\
                                                      </div>"),

            /**
             * Template for pagination link
             * @type {HandlebarsTemplate}
             */
            paginationBulletTemplate: Handlebars.compile("<li><button type=\"button\" class=\"page-link\" data-page=\"{{number}}\">{{number}}</button></li>"),

            /**
             * Element containing the "carousel"
             * @type {DOMElement}
             */
            carouselElement: undefined,

            /**
             * Element containing the pagination
             * @type {DOMElement}
             */
            carouselPagination: undefined,

            /**
             * Element containing the all the categories
             * @type {DOMElement}
             */
            categoriesContainer: undefined,

            /**
             * Current container for categories group in the carousel
             * @type {DOMElement}
             */
            itemsCurrentContainer: undefined,

            /**
             * Element represeting the tab top link
             * @type {DOMElement}
             */
            titleLink: undefined,

            /**
             * Events to handle by the annotate-tab view
             * @type {map}
             */
            events: {
                "click #carousel-prev": "moveCarouselPrevious",
                "click #carousel-next": "moveCarouselNext",
                "click .page-link": "moveCarouselToFrame"
            },

            /**
             * Constructor
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                if (!attr.id || !attr.name) {
                    throw "Tab id and name must be given as constuctor attributes!";
                }

                // Set the current context for all these functions
                _.bindAll(
                    this,
                    "select",
                    "addCategories",
                    "addCategory",
                    "removeOne",
                    "addCarouselItem",
                    "moveCarouselToFrame",
                    "moveCarouselPrevious",
                    "moveCarouselNext",
                    "onCarouselSlid",
                    "onExport",
                    "onImport",
                    "chooseFile",
                    "insertCategoryView",
                    "initCarousel",
                    "render"
                );

                this.categories = annotationTool.video.get("categories");
                this.defaultCategoryAttributes = attr.attributes;

                this.filter = function (category) {
                    return !category.get("deleted_at") && attr.filter(category);
                };

                this.categoryViews = [];

                if (attr.edit) {
                    this.edit = true;
                }

                this.currentPage = 0;
                this.render();

                this.addCategories(this.filter);

                this.titleLink = attr.button;
                this.titleLink.find("button.export").on("click", this.onExport);
                this.titleLink.find("button.import").on("click", this.chooseFile);

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

                this.listenTo(this.categories, "add", function (category) {
                    if (!this.filter(category)) return;
                    this.addCategory(category);
                    if (attr.container.activeTab === this) {
                        this.carouselElement.carousel(Math.floor(
                            this.categories.length / annotationTool.CATEGORIES_PER_TAB
                        ));
                    }
                });
                this.listenTo(this.categories, "change:deleted_at", this.removeOne);

                return this;
            },

            /**
             * Display the list
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
             */
            select: function () {
                _.each(this.categoryViews, function (view) {
                    view.updateInputWidth();
                }, this);
            },

            /**
             * Add a list of category
             * @param {Categories} categories list of categories
             */
            addCategories: function (filter) {
                this.categories.chain()
                    .filter(filter)
                    .each(this.addCategory);
            },

            /**
             * Add a category to the category view
             * @param {Category} category The category to add
             */
            addCategory: function (category, collection, options) {
                this.insertCategoryView(new CategoryView({ category: category }));
            },

            /**
             * Remove the given category from the views list
             * @param {Category} Category from which the view has to be deleted
             */
            removeOne: function (delCategory, deleted) {
                if (deleted == null) {
                    return;
                }

                _.find(this.categoryViews, function (catView, index) {
                    if (delCategory === catView.model) {
                        // This event fires when the "deleted_at" attribute of the model changes
                        // Ignore this event when the attribute is just being initialized
                        if (catView.model.changed.deleted_at == null) {
                            return false;
                        }

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
             * @param {CategoryView} categoryView the view to insert
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
             */
            addCarouselItem: function () {
                var length = this.categoryViews.length;
                var pageNumber = Math.floor(length / annotationTool.CATEGORIES_PER_TAB) + 1;

                this.categoriesContainer.append(this.itemContainerTemplate());

                this.itemsCurrentContainer = this.carouselElement.find(".item").last().find(".categories-container");

                if (pageNumber > 1) {
                    this.carouselPagination.parent().css("display", "block");
                }

                this.carouselPagination.find("li:last").before(this.paginationBulletTemplate({ number: pageNumber }));
            },

            /**
             * Initialize the categories carousel
             */
            initCarousel: function () {
                this.carouselElement
                    .carousel({ interval: false })
                    .on("slid", this.onCarouselSlid);
            },

            /**
             * Move the carousel to item related to the event target
             * @param {Event} event Event object
             */
            moveCarouselToFrame: function (event) {
                var target = $(event.target);
                this.carouselElement.carousel(parseInt(target.data("page"), 10) - 1);
            },

            /**
             * Move carousel to next element
             */
            moveCarouselNext: function () {
                this.carouselElement.carousel("next");
            },

            /**
             * Move carousel to previous element
             */
            moveCarouselPrevious: function () {
                this.carouselElement.carousel("prev");
            },

            /**
             * Listener for carousel slid event.
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
             */
            updateNavigation: function () {
                var pageLinks = this.carouselPagination.find(".page-link").parent();
                pageLinks.removeClass("active");
                $(pageLinks[this.currentPage]).addClass("active");
            },

            /**
             * Export the categories from this tab
             */
            onExport: function () {
                var json = {
                    categories: [],
                    scales: []
                };
                var tmpScales = {};

                this.categories.chain().filter(this.filter).each(function (category) {
                    var tmpScaleId = category.attributes.scale_id;

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
             * @param {event} evt Event object
             */
            onImport: function (evt) {

                // unfocus menu
                document.children[0].click();

                var reader = new FileReader();
                var file = evt.target.files[0];
                var defaultCategoryAttributes = this.defaultCategoryAttributes;

                reader.onload = (function () {
                    return function (e) {
                        try {
                            annotationTool.importCategories(
                                JSON.parse(e.target.result),
                                defaultCategoryAttributes
                            );
                        } catch (error) {
                            // TODO pop up an error modal to the user
                            console.warn("The uploaded file is not valid!", error);
                        }
                    };
                })(file);

                // Read in the image file as a data URL.
                reader.readAsText(file);
            },

            /**
             * Simulate the a click on file input box to choose a file to import
             */
            chooseFile: function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.titleLink.find(".file").click();
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
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
