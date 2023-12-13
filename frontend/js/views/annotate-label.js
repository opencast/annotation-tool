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
define(
    [
        "underscore",
        "backbone",
        "templates/annotate-label"
    ],
    function (
        _,
        Backbone,
        Template
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @memberOf module:views-annotate-label
         * @augments module:Backbone.View
         */
        var LabelView = Backbone.View.extend({

            /**
             * CSS className for the scale container
             * @type {object}
             */
            CLASS_SCALE: {
                ENABLED: "scale-enabled",
                DISABLED: "scale-disabled"
            },

            /**
             * Tag name from the view element
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @type {string}
             */
            className: "label-item",

            /**
             * Prefix for the item id
             * @type {string}
             */
            ID_PREFIX: "labelItem-",

            /**
             * List of categories view in this tab
             * @type {array}
             */
            labels: [],

            /**
             * View template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Events to handle by the annotate-label view
             * @type {map}
             */
            events: {
                "click": "annotate",
                "click .scaling li": "annotateWithScaling"
            },

            /**
             * Constructor
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                if (!attr.label || !_.isObject(attr.label)) {
                    throw "Label object must be given as constuctor attribute!";
                }

                // Set the current context for all these functions
                _.bindAll(
                    this,
                    "render",
                    "annotate",
                    "annotateWithScaling"
                );

                this.model = attr.label;
                this.isScaleEnable = attr.isScaleEnable;

                this.el.id = this.ID_PREFIX + this.model.get("id");

                this.listenTo(this.model, "change", this.render);

                this.setupScaling();

                return this.render();
            },

            /**
             * Create a new annotation at the current playedhead time with a scaling value
             * @param {event} event Event related to this action
             */
            annotateWithScaling: function (event) {
                event.stopImmediatePropagation();

                var id = JSON.parse(event.target.dataset["id"]);
                createAnnotation({ content: [{
                    type: "scaling",
                    value: {
                        label: this.model.id,
                        scaling: id
                    }
                }] });
            },

            /**
             * Annotate the video with this label but without scale value
             * @param {event} event Event related to this action
             */
            annotate: function (event) {
                event.stopImmediatePropagation();

                if (this.isScaleEnable) {
                    return;
                }

                createAnnotation({ content: [{
                    type: "label",
                    value: this.model.id
                }] });
            },

            /**
             * Listener for "change" event on the label category
             */
            changeCategory: function () {
                this.setupScaling();
                this.render();
            },

            /**
             * Set up scale values according to category
             */
            setupScaling: function () {
                var category = this.model.collection.category;
                var scaleId = category.get("scale_id");
                var scale = scaleId && annotationTool.video.get("scales").get(scaleId);

                if (scale) {
                    this.scaleValues = scale.get("scaleValues");
                } else {
                    delete this.scaleValues;
                }

                var settings = category.get("settings");
                this.isScaleEnable = settings && settings.hasScale;
            },

            /**
             * Draw the view
             * @return {LabelView} this label view
             */
            render: function () {
                var modelJSON = this.model.toJSON();

                if (this.scaleValues) {
                    this.scaleValues.sort();
                    modelJSON.scaleValues = this.scaleValues.toJSON()
                        .filter(function (scaleValue) {
                            return !scaleValue.deleted_at;
                        });
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

                return this;
            }

        });

        function createAnnotation(params) {
            if (annotationTool.views.main.views.annotate.$el.find("#pause-video-structured").prop("checked")) {
                annotationTool.playerAdapter.pause();
            }

            return annotationTool.createAnnotation(params);
        }

        return LabelView;
    }
);
