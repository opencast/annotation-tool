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
        "util",
        "access",
        "views/annotate-label",
        "views/category-modal",
        "templates/annotate-category"
    ],
    function (
        $,
        _,
        Backbone,
        util,
        ACCESS,
        LabelView,
        CategoryModal,
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
                "click .edit": "onEditCategory",
                "click .delete": "onDeleteCategory"
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
                    "addLabels",
                    "addLabel",
                    "render",
                    "removeOne",
                    "updateInputWidth"
                );

                // Type use for delete operation
                this.typeForDelete = annotationTool.deleteOperation.targetTypes.CATEGORY;
                this.labelViews = [];

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
                this.listenTo(labels, "change:deleted_at", this.removeOne);
                this.listenTo(this.model, "change", this.onChange);

                $(window).on("resize.annotate-category", this.updateInputWidth);

                this.nameInput = this.$el.find(".catItem-header input");

                return this;
            },

            /**
             * Update the size of all the input for the label value
             */
            updateInputWidth: function () {
                this.$el.find(".catItem-header").find("input").width("100%");

                this.delegateEvents(this.events);
            },

            /**
             * Listener for the "change" event from the view model (Category)
             */
            onChange: function () {
                _.each(this.labelViews, function (labelView) {
                    labelView.changeCategory();
                }, this);
                this.render();
            },

            /**
             * Show/hide categories
             */
            toggleVisibility: function (event) {
                this.model.toggleVisibility();
            },

            /**
             * Listener for category deletion request from UI
             * @param {Event} event
             */
            onDeleteCategory: function () {
                annotationTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Shows the edit modal
             */
            onEditCategory: function () {
                new CategoryModal({ model: this.model }).show();
            },

            /**
             * Add a collection of labels to this view
             * @param {Labels} labels Collection of label to add
             */
            addLabels: function (labels) {
                labels.each(function (label) {
                    if (!label.get("deleted_at")) {
                        this.addLabel(label, false);
                    }
                }, this);
            },

            /**
             * Add one label to this view
             * @param {Label} label The label to add
             * @param {boolean} single Define if this is part of a list insertion (false) or a single insertion (true)
             */
            addLabel: function (label) {
                var labelView = new LabelView({ label: label });

                this.labelViews.push(labelView);

                this.$labelsContainer.append(labelView.render().$el);
            },

            /**
             * Potentially remove the given category from the views list
             * @param {Category} Category from which the view has to be deleted
             */
            removeOne: function (delLabel, deleted) {
                if (deleted == null) {
                    return;
                }

                _.find(this.labelViews, function (labelView, index) {
                    if (delLabel === labelView.model) {
                        // This event fires when the "deleted_at" attribute of the label model changes
                        // Ignore this event when the attribute is just being initialized
                        if (labelView.model.changed.deleted_at == null) {
                            return false;
                        }

                        labelView.remove();
                        this.labelViews.splice(index, 1);
                        return true;
                    }
                    return false;
                }, this);
            },

            /**
             * Draw the view
             * @return {CategoryView} this category view
             */
            render: function () {
                var modelJSON = this.model.toJSON();

                if (modelJSON.access === ACCESS.PUBLIC) {
                    modelJSON.canEdit = modelJSON.isMine || annotationTool.user.get("isAdmin");
                } else {
                    modelJSON.canEdit = modelJSON.isMine;
                }

                this.undelegateEvents();

                _.each(this.labelViews, function (view) {
                    view.$el.detach();
                }, this);

                this.$el.html(this.template(modelJSON));

                this.$labelsContainer = this.$el.find(".catItem-labels");

                _.each(this.labelViews, function (view) {
                    this.$labelsContainer.append(view.$el);
                }, this);

                this.nameInput = this.$el.find(".catItem-header input");

                if (_.isString(this.model.attributes.settings)) {
                    this.model.attributes.settings = util.parseJSONString(this.model.attributes.settings);
                }

                this.$el.width((100 / annotationTool.CATEGORIES_PER_TAB) + "%");

                this.updateInputWidth();

                this.delegateEvents(this.events);

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

                Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        return CategoryView;
    }
);
