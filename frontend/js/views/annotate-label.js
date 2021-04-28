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
 * A module representing the label view for each item contained in annotate window
 * @module views-annotate-label
 */
define(["jquery",
        "underscore",
        "backbone",
        "templates/annotate-label"],

    function ($, _, Backbone, Template) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-label
         * @augments module:Backbone.View
         * @alias module:views-annotate-label.LabelView
         */
        var LabelView = Backbone.View.extend({

            /**
             * CSS className for the scale container
             * @alias module:views-annotate-label.Category#CLASS_SCALE
             * @type {object}
             */
            CLASS_SCALE: {
                ENABLED: "scale-enabled",
                DISABLED: "scale-disabled"
            },

            /**
             * Tag name from the view element
             * @alias module:views-annotate-label.Category#tagName
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @alias module:views-annotate-label.Category#className
             * @type {string}
             */
            className: "label-item",

            /**
             * Prefix for the item id
             * @alias module:views-annotate-label.Category#ID_PREFIX
             * @type {string}
             */
            ID_PREFIX: "labelItem-",

            /**
             * Define if the view is or not in edit modus.
             * @alias module:views-annotate-label.Category#editModus
             * @type {boolean}
             */
            editModus: false,

            /**
             * List of categories view in this tab
             * @alias module:views-annotate-label.Category#labels
             * @type {array}
             */
            labels: [],

            /**
             * View template
             * @alias module:views-annotate-label.Category#template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Events to handle by the annotate-label view
             * @alias module:views-annotate-label.LabelView#events
             * @type {map}
             */
            events: {
                "click"                         : "annotate",
                "click i.delete"                : "onDeleteLabel",
                "focusout .item-value"          : "onFocusOut",
                "keydown .item-value"           : "onKeyDown",
                "focusout .item-abbreviation"   : "onFocusOut",
                "keydown .item-abbreviation"    : "onKeyDown",
                "click .scaling li"             : "annnotateWithScaling"
            },

            /**
             * Constructor
             * @alias module:views-annotate-label.LabelView#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                var scaleId;

                if (!attr.label || !_.isObject(attr.label)) {
                    throw "Label object must be given as constuctor attribute!";
                }

                // Set the current context for all these functions
                _.bindAll(this, "render",
                                "annotate",
                                "switchEditModus",
                                "onSwitchEditModus",
                                "onFocusOut",
                                "onKeyDown",
                                "onDeleteLabel",
                                "annnotateWithScaling",
                                "updateAbbreviation",
                                "updateInputWidth");

                // Type use for delete operation
                this.typeForDelete = annotationTool.deleteOperation.targetTypes.LABEL;

                // Change the edit modus, if this config is given as parameter
                if (attr.editModus) {
                    this.editModus = attr.editModus;
                }

                this.model = attr.label;
                this.roles = attr.roles;
                this.isScaleEnable = attr.isScaleEnable;

                this.el.id = this.ID_PREFIX + this.model.get("id");

                this.listenTo(this.model, "change", this.render);

                this.setupScaling(this.model.get("category"));

                if (_.contains(this.roles, annotationTool.user.get("role"))) {
                    this.listenTo(annotationTool, annotationTool.EVENTS.ANNOTATE_TOGGLE_EDIT, this.onSwitchEditModus);
                }

                return this.render();
            },

            updateAbbreviation: function () {
                var abbreviation = this.model.get("abbreviation"),
                    value = this.model.get("value");

                if (_.isUndefined(abbreviation) || abbreviation === "" || abbreviation === value.substr(0, 3).toUpperCase()) {
                    this.$el.find("input.item-abbreviation").val(this.$el.find("input.item-value").val().substr(0, 3).toUpperCase());
                }
            },

            /**
             * Create a new annotation at the current playedhead time with a scaling value
             * @alias module:views-annotate-label.LabelView#annotateWithScaling
             * @param {event} event Event related to this action
             */
            annnotateWithScaling: function (event) {
                event.stopImmediatePropagation();

                var id = event.target.getAttribute("value"),
                    scalevalue = this.scaleValues.get(id),
                    annotation,
                    params = {
                        text: this.model.get("value"),
                        label: this.model,
                        scalevalue: scalevalue.toJSON()
                    };

                annotation = annotationTool.createAnnotation(params);
            },

            /**
             * Annotate the video with this label but without scale value
             * @alias module:views-annotate-label.LabelView#annotate
             * @param {event} event Event related to this action
             */
            annotate: function (event) {
                event.stopImmediatePropagation();

                if (this.editModus || this.isScaleEnable) {
                    return;
                }

                var annotation = annotationTool.createAnnotation({
                    text : this.model.get("value"),
                    label: this.model
                });
            },

            /**
             * Listener for edit modus switch.
             * @alias module:views-annotate-label.LabelView#onSwitchEditModus
             * @param {event} event Event related to this action
             */
            onSwitchEditModus: function (status) {
                this.switchEditModus(status);
            },

            /**
             * Switch the edit modus to the given status.
             * @alias module:views-annotate-label.LabelView#switchEditModus
             * @param  {boolean} status The current status
             */
            switchEditModus: function (status) {
                this.editModus = status;
            },

            /**
             * Listener for "change" event on the label category
             * @alias module:views-annotate-label.LabelView#changeCategory
             * @param {object} category The updated category
             */
            changeCategory: function (category) {
                this.setupScaling(category);
                this.render();
            },

            /**
             * Set up scale values according to category
             * @alias module:views-annotate-label.LabelView#setupScaling
             * @param {object} category The updated category
             */
            setupScaling: function (category) {
                var scaleId = category.scale_id || (category.scale && category.scale.id),
                    scale = scaleId && annotationTool.video.get("scales").get(scaleId);

                if (scale) {
                    this.scaleValues = scale.get("scaleValues");
                }

                this.isScaleEnable = (category.settings && category.settings.hasScale);
            },

            /**
             * Listener for focus out event on name field
             * @alias module:views-annotate-label.LabelView#onFocusOut
             * @param {event} e Event related to this action
             */
            onFocusOut: function () {
                this.model.set({
                    "value"        : _.escape(this.$el.find("input.item-value").val()),
                    "abbreviation" : _.escape(this.$el.find("input.item-abbreviation").val())
                });
                this.model.save();
            },

            /**
             * Listener for key down event on name field
             * @alias module:views-annotate-label.LabelView#onKeyDown
             * @param {event} e Event related to this action
             */
            onKeyDown: function (e) {
                e.stopImmediatePropagation();

                if ($(e.target).hasClass("item-value")) {
                    this.updateAbbreviation(e);
                }

                if (e.keyCode === 13) { // If "return" key
                    this.model.set({
                        "value"        : _.escape(this.$el.find("input.item-value").val()),
                        "abbreviation" : _.escape(this.$el.find("input.item-abbreviation").val())
                    });
                    this.model.save();
                } else if (e.keyCode === 39 && this.getCaretPosition(e.target) === e.target.value.length ||
                           e.keyCode === 37 && this.getCaretPosition(e.target) === 0) {
                    // Avoid scrolling through arrows keys
                    e.preventDefault();
                }
            },

            /**
             * Get the position of the caret in the given input element
             * @alias module:views-annotate-label.LabelView#getCaretPosition
             * @param  {DOMElement} inputElement The given element with focus
             * @return {integer}              The posisiton of the carret
             */
            getCaretPosition: function (inputElement) {
                return inputElement.selectionStart;
            },

            /**
             * Listener for label deletion request from UI
             * @alias module:views-annotate-label.LabelView#onDeleteLabel
             */
            onDeleteLabel: function () {
                annotationTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Update the size of all the input for the label value
             * alias module:views-annotate-category.CategoryView#updateInputWidth
             */
            updateInputWidth: function () {
                var width = this.$el.width() - (this.$el.find("input.item-abbreviation").outerWidth() + 25);

                if (this.editModus) {
                    width -= this.$el.find("i.delete").outerWidth();
                }

                this.$el.find("input.item-value").width(width);

                this.delegateEvents(this.events);
            },

            /**
             * Draw the view
             * @alias module:views-annotate-label.LabelView#render
             * @return {LabelView} this label view
             */
            render: function () {
                var modelJSON = this.model.toJSON();

                modelJSON.notEdit = !this.editModus;
                if (!this.isScaleEnable) {
                    if (modelJSON.scale_id) {
                        delete modelJSON.scale_id;
                    }
                } else if (this.scaleValues) {
                    modelJSON.scaleValues = this.scaleValues.sort().toJSON();
                }

                this.$el.html(this.template(modelJSON));

                // Add CSS class to label about scale usage
                if (this.isScaleEnable) {
                    this.$el.removeClass(this.CLASS_SCALE.DISABLED);
                    this.$el.addClass(this.CLASS_SCALE.ENABLED);
                } else {
                    this.$el.removeClass(this.CLASS_SCALE.ENABLED);
                    this.$el.addClass(this.CLASS_SCALE.DISABLED);
                }

                this.updateInputWidth();
                return this;
            }

        });
        return LabelView;
    }
);
