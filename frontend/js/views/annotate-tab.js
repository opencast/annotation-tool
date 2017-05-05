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

/*jshint multistr: true */
/*global saveAs */

/**
 * A module representing the view for the categories tab
 * @module views-annotate-tab
 * @requires jQuery
 * @requires underscore
 * @requires models-label
 * @requires models-scale
 * @requires models-scalevalue
 * @requires collections-categories
 * @requires collections-labels
 * @requires collections-scalevalues
 * @requires views-annotate-category
 * @requires templates/annotate-tab.tmpl
 * @requires default_scales_set
 * @requires handlebars
 * @requires backbone
 * @requires ACCESS
 * @requires blob
 * @requires blobBuilder
 * @requires swfObject
 * @requires FileSaver
 * @requires jquery.FileReader
 */
define(["jquery",
        "underscore",
        "models/category",
        "models/label",
        "models/scale",
        "models/scalevalue",
        "collections/categories",
        "collections/labels",
        "collections/scalevalues",
        "views/annotate-category",
        "templates/annotate-tab",
        "default_scale_set",
        "handlebarsHelpers",
        "backbone",
        "access",
        "libs/Blob",
        "libs/BlobBuilder",
        "libs/swfobject",
        "libs/FileSaver",
        "jquery.FileReader"],

    function ($, _, Category, Label, Scale, ScaleValue, Categories, Labels, ScaleValues, CategoryView, Template, scalesSet, Handlebars, Backbone, ACCESS) {

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
             * Prefix for the item id
             * @alias module:views-annotate-tab.AnnotateTab#ID_PREFIX
             * @type {string}
             */
            ID_PREFIX: "labelTab-",

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
            itemContainerTemplate: Handlebars.compile("<div class=\"item row-fluid\" id=\"item-{{number}}\">\
                                                        <div class=\"span12\">\
                                                          <div class=\"row-fluid\">\
                                                          </div>\
                                                        </div>\
                                                      </div>"),

            /**
             * Template for pagination link
             * @alias module:views-annotate-tab.AnnotateTab#paginationBulletTemplate
             * @type {HandlebarsTemplate}
             */
            paginationBulletTemplate: Handlebars.compile("<li><a href=\"#\" class=\"page-link\" title=\"{{frame}}\" id=\"page-{{number}}\">{{number}}</a></li>"),

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
                "click .page-link"        : "moveCarouselToFrame",
                "mouseleave .carousel"    : "pauseCarousel"
            },

            /**
             * Default color for new category
             * @alias module:views-annotate-tab.AnnotateTab#DEFAULT_CAT_COLOR
             * @constant
             * @type {string}
             */
            DEFAULT_CAT_COLOR: "#61ae24",

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
                  "generateScales",
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

                this.el.id = this.ID_PREFIX + attr.id;

                this.$el.append(this.template({id: attr.id}));

                this.carouselElement = this.$("#" + attr.id);

                this.carouselPagination = this.$(".pagination ul");

                this.categoriesContainer = this.carouselElement.find(".carousel-inner");

                this.addCategories(this.categories, this.filter);

                this.generateScales();

                this.initCarousel();

                this.titleLink = attr.button;
                this.titleLink.find("i.add").bind("click", this.onAddCategory);
                this.titleLink.find("i.export").bind("click", this.onExport);
                this.titleLink.find("i.import").bind("click", this.chooseFile);

                this.titleLink.find(".file").fileReader({
                    id            : "fileReaderSWFObject",
                    filereader    : "js/libs/filereader.swf",
                    expressInstall: "js/libs/expressInstall.swf",
                    debugMode     : false,
                    callback      : function () {},
                    multiple      : false,
                    label         : "JSON files",
                    extensions    : "*.json"
                });

                this.titleLink.find(".file").bind("change", this.onImport);

                this.listenTo(this.categories, "add", this.addCategory);
                this.listenTo(this.categories, "remove", this.removeOne);
                this.listenTo(this.categories, "destroy", this.removeOne);

                this.listenTo(annotationsTool, annotationsTool.EVENTS.ANNOTATE_TOGGLE_EDIT, this.onSwitchEditModus);

                this.hasEditMode = _.contains(this.roles, annotationsTool.user.get("role"));

                this.delegateEvents(this.events);

                this.carouselElement.carousel(0).carousel("pause");

                return this;
            },

            select: function () {
                console.log("Tab selected");
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
                var filteredCategories;

                if (categories.models) {
                    if (filter) {
                        filteredCategories = categories.where(filter);
                    } else {
                        filteredCategories = categories.models;
                    }
                } else if (_.isArray(categories)) {
                    if (filter) {
                        _.where(categories, filter);
                    } else {
                        filteredCategories = categories;
                    }
                } else {
                    return;
                }

                _.each(filteredCategories, function (category) {
                    this.addCategory(category, categories, {skipTests: true});
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
                var categoryView,
                    testFilter = function () {
                        return _.every(this.filter, function (value, attribute) {
                            if (category.has(attribute) && category.get(attribute) === value) {
                                return true;
                            } else {
                                return false;
                            }
                        });
                    };

                if (!options.skipTests) {
                    if (!$.proxy(testFilter, this)()) {
                        return;
                    }
                }

                if (!this.categories.get(category.id)) {// Add this category if new
                    this.categories.add(category, {silent: true});
                } else if (_.contains(_.pluck(this.categoryViews, "model"), category)) {
                    return;
                }
                // Save new category
                // newCategory.save({silent: true});

                categoryView = new CategoryView({
                    category : category,
                    editModus: this.editModus,
                    roles    : this.roles
                });

                this.categoryViews.push(categoryView);
                this.insertCategoryView(categoryView);
            },

            /**
             * Listener for category creation request from UI
             * @alias module:views-annotate-tab.AnnotateTab#onAddCategory
             */
            onAddCategory: function () {
                var attributes = {
                    name    : "NEW CATEGORY",
                    settings: {
                        color   : "#" + annotationsTool.colorsManager.getNextColor(),
                        hasScale: false
                    }
                };
                this.categories.create(_.extend(attributes, this.defaultCategoryAttributes));
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
                        this.categoryViews.splice(index, 1);
                        this.initCarousel();
                        this.render();
                        return;
                    }
                }, this);
            },

            /**
             * Insert the given category in the carousel
             * @alias module:views-annotate-tab.AnnotateTab#insertCategoryView
             * @param  {CategoryView} categoryView the view to insert
             */
            insertCategoryView: function (categoryView) {
                var itemsLength = this.categoriesContainer.find("div.category-item").length;

                // Create a new carousel if the current one is full
                if ((itemsLength % annotationsTool.CATEGORIES_PER_TAB) === 0) {
                    this.addCarouselItem();
                }

                if (itemsLength === 0) {
                    this.initCarousel();
                }

                this.itemsCurrentContainer.append(categoryView.$el);

                // Move the carousel to the container of the new item
                this.carouselElement.carousel(parseInt(itemsLength / annotationsTool.CATEGORIES_PER_TAB, 10)).carousel("pause");
            },

            /**
             * Add a new carousel item to this tabe
             * @alias module:views-annotate-tab.AnnotateTab#addCarouselItem
             */
            addCarouselItem: function () {
                var length = this.categoriesContainer.find("div.category-item").length,
                    pageNumber = (length - (length % annotationsTool.CATEGORIES_PER_TAB)) / annotationsTool.CATEGORIES_PER_TAB;

                this.categoriesContainer.append(this.itemContainerTemplate({number: (pageNumber + 1)}));

                this.itemsCurrentContainer = this.categoriesContainer.find("div div div.row-fluid").last();

                if (length >= annotationsTool.CATEGORIES_PER_TAB) {
                    this.carouselPagination.parent().css("display", "block");
                }

                this.carouselPagination.find("li:last").before(this.paginationBulletTemplate({number: (pageNumber + 1), frame: pageNumber}));
            },

            /**
             * Initialize the categories carousel
             * @alias module:views-annotate-tab.AnnotateTab#initCarousel
             */
            initCarousel: function () {
                var hasBeenInit = (this.categoriesContainer.find(".active").length > 0);

                if (!hasBeenInit) {
                    this.categoriesContainer.find(".item:first-child").addClass("active");
                    this.carouselPagination.find(".page-link:first").parent().addClass("active");
                }

                this.carouselElement
                      .carousel({interval: false, pause: ""})
                      .bind("slid", this.onCarouselSlid)
                      .carousel("pause");

                if (!hasBeenInit) {
                    this.carouselElement.carousel(0);
                }
            },

            /**
             * Stop the carousel
             * @alias module:views-annotate-tab.AnnotateTab#pauseCarousel
             */
            pauseCarousel: function () {
                this.carouselElement.carousel("pause");
            },

            /**
             * Generate scales with the default set given
             * @alias module:views-annotate-tab.AnnotateTab#generatesScales
             */
            generateScales: function () {
                var scale,
                    scalevalues,
                    findByNameScale = function (scale) {
                        return scalesSet[0].name === scale.get("name");
                    },
                    options = {wait: true};

                // Generate scales
                if (!annotationsTool.video.get("scales").find(findByNameScale)) {
                    scale = annotationsTool.video.get("scales").create({
                        name  : scalesSet[0].name,
                        access: ACCESS.PRIVATE
                    }, options);

                    scalevalues = scale.get("scaleValues");

                    _.each(scalesSet[0].values, function (scalevalue) {
                        scalevalues.create({
                            name : scalevalue.name,
                            value: scalevalue.value,
                            order: scalevalue.order,
                            scale: scale
                        }, options);
                    });
                }
            },

            /**
             * Move the carousel to item related to the event target
             * @alias module:views-annotate-tab.AnnotateTab#moveCarouselToFrame
             * @param  {Event} event Event object
             */
            moveCarouselToFrame: function (event) {
                var target = $(event.target);
                this.carouselElement.carousel(parseInt(target.attr("title"), 10)).carousel("pause");
                this.carouselPagination.find(".page-link").parent().removeClass("active");
                target.parent().addClass("active");
            },

            /**
             * Move carousel to next element
             * @alias module:views-annotate-tab.AnnotateTab#moveCarouselNext
             */
            moveCarouselNext: function () {
                this.carouselElement.carousel("next").carousel("pause");
            },

            /**
             * Move carousel to previous element
             * @alias module:views-annotate-tab.AnnotateTab#moveCarouselPrevious
             */
            moveCarouselPrevious: function () {
                this.carouselElement.carousel("prev").carousel("pause");
            },

            /**
             * Listener for carousel slid event.
             * @alias module:views-annotate-tab.AnnotateTab#onCarouselSlid
             */
            onCarouselSlid: function () {
                var numberStr = this.carouselElement.find("div.active").attr("id");
                numberStr = numberStr.replace("item-", "");
                this.carouselPagination.find(".page-link").parent().removeClass("active");
                this.carouselPagination.find("#page-" + numberStr).parent().addClass("active");
                this.delegateEvents(this.events);

                _.each(this.categoryViews, function (catView) {
                    catView.updateInputWidth();
                }, this);
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

                // If the used browser is Safari, we display a warning message
                if (annotationsTool.isBrowserSafari6()) {
                    annotationsTool.alertWarning("This version of Safari does not currently support the export function. Try it on another browser.");
                    return;
                } else if (annotationsTool.isBrowserIE9()) {
                    annotationsTool.alertWarning("This version of Internet Explorer does not support the export function. Try it on another browser.");
                    return;
                }

                _.each(this.categories.where(this.filter), function (category) {
                    tmpScaleId = category.attributes.scale_id;

                    if (tmpScaleId && !tmpScales[tmpScaleId]) {
                        tmpScales[tmpScaleId] = annotationsTool.video.get("scales").get(tmpScaleId);
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
                            annotationsTool.importCategories(importAsJSON, defaultCategoryAttributes);
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
             * Display the list
             * @alias module:views-annotate-tab.AnnotateTab#render
             */
            render: function () {
                var currentId = this.categoriesContainer.find("div.item.active").attr("id"),
                    currentIndex;

                this.categoriesContainer.empty();
                this.carouselPagination.find("li:not(:last,:first)").remove();

                _.each(this.categoryViews, function (catView) {
                    this.insertCategoryView(catView.render());
                }, this);

                if (currentId) {
                    currentIndex = parseInt(currentId.replace("item-", ""), 10);
                    if (this.categoriesContainer.find("#" + currentId).length === 0) {
                        currentIndex --;
                    }
                    this.categoriesContainer.find("#item-" + currentIndex).addClass("active");
                    this.carouselPagination.find("#page-" + currentIndex).parent().addClass("active");
                }
                this.delegateEvents(this.events);
                return this;
            }

        });
        return AnnotateTab;
    }
);

