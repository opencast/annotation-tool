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
 * A module representing the scale editor
 * @module views-scale-editor
 * @requires jquery
 * @requires underscore
 * @requires backbone
 * @requires i18next
 * @requires models-scale
 * @requires collections-scales
 * @requires templates/scale-editor.tmpl
 * @requires templates/scale-editor-select.tmpl
 * @requires templates/scale-editor-content.tmpl
 * @requires ACCESS
 * @requires handlebars
 */
define(["jquery",
        "underscore",
        "backbone",
        "i18next",
        "models/scale",
        "collections/scales",
        "views/scalevalue-editor",
        "templates/scale-editor",
        "templates/scale-editor-select",
        "templates/scale-editor-content",
        "access",
        "handlebars",
        "handlebarsHelpers"],
    function ($, _, Backbone, i18next, Scale, Scales, ScaleValueEditorView, ScaleEditorTemplate, ScaleEditorSelectTemplate, ScaleEditorContentTemplate) {

            "use strict";

            /**
             * @constructor
             * @see {@link http://www.backbonejs.org/#View}
             * @memberOf module:views-scale-editor
             * @augments module:Backbone.View
             * @alias module:views-scale-editor.ScaleEditor
             */
            var ScaleEditor = Backbone.View.extend({

                /**
                 * The titles of the different element from the editor
                 * @alias module:views-scale-editor.ScaleEditor#TITLES
                 * @type {map}
                 */
                TITLES: {
                    CATEGORY_EDIT  : i18next.t("scale editor.edit category scale"),
                    STANDALONE_EDIT: i18next.t("scale editor.edit scales"),
                    SAVE_BUTTON    : i18next.t("scale editor.save")
                },

                /**
                 * Object representing an empty scale
                 * @alias module:views-scale-editor.ScaleEditor#EMPTY_SCALES
                 * @type {Object}
                 */
                EMPTY_SCALE: {
                    name: i18next.t("scale editor.no scale"),
                    id  : "NO"
                },

                /**
                 * Main container of the editor modal
                 * @alias module:views-login.Login#el
                 * @type {DOMElement}
                 */
                el: $("#scale-editor"),

                /**
                 * Main template for the scale editor
                 * @alias module:views-login.Login#scaleEditorTemplate
                 * @type {HandlebarsTemplate}
                 */
                scaleEditorTemplate: ScaleEditorTemplate,

                /**
                 * Template for the select element of the editor
                 * @alias module:views-login.Login#scaleEditorSelectTemplate
                 * @type {HandlebarsTemplate}
                 */
                scaleEditorSelectTemplate: ScaleEditorSelectTemplate,

                /**
                 * Template for the editor content
                 * @alias module:views-login.Login#scaleEditorContentTemplate
                 * @type {HandlebarsTemplate}
                 */
                scaleEditorContentTemplate: ScaleEditorContentTemplate,

                /**
                 * Events to handle
                 * @alias module:views-scale-editor.ScaleEditor#events
                 * @type {object}
                 */
                events: {
                    "click #save-scale"         : "save",
                    "click #cancel-scale"       : "cancel",
                    "click a.edit-scale"        : "startEditScale",
                    "click a.create-scale"      : "createScale",
                    "click a.delete-scale"      : "deleteScale",
                    "click a.create-scale-value": "createScaleValue",
                    "change select#scale-id"    : "changeScale",
                    "keydown #save-scale"       : "saveOnInsert"
                },

                /**
                 * Constructor
                 * @alias module:views-scale-editor.ScaleEditor#initialize
                 */
                initialize: function () {

                    _.bindAll(this,
                            "initialize",
                            "saveOnInsert",
                            "save",
                            "startEditScale",
                            "createScale",
                            "createScaleValue",
                            "deleteScale",
                            "changeScale",
                            "cancel",
                            "renderEditContent",
                            "renderScaleSelect",
                            "generateScalesForTemplate",
                            "show",
                            "hide");

                    _.extend(this, Backbone.Events);

                    // Type use for delete operation
                    this.scaleDeleteType = annotationsTool.deleteOperation.targetTypes.SCALE;

                    this.$el.modal({show: true, backdrop: false, keyboard: false });
                    this.$el.modal("hide");
                },

                /**
                 * Display the editor with the given category
                 * @alias module:views-scale-editor.ScaleEditor#show
                 * @param {Category} category The category currently selected
                 */
                show: function (category) {
                    var templateParams = {
                            title: this.TITLES.STANDALONE_EDIT
                        };

                    this.EMPTY_SCALE.isSelected = false;

                    if (category) {
                        this.currentCategory = category;

                        if (category.get("settings").hasScale) {
                            this.currentScaleId = category.get("scale_id");
                        }
                        templateParams.title = this.TITLES.CATEGORY_EDIT;
                    }

                    this.$el.empty();
                    this.$el.append(this.scaleEditorTemplate(templateParams));
                    this.renderScaleSelect();
                    this.changeScale();
                    this.$el.modal("show");
                    this.$el.css("z-index", 400);
                },

                /**
                 * Generate the list of scales to be drawn
                 * @alias module:views-scale-editor.ScaleEditor#generateScalesForTemplate
                 */
                generateScalesForTemplate: function () {
                    var scales = annotationsTool.video.get("scales").toJSON(),
                        selectedScale;

                    // Filter by access values
                    scales = _.where(scales, {access: this.currentCategory.get("access")});

                    scales.push(this.EMPTY_SCALE);

                    if (this.currentScaleId) {
                        selectedScale = _.find(scales, function (scale) {
                                                return scale.id === this.currentScaleId;
                                            }, this);

                        if (selectedScale) {
                            selectedScale.isSelected = true;
                        }
                    } else {
                        this.EMPTY_SCALE.isSelected = true;
                    }
                    return scales;
                },

                /**
                 * Draw the select element
                 * @alias module:views-scale-editor.ScaleEditor#renderScaleSelect
                 */
                renderScaleSelect: function () {
                    this.$el.find("select#scale-id").empty()
                                                    .append(this.scaleEditorSelectTemplate({scales: this.generateScalesForTemplate()}));

                    this.delegateEvents(this.events);
                },

                /**
                 * Hide the editor
                 * @alias module:views-scale-editor.ScaleEditor#hide
                 */
                hide: function () {
                    this.$el.modal("hide");

                    if (this.category) {
                        delete this.category;
                    }
                },

                /**
                 * Proxy to save the current scale by pressing the return key
                 * @alias module:views-scale-editor.ScaleEditor#saveOnInsert
                 * @param  {event} e Event object
                 */
                saveOnInsert: function (e) {
                    if (e.keyCode === 13) {
                        this.save();
                    }
                },

                /**
                 * Save the current scale or category with the modification done in the editor and quit it
                 * @alias module:views-scale-editor.ScaleEditor#save
                 */
                save: function () {
                    var name,
                        description,
                        settings;

                    if (this.isInEditMode) {
                        name = this.$el.find(".modal-body .scale-name").val();
                        description = this.$el.find(".modal-body .scale-description").val();

                        this.currentScale.set({
                            name: name,
                            description: description
                        });

                        this.currentScale.save({async: false});
                        this.currentScale.get("scaleValues").each(function (scaleValue) {
                            scaleValue.save();
                        });
                        this.currentScaleId = this.currentScale.get("id");

                        this.isInEditMode = false;
                        this.renderScaleSelect();
                        this.changeScale();

                        this.$el.find(".modal-body").hide();
                        this.$el.find("a#save-scale").text(this.TITLES.SAVE_BUTTON);
                    } else if (this.currentCategory) {
                        settings = this.currentCategory.get("settings");

                        if (this.currentScaleId === this.EMPTY_SCALE.id) {
                            settings.hasScale = false;
                            this.currentCategory.unset("scale_id");
                            this.currentCategory.unset("scale");
                        } else {
                            settings.hasScale = true;
                            this.currentCategory.set({
                                scale_id: this.currentScaleId,
                                scale: this.currentScale
                            });
                        }
                        this.currentCategory.set("settings", settings);
                        this.currentCategory.save();
                        this.changeScale();
                        this.hide();
                    }
                },

                /**
                 * Cancel the modification done and quit
                 * @alias module:views-scale-editor.ScaleEditor#cancel
                 */
                cancel: function () {
                    if (this.isInEditMode) {
                        this.isInEditMode = false;
                        this.renderScaleSelect();
                        this.changeScale();
                        this.$el.find(".modal-body").hide();
                        this.$el.find("select#scale-id").removeAttr("disabled");
                        this.$el.find("a#save-scale").text(this.TITLES.SAVE_BUTTON);
                    } else {
                        this.hide();
                    }
                },

                /**
                 * Change the current scale with the one selected with select input element
                 * @alias module:views-scale-editor.ScaleEditor#changeScale
                 */
                changeScale: function () {
                    this.currentScaleId = this.$el.find("select#scale-id").val();
                    this.currentScale = annotationsTool.video.get("scales").get(this.currentScaleId);

                    if (this.currentScale && this.currentScale.get("isMine")) {
                        if (this.isInEditMode) {
                            this.$el.find("a.edit-scale").hide();
                        } else {
                            this.$el.find("a.edit-scale").show();
                        }
                        this.renderEditContent(this.currentScale);
                    } else {
                        this.isInEditMode = false;
                        this.$el.find("a.edit-scale").hide();
                        this.$el.find(".modal-body").hide();
                    }
                },

                /**
                 * Create a new scale
                 * @alias module:views-scale-editor.ScaleEditor#createScale
                 */
                createScale: function () {
                    this.isInEditMode = true;

                    this.currentScale = new Scale({
                        name  : i18next.t("scale editor.new scale.name"),
                        access: this.currentCategory.get("access")
                    });

                    this.$el.find("a#save-scale").text(this.TITLES.SAVE_BUTTON);

                    annotationsTool.video.get("scales").add(this.currentScale);
                    this.currentScale.save({async: false});
                    this.currentScale.setUrl();
                    this.currentScale.get("scaleValues").each(function (scaleValue) {
                        scaleValue.save();
                    });
                    this.currentScaleId = this.currentScale.get("id");
                    this.$el.find("select#scale-id").removeAttr("disabled");

                    this.renderEditContent(this.currentScale);
                    this.$el.find(".modal-body").show();
                },

                /**
                 * Create a new scale value
                 * @alias module:views-scale-editor.ScaleEditor#createScaleValue
                 */
                createScaleValue: function () {
                    this.currentScale.get("scaleValues").create({
                            order: this.$el.find(".scale-value").length,
                            name : i18next.t("scale editor.new scale.value"),
                            value: 0,
                            access: this.currentCategory.get("access")
                        });
                },

                /**
                 * Delete the current scale
                 * @param  {event} event Event object
                 * @alias module:views-scale-editor.ScaleEditor#deleteScale
                 */
                deleteScale: function (event) {
                    var self = this;

                    event.stopImmediatePropagation();
                    annotationsTool.deleteOperation.start(this.currentScale, this.scaleDeleteType, self.cancel);
                },

                /**
                 * Switch in edit mode for the current scale
                 * @alias module:views-scale-editor.ScaleEditor#startEditScale
                 */
                startEditScale: function () {
                    this.isInEditMode = true;
                    this.$el.find("a#save-scale").text(this.TITLES.SAVE_BUTTON);
                    this.$el.find("a.edit-scale").hide();
                    this.$el.find(".modal-body").show();
                },

                /**
                 * Render the edit content of the editor for the given scale
                 * @alias module:views-scale-editor.ScaleEditor#renderEditContent
                 * @param  {Scale} scale The scale to edit
                 */
                renderEditContent: function (scale) {
                    var scaleValuesViews = [],
                        scaleValues = this.currentScale.get("scaleValues"),
                        // Sort the model in the right scale volue order
                        sortModelByOrderValue = function (model) {
                            return model.get("order");
                        },
                        // Refresh the list of scale values
                        renderScaleValues = function () {
                            scaleValuesViews = _.where(scaleValuesViews, {isDeleted: false});
                            scaleValuesViews = _.sortBy(scaleValuesViews, function (view) {
                                                    return sortModelByOrderValue(view.model);
                                                });

                            this.$el.find(".list-scale-values").empty();

                            _.each(scaleValuesViews, function (view) {
                                this.$el.find(".list-scale-values").append(view.render().$el);
                            }, this);
                        },
                        // Create view from newly added scale value
                        addScaleValue = function (scaleValue, index) {
                            var self = this,
                                params = {
                                    model: scaleValue,
                                    onChange: function () {
                                        renderScaleValues.call(self);
                                    }
                                };

                            scaleValuesViews.push(new ScaleValueEditorView(params));

                            if (!_.isNumber(index)) {
                                renderScaleValues.call(self);
                            }
                        };

                    scaleValues.bind("add", addScaleValue, this);
                    scaleValues = scaleValues.sortBy(sortModelByOrderValue, this);
                    _.each(scaleValues, addScaleValue, this);

                    this.$el.find(".modal-body").empty().append(this.scaleEditorContentTemplate({scale: scale.toJSON()}));
                    renderScaleValues.call(this);
                    this.delegateEvents(this.events);
                }
            });
            return ScaleEditor;
        }
);