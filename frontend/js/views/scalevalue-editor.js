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
 * A module representing the scale value editor
 * @module views-scalevalue-editor
 */
define([
    "underscore",
    "backbone",
    "templates/scale-value-editor"
], function (
    _,
    Backbone,
    ScaleValueEditorTmpl
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-scalevalue-editor
     */
    var ScaleValueEditor = Backbone.View.extend({
        /**
         * Scale value editor template
         * @type {HandlebarsTemplate}
         */
        scaleValueEditorTemplate: ScaleValueEditorTmpl,

        /**
         * Define if the scale value is or not deleted
         * @type {Boolean}
         */
        isDeleted: false,

        /**
         * Events to handle by the view
         * @type {Map}
         */
        events: {
            "click .order-up": "up",
            "click .order-down": "down",
            "click .delete-scale-value": "deleteScaleValue",
            "keydown .scale-value-name": "saveOnInsert",
            "keydown .scale-value-value": "saveOnInsert",
            "focusout .scale-value-value": "save",
            "focusout .scale-value-name": "save"
        },

        /**
         * Constructor
         * @param {PlainObject} attr Object literal containing the view initialization attributes.
         */
        initialize: function (attr) {

            _.bindAll(
                this,
                "render",
                "up",
                "down",
                "saveOnInsert",
                "getSortedCollection",
                "deleteScaleValue"
            );

            this.model = attr.model;
            this.isNew = attr.isNew;
            this.next = attr.next;
            this.previous = attr.previous;
            this.onChange = attr.onChange;
            this.scaleEditor = attr.scaleEditor;

            this.scaleValueDeleteType = annotationTool.deleteOperation.targetTypes.SCALEVALUE;
            this.setElement(this.scaleValueEditorTemplate(this.model.toJSON()));
        },

        /**
         * Render all elements of the view and draw them.
         */
        render: function () {
            var modelJSON = this.model.toJSON();

            this.setElement(this.scaleValueEditorTemplate(modelJSON));
            this.delegateEvents(this.events);

            return this;
        },

        /**
         * Move the scale value up in the list (change the order)
         */
        up: function () {
            var currentOrder = this.model.get("order"),
                sortedCollection = this.getSortedCollection(),
                previous;

            if (currentOrder > 0) {
                previous = sortedCollection[currentOrder - 1];
                previous.set("order", currentOrder);
                this.model.set("order", currentOrder - 1);
                previous.save();
                this.model.save();
            }

            this.onChange();
        },

        /**
         * Move the scale value down in the list (change the order)
         */
        down: function () {
            var currentOrder = this.model.get("order"),
                sortedCollection = this.getSortedCollection(),
                next;

            if (currentOrder < (sortedCollection.length - 1)) {
                next = sortedCollection[currentOrder + 1];
                next.set("order", currentOrder);
                this.model.set("order", currentOrder + 1);
                next.save();
                this.model.save();
            }

            this.onChange();
        },

        /**
         * Proxy to save a value on insert
         * @param  {Event} event Event object
         */
        saveOnInsert: function (event) {
            if (event.keyCode === 13) {
                this.save();
            }
        },

        /**
         * Save the scale value
         */
        save: function () {
            var name = this.$el.find(".scale-value-name").val(),
                $value = this.$el.find(".scale-value-value"),
                value = parseFloat($value.val());

            if (!isNaN(value)) {
                $value.removeClass("error");
                this.model.set({
                    name: name,
                    value: value
                });

                this.model.save();
            } else {
                $value.val("");
                $value.addClass("error");
            }
        },

        /**
         * Delete the scale value
         * @param  {Event} event Event object
         */
        deleteScaleValue: function (event) {
            var sortedCollection = this.getSortedCollection();

            event.stopImmediatePropagation();
            this.scaleEditor.$el.modal("hide");
            annotationTool.deleteOperation.start(
                this.model,
                this.scaleValueDeleteType,
                _.bind(function () {
                    this.scaleEditor.$el.modal("show");

                    var currentOrder = this.model.get("order"),
                        i;

                    // Update order for following item
                    if (currentOrder < (sortedCollection.length - 1)) {
                        for (i = currentOrder + 1; i < sortedCollection.length; i++) {
                            sortedCollection[i].set("order", i - 1);
                            sortedCollection[i].save();
                        }
                    }

                    this.isDeleted = true;
                    this.onChange();
                    this.remove();
                }, this),
                _.bind(function () {
                    this.scaleEditor.$el.modal("show");
                }, this)
            );
        },

        /**
         * Sort the scale values collection by order value, TODO use collection comparator
         */
        getSortedCollection: function () {
            // Sort the model in the right scale value order
            return this.model.collection.sortBy(function (scaleValue) {
                return scaleValue.get("order");
            });
        }
    });
    return ScaleValueEditor;
});
