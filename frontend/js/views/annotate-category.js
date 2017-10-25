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
 * @requires jquery
 * @requires underscore
 * @requires backbone
 * @requires i18next
 * @requires util
 * @requires views-annotate-label
 * @requires templates/annotate-category.tmpl
 * @requires handlebars
 * @requires jquery.colorPicker
 */
define(["jquery",
        "underscore",
        "backbone",
        "i18next",
        "util",
        "views/annotate-label",
        "templates/annotate-category",
        "handlebarsHelpers",
        "jquery.colorPicker"],


    function ($, _, Backbone, i18next, util, LabelView, Template) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-category
         * @augments module:Backbone.View
         * @alias module:views-annotate-category.CategoryView
         */
        var CategoryView = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-annotate-category.Category#tagName
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @alias module:views-annotate-category.Category#className
             * @type {string}
             */
            className: "span1 category-item",

            /**
             * Prefix for the item id
             * @alias module:views-annotate-category.Category#ID_PREFIX
             * @type {string}
             */
            ID_PREFIX: "catItem-",

            /**
             * Define if the view has been or not deleted
             * @alias module:views-annotate-category.Category#deleted
             * @type {boolean}
             */
            deleted: false,

            /**
             * Define if the view is or not in edit modus.
             * @alias module:views-annotate-category.Category#editModus
             * @type {boolean}
             */
            editModus: false,

            /**
             * View template
             * @alias module:views-annotate-category.Category#template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Events to handle by the annotate-category view
             * @alias module:views-annotate-category.CategoryView#events
             * @type {map}
             */
            events: {
                "click .catItem-header i.visibility": "toggleVisibility",
                "click .catItem-header i.delete": "onDeleteCategory",
                "click .catItem-header i.scale": "editScale",
                "focusout .catItem-header input": "onFocusOut",
                "keydown .catItem-header input": "onKeyDown",
                "click .catItem-add": "onCreateLabel"
            },

            /**
             * Constructor
             * @alias module:views-annotate-category.CategoryView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                var labels;

                if (!attr.category || !_.isObject(attr.category)) {
                    throw "Category object must be given as constuctor attribute!";
                }

                // Set the current context for all these functions
                _.bindAll(this,
                  "onDeleteCategory",
                  "deleteView",
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
                  "updateInputWidth");


                // Define the colors (global setting for all color pickers)
                $.fn.colorPicker.defaults.colors = annotationsTool.colorsManager.getColors();

                // Type use for delete operation
                this.typeForDelete = annotationsTool.deleteOperation.targetTypes.CATEGORY;
                this.roles = attr.roles;
                this.labelViews = [];

                if (attr.editModus) {
                    this.editModus = attr.editModus;
                }

                this.el.id = this.ID_PREFIX + attr.category.get("id");
                this.model = attr.category;

                this.render();
                this.addLabels(this.model.get("labels"));

                labels = this.model.get("labels");
                this.listenTo(labels, "add", this.addLabel);
                this.listenTo(labels, "remove", this.removeOne);
                this.listenTo(labels, "destroy", this.removeOne);
                this.listenTo(this.model, "change", this.onChange);

                if (_.contains(this.roles, annotationsTool.user.get("role"))) {
                    this.listenTo(annotationsTool, annotationsTool.EVENTS.ANNOTATE_TOGGLE_EDIT, this.switchEditModus);
                }

                $(window).bind("resize", this.updateInputWidth);

                //this.render();
                this.nameInput = this.$el.find(".catItem-header input");
                return this;
            },

            /**
             * Update the size of all the input for the label value
             * alias module:views-annotate-category.CategoryView#updateInputWidth
             */
            updateInputWidth: function () {
                var $headerEl   = this.$el.find(".catItem-header"),
                    titleWidth;

                if (this.editModus) {
                    titleWidth = $headerEl.width() - ($headerEl.find(".colorPicker-picker").outerWidth() +
                                                    $headerEl.find(".delete").outerWidth() +
                                                    $headerEl.find(".scale").outerWidth() +
                                                    30);

                    $headerEl.find("input").width(titleWidth);
                }  else {
                    $headerEl.find("input").width("100%");
                }

                _.each(this.labelViews, function (labelView) {
                    labelView.updateInputWidth();
                }, this);

                this.delegateEvents(this.events);
            },

            /**
             * Listener for the "change" event from the view model (Category)
             * @alias module:views-annotate-category.CategoryView#onChange
             */
            onChange: function () {
                _.each(this.labelViews, function (labelView) {
                    labelView.changeCategory(this.model.toJSON());
                }, this);
                this.render();
            },

            /**
             * Switch the edit modus to the given status.
             * @alias module:views-annotate-category.CategoryView#switchEditModus
             * @param  {boolean} status The current status
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
             * @alias module:views-annotate-category.CategoryView#toggleVisibility
             */
            toggleVisibility: function (event) {
                this.model.toggleVisibility();
            },

            /**
             * Open the scales editor modal
             * @alias module:views-annotate-category.CategoryView#editScale
             */
            editScale: function () {
                annotationsTool.scaleEditor.show(this.model, this.model.get("access"));
            },

            /**
             * Listener for category deletion request from UI
             * @alias module:views-annotate-category.CategoryView#onDeleteCategory
             * @param  {Event} event
             */
            onDeleteCategory: function () {
                annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Delete only this category view
             * @alias module:views-annotate-category.CategoryView#deleteView
             */
            deleteView: function () {
                this.remove();
                this.undelegateEvents();
                this.deleted = true;
            },

            /**
             * Add a collection of labels to this view
             * @alias module:views-annotate-category.CategoryView#addLabels
             * @param {Labels} labels Collection of label to add
             */
            addLabels: function (labels) {
                labels.each(function (label) {
                    this.addLabel(label, false);
                }, this);
            },

            /**
             * Add one label to this view
             * @alias module:views-annotate-category.CategoryView#addLabel
             * @param {Label} label  The label to add
             * @param {boolean} single Define if this is part of a list insertion (false) or a single insertion (true)
             */
            addLabel: function (label) {
                var labelView = new LabelView({
                    label        : label,
                    editModus    : this.editModus,
                    roles        : this.roles
                });

                this.labelViews.push(labelView);

                this.$labelsContainer.append(labelView.render().$el);

                labelView.updateInputWidth();
            },

            /**
             * Create a new label in the category of this view
             * @alias module:views-annotate-category.CategoryView#onCreateLabel
             */
            onCreateLabel: function () {
                this.model.get("labels").create({
                    value       : i18next.t("new label defaults.description"),
                    abbreviation: i18next.t("new label defaults.abbreviation"),
                    category    : this.model
                },
                  {wait: true}
                );
            },

            /**
             * Remove the given category from the views list
             * @alias module:views-annotate-category.CategoryView#removeOne
             * @param {Category} Category from which the view has to be deleted
             */
            removeOne: function (delLabel) {
                _.find(this.labelViews, function (labelView, index) {
                        if (delLabel === labelView.model) {
                            labelView.remove();
                            this.labelViews.splice(index, 1);
                            return true;
                        }
                    }, this);
            },

            /**
             * Listener for focus out event on name field
             * @alias module:views-annotate-category.CategoryView#onFocusOut
             */
            onFocusOut: function () {
                this.model.set("name", _.escape(this.nameInput.val()), {wait: true});
                this.model.save({wait: true});
            },

            /**
             * Listener for key down event on name field
             * @alias module:views-annotate-category.CategoryView#onKeyDown
             */
            onKeyDown: function (e) {
                e.stopImmediatePropagation();

                if (e.keyCode === 13) { // If "return" key
                    this.model.set("name", _.escape(this.nameInput.val()), {wait: true});
                    this.model.save({wait: true});
                } else if (e.keyCode === 39 && this.getCaretPosition(e.target) === e.target.value.length ||
                           e.keyCode === 37 && this.getCaretPosition(e.target) === 0) {
                    // Avoid scrolling through arrows keys
                    e.preventDefault();
                }
            },

            /**
             * Get the position of the caret in the given input element
             * @alias module:views-annotate-category.CategoryView#getCaretPosition
             * @param  {DOMElement} inputElement The given element with focus
             * @return {integer}              The posisiton of the carret
             */
            getCaretPosition: function (inputElement) {
                var CaretPos = 0,
                    Sel;

                // IE Support
                if (document.selection) {
                    inputElement.focus();
                    Sel = document.selection.createRange();

                    Sel.moveStart("character", -inputElement.value.length);

                    CaretPos = Sel.text.length;
                } else if (inputElement.selectionStart || inputElement.selectionStart == "0") {
                    // Firefox support
                    CaretPos = inputElement.selectionStart;
                }

                return (CaretPos);
            },

            /**
             * Listener for color selection through color picker
             * @alias module:views-annotate-category.CategoryView#onColorChange
             * @param  {string} id       Id of the colorpicker element
             * @param  {string} newValue Value of the selected color
             */
            onColorChange: function (id, newValue) {
                this.model.setColor(newValue);
                this.model.save({silent: true});
            },

            /**
             * Draw the view
             * @alias module:views-annotate-category.CategoryView#render
             * @return {CategoryView} this category view
             */
            render: function () {
                var modelJSON = this.model.toJSON();

                this.undelegateEvents();

                modelJSON.notEdit = !this.editModus;

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

                this.$el.width((100 / annotationsTool.CATEGORIES_PER_TAB) + "%");

                this.updateInputWidth();

                this.delegateEvents(this.events);

                return this;
            }
        });

        return CategoryView;
    }
);