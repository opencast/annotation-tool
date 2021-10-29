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
 * A module representing the category view in the annotate part
 * @module views-annotate-category
 */
define(
    [
        "jquery",
        "underscore",
        "backbone",
        "i18next",
        "util",
        "access",
        "views/annotate-label",
        "templates/annotate-category",
        "jquery.colorPicker"
    ],
    function (
        $,
        _,
        Backbone,
        i18next,
        util,
        ACCESS,
        LabelView,
        Template
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-category
         * @augments module:Backbone.View
         */
        var CategoryView = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @type {string}
             */
            className: "span1 category-item",

            /**
             * Prefix for the item id
             * @type {string}
             */
            ID_PREFIX: "catItem-",

            /**
             * Define if the view is or not in edit modus.
             * @type {boolean}
             */
            editModus: false,

            /**
             * View template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Events to handle by the annotate-category view
             * @type {map}
             */
            events: {
                "click .catItem-header i.visibility": "toggleVisibility",
                "click .catItem-header i.delete": "onDeleteCategory",
                "click .catItem-header i.scale": "editScale",
                "click .catItem-header button[data-access]": "onChangeAccess",
                "focusout .catItem-header input": "onFocusOut",
                "keydown .catItem-header input": "onKeyDown",
                "click .catItem-add": "onCreateLabel",
                "click .catItem-header i.toggle-series": "toggleSeries"
            },

            /**
             * Constructor
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                var labels;

                if (!attr.category || !_.isObject(attr.category)) {
                    throw "Category object must be given as constuctor attribute!";
                }

                // Set the current context for all these functions
                _.bindAll(
                    this,
                    "onDeleteCategory",
                    "addLabels",
                    "addLabel",
                    "render",
                    "switchEditModus",
                    "onFocusOut",
                    "onKeyDown",
                    "onColorChange",
                    "removeOne",
                    "onCreateLabel",
                    "editScale",
                    "updateInputWidth"
                );

                // Define the colors (global setting for all color pickers)
                $.fn.colorPicker.defaults.colors = annotationTool.colorsManager.getColors();

                // Type use for delete operation
                this.typeForDelete = annotationTool.deleteOperation.targetTypes.CATEGORY;
                this.roles = attr.roles;
                this.labelViews = [];

                if (attr.editModus) {
                    this.editModus = attr.editModus;
                }

                this.el.id = this.ID_PREFIX + attr.category.get("id");
                // Not our category but someone elses? Should not be clickable
                if (attr.category.get("settings").createdAsMine && !attr.category.isMine()) {
                    this.$el.addClass("read-only");
                }
                this.model = attr.category;

                this.render();
                this.addLabels(this.model.get("labels"));

                labels = this.model.get("labels");
                this.listenTo(labels, "add", this.addLabel);
                this.listenTo(labels, "remove", this.removeOne);
                this.listenTo(this.model, "change", this.onChange);

                if (_.contains(this.roles, annotationTool.user.get("role"))) {
                    this.listenTo(annotationTool, annotationTool.EVENTS.ANNOTATE_TOGGLE_EDIT, this.switchEditModus);
                }

                $(window).on("resize.annotate-category", this.updateInputWidth);

                this.nameInput = this.$el.find(".catItem-header input");

                this.tooltipSelector = ".category-access[data-id=" + this.model.id + "] button";

                $("body").on(
                    "click",
                    this.tooltipSelector,
                    _.bind(function (event) {
                        this.onChangeAccess(event);
                    }, this)
                );

                $(document).on(
                    "click.accessTooltip",
                    _.bind(function (event) {
                        if (this.visibilityButton && (
                            !this.visibilityButton.has(event.target).length
                        )) {
                            this.visibilityButton.tooltip("hide");
                        }
                    }, this)
                );

                return this;
            },

            /**
             * Callback for modal spawned by toggleSeries.
             * Turns a series category back to a video category
             * @param {Id of the series} categorySeriesCategoryId
             */
            toVideoCategory: function (categorySeriesCategoryId) {
                this.model.tmpSeriesCategoryId = categorySeriesCategoryId;
                this.model.set("series_extid", "");
                this.model.set("series_category_id", "");
                this.model.save(null, { wait: true });
            },

            /**
             * Toggle the category between belonging to an event and belonging
             * to a series
             */
            toggleSeries: function () {
                var categorySeriesId = this.model.get("series_extid");
                var seriesCategoryId = this.model.get("series_category_id");
                var videoSeriesId = annotationTool.video.get("series_extid");

                if (seriesCategoryId) {
                    // Remove from series
                    // Display modal. If user accepts, execute toVideoCategory callback
                    annotationTool.seriesCategoryOperation.start(this, seriesCategoryId);

                } else if (!seriesCategoryId && videoSeriesId) {
                    // If there's a scale, show an error message instead.
                    // This doesn't really belong on scaleEditor, but I don't want to create
                    // a whole new class for a simple error modal.
                    if (this.model.get("settings").hasScale) {
                        annotationTool.scaleEditor.showWarning({
                            title: i18next.t("scale editor.warning.name"),
                            message: i18next.t("scale editor.warning.messageScaleOnSeriesCategory")
                        });
                    } else {
                        // Add to series
                        this.model.set("series_extid", videoSeriesId);
                        this.model.set("series_category_id", this.model.id);
                    }
                    this.model.save(null, { wait: true });
                }
            },

            /**
             * Update the size of all the input for the label value
             */
            updateInputWidth: function () {
                var $headerEl = this.$el.find(".catItem-header");
                var titleWidth;

                if (this.editModus) {
                    titleWidth = $headerEl.width() - (
                        $headerEl.find(".colorPicker-picker").outerWidth() +
                            $headerEl.find(".delete").outerWidth() +
                            $headerEl.find(".scale").outerWidth() +
                            30
                    );

                    $headerEl.find("input").width(titleWidth);
                } else {
                    $headerEl.find("input").width("100%");
                }

                _.each(this.labelViews, function (labelView) {
                    labelView.updateInputWidth();
                }, this);

                this.delegateEvents(this.events);
            },

            /**
             * Listener for the "change" event from the view model (Category)
             */
            onChange: function () {
                _.each(this.labelViews, function (labelView) {
                    labelView.changeCategory(this.model.toJSON());
                }, this);
                this.render();
            },

            /**
             * Change the access level of a category
             * @param {Event} event The event causing the change
             */
            onChangeAccess: function (event) {
                this.model.save({ access: ACCESS.parse($(event.currentTarget).data("access")) });
            },

            /**
             * Switch the edit modus to the given status.
             * @param {boolean} status The current status
             */
            switchEditModus: function (status) {
                this.editModus = status;

                if (status) {
                    this.$el.find("input[disabled=\"disabled\"]").removeAttr("disabled");
                } else {
                    this.$el.find("input").attr("disabled", "disabled");
                }

                // Wait that style are applied
                setTimeout(this.updateInputWidth, 20);
            },

            /**
             * Show/hide categories
             */
            toggleVisibility: function (event) {
                this.model.toggleVisibility();
            },

            /**
             * Open the scales editor modal
             */
            editScale: function () {
                if (this.model.get("series_category_id")) {
                    // Workaround for scales and series categories
                    annotationTool.scaleEditor.showWarning({
                        title: i18next.t("scale editor.warning.name"),
                        message: i18next.t("scale editor.warning.message")
                    });
                } else {
                    annotationTool.scaleEditor.show(this.model, this.model.get("access"));
                }
            },

            /**
             * Listener for category deletion request from UI
             * @param {Event} event
             */
            onDeleteCategory: function () {
                annotationTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Add a collection of labels to this view
             * @param {Labels} labels Collection of label to add
             */
            addLabels: function (labels) {
                labels.each(function (label) {
                    this.addLabel(label, false);
                }, this);
            },

            /**
             * Add one label to this view
             * @param {Label} label The label to add
             * @param {boolean} single Define if this is part of a list insertion (false) or a single insertion (true)
             */
            addLabel: function (label) {
                var labelView = new LabelView({
                    label: label,
                    editModus: this.editModus,
                    roles: this.roles
                });

                this.labelViews.push(labelView);

                this.$labelsContainer.append(labelView.render().$el);

                labelView.updateInputWidth();
            },

            /**
             * Create a new label in the category of this view
             */
            onCreateLabel: function () {
                this.model.get("labels").create({
                    value: i18next.t("new label defaults.description"),
                    abbreviation: i18next.t("new label defaults.abbreviation"),
                    category: this.model,
                    access: this.model.get("access")
                }, { wait: true });
            },

            /**
             * Remove the given category from the views list
             * @param {Category} Category from which the view has to be deleted
             */
            removeOne: function (delLabel) {
                _.find(this.labelViews, function (labelView, index) {
                    if (delLabel === labelView.model) {
                        labelView.remove();
                        this.labelViews.splice(index, 1);
                        return true;
                    }
                    return false;
                }, this);
            },

            /**
             * Listener for focus out event on name field
             */
            onFocusOut: function () {
                this.model.set("name", _.escape(this.nameInput.val()));
                this.model.save(null, { wait: true });
            },

            /**
             * Listener for key down event on name field
             */
            onKeyDown: function (e) {
                e.stopImmediatePropagation();

                if (e.keyCode === 13) { // If "return" key
                    this.model.set("name", _.escape(this.nameInput.val()), { wait: true });
                    this.model.save(null, { wait: true });
                } else if (e.keyCode === 39 && this.getCaretPosition(e.target) === e.target.value.length ||
                           e.keyCode === 37 && this.getCaretPosition(e.target) === 0) {
                    // Avoid scrolling through arrows keys
                    e.preventDefault();
                }
            },

            /**
             * Get the position of the caret in the given input element
             * @param  {DOMElement} inputElement The given element with focus
             * @return {integer} The posisiton of the carret
             */
            getCaretPosition: function (inputElement) {
                return inputElement.selectionStart;
            },

            /**
             * Listener for color selection through color picker
             * @param {string} id Id of the colorpicker element
             * @param {string} newValue Value of the selected color
             */
            onColorChange: function (id, newValue) {
                this.model.setColor(newValue);
                this.model.save();
            },

            /**
             * Draw the view
             * @return {CategoryView} this category view
             */
            render: function () {
                if (this.visibilityButton) {
                    this.visibilityButton.tooltip("destroy");
                }

                var modelJSON = this.model.toJSON();

                this.undelegateEvents();

                modelJSON.notEdit = !this.editModus;
                modelJSON.access = ACCESS.render(this.model.get("access"));

                _.each(this.labelViews, function (view) {
                    view.$el.detach();
                }, this);

                this.$el.html(this.template(modelJSON));

                this.$labelsContainer = this.$el.find(".catItem-labels");

                _.each(this.labelViews, function (view) {
                    this.$labelsContainer.append(view.$el);
                    view.updateInputWidth();
                }, this);

                this.nameInput = this.$el.find(".catItem-header input");

                if (_.isString(this.model.attributes.settings)) {
                    this.model.attributes.settings = util.parseJSONString(this.model.attributes.settings);
                }

                this.$el.find(".colorpicker").colorPicker({
                    pickerDefault: this.model.attributes.settings.color.replace("#", ""),
                    onColorChange: this.onColorChange
                });

                this.$el.find(".colorPicker-picker").addClass("edit");

                this.$el.width((100 / annotationTool.CATEGORIES_PER_TAB) + "%");

                this.updateInputWidth();

                this.delegateEvents(this.events);

                this.visibilityButton = this.$el.find(".category-access")
                    .tooltip({
                        container: "body",
                        html: true
                    });

                return this;
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             */
            remove: function () {
                _.each(this.labelViews, function (labelView) {
                    labelView.remove();
                });
                $(window).off(".annotate-category");

                $(document).off("click.accessTooltip");
                $("body").off("click", this.tooltipSelector);
                if (this.visibilityButton) {
                    this.visibilityButton.tooltip("destroy");
                }

                Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        return CategoryView;
    }
);
