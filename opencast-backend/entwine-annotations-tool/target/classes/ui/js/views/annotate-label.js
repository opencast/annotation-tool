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
 * @requires jQuery
 * @requires models-annotation
 * @requires templates/annotate-label.tmpl
 * @requires handlebars
 * @requires jquery.colorPicker
 * @requires backbone
 */
define(["jquery",
        "models/annotation",
        "text!templates/annotate-label.tmpl",
        "handlebarsHelpers",
        "backbone"],

    function ($, Annotation, Template, Handlebars, Backbone) {

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
             * Define if the view has been or not deleted
             * @alias module:views-annotate-label.Category#deleted
             * @type {boolean}
             */
            deleted: false,

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
             * @type {Handlebars template}
             */
            template: Handlebars.compile(Template),

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
                                "changeCategory",
                                "updateInputWidth");

                // Type use for delete operation
                this.typeForDelete = annotationsTool.deleteOperation.targetTypes.LABEL;

                // Change the edit modus, if this config is given as parameter
                if (attr.editModus) {
                    this.editModus = attr.editModus;
                }

                this.model = attr.label;
                this.roles = attr.roles;
                this.isScaleEnable = attr.isScaleEnable;

                // Add backbone events to the model
                _.extend(this.model, Backbone.Events);

                this.el.id = this.ID_PREFIX + this.model.get("id");

                this.listenTo(this.model, "change", this.render);

                scaleId = this.model.get("category").scale_id;

                if (!scaleId && this.model.get("category").scale) {
                    scaleId = this.model.get("category").scale.id;
                }

                this.scaleValues = annotationsTool.video.get("scales").get(scaleId);

                if (this.scaleValues) {
                    this.scaleValues = this.scaleValues.get("scaleValues");
                }

                if (_.contains(this.roles, annotationsTool.user.get("role"))) {
                    this.listenTo(annotationsTool, annotationsTool.EVENTS.ANNOTATE_TOGGLE_EDIT, this.onSwitchEditModus);
                }

                return this.render();
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
                    time = Math.round(annotationsTool.playerAdapter.getCurrentTime()),
                    annotation,
                    options = {},
                    params = {
                        text: this.model.get("value"),
                        start: time,
                        label: this.model,
                        scalevalue: scalevalue.toJSON()
                    };

                if (this.editModus || (!_.isNumber(time) || time < 0)) {
                    return;
                }

                if (annotationsTool.user) {
                    params.created_by = annotationsTool.user.id;
                }

                if (!annotationsTool.localStorage) {
                    options.wait = true;
                }

                annotation = annotationsTool.selectedTrack.get("annotations").create(params, options);
                annotationsTool.setSelection([annotation], true);
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

                var time = Math.round(annotationsTool.playerAdapter.getCurrentTime()),
                    options = {},
                    params,
                    annotation;

                if (!_.isNumber(time) || time < 0) {
                    return;
                }

                params = {
                    text : this.model.get("value"),
                    start: time,
                    label: this.model
                };

                if (annotationsTool.user) {
                    params.created_by = annotationsTool.user.id;
                    params.created_by_nickname = annotationsTool.user.get("nickname");
                }

                if (!annotationsTool.localStorage) {
                    options.wait = true;
                }

                annotation = annotationsTool.selectedTrack.get("annotations").create(params, options);
                annotationsTool.setSelection([annotation], true);
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

                // if (status) {
                //     this.$el.find("input[disabled='disabled']").removeAttr("disabled");
                // } else {
                //     this.$el.find("input").attr("disabled", "disabled");
                // }
            },

            /**
             * Listener for "change" event on the label category
             * @alias module:views-annotate-label.LabelView#changeCategory
             * @param  {Category} category The updated category
             */
            changeCategory: function (category) {
                var scale;

                if (category.scale_id) {
                    scale = annotationsTool.video.get("scales").get(category.scale_id);
                    if (scale) {
                        this.scaleValues = scale.get("scaleValues");
                    }
                }

                this.isScaleEnable = (category.settings && category.settings.hasScale);
                this.model.set("category", category);
                this.model.save();
            },

            /**
             * Listener for focus out event on name field
             * @alias module:views-annotate-label.LabelView#onFocusOut
             * @param {event} e Event related to this action
             */
            onFocusOut: function (e) {
                var attributeName = e.target.className.replace("item-", "").replace(" edit", "");
                this.model.set(attributeName, _.escape(e.target.value), {silent: true});
                this.model.save();
            },

            /**
             * Listener for key down event on name field
             * @alias module:views-annotate-label.LabelView#onKeyDown
             * @param {event} e Event related to this action
             */
            onKeyDown: function (e) {
                e.stopImmediatePropagation();

                if (e.keyCode === 13) { // If "return" key
                    var attributeName = e.target.className.replace("item-", "").replace(" edit", "");
                    this.model.set(attributeName, _.escape(e.target.value));
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
             * @param  {DOM Element} inputElement The given element with focus
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
                } else if (inputElement.selectionStart || inputElement.selectionStart === "0") {
                    // Firefox suport
                    CaretPos = inputElement.selectionStart;
                }

                return (CaretPos);
            },

            /**
             * Delete only this category view
             * @alias module:views-annotate-label.LabelView#deleteView
             */
            deleteView: function () {
                this.remove();
                this.undelegateEvents();
                this.deleted = true;
            },

            /**
             * Listener for label deletion request from UI
             * @alias module:views-annotate-label.LabelView#onDeleteLabel
             */
            onDeleteLabel: function () {
                annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
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

                this.delegateEvents(this.events);

                this.updateInputWidth();
                return this;
            }

        });
        return LabelView;
    }
);