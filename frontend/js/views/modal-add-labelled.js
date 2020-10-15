/**
 *  Copyright 2020, ELAN e.V., Germany
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
define([
    "templates/modal-add-labelled",
    "templates/partial-label-chooser",
    "templates/partial-scale-chooser",
    "backbone",
    "bootstrap"
], function(template, tmplLabelChooser, tmplScaleChooser, Backbone) {
    "use strict";

    return Backbone.View.extend({
        /**
         * Events to handle
         * @alias module:views-modal-add-labelled.ModalAddLabelled#events
         * @type {object}
         */
        events: {
            "click .btn.label": "onLabelledContent",
            "click .btn.label-and-scale": "onScalingContent"
        },

        /**
         * Constructor
         * @alias module:views-modal-add-labelled.ModalAddLabelled#initialize
         */
        initialize: function(options) {
            this.category = options.category;
        },

        /**
         * Render this view
         * @alias module:views-modal-add-labelled.ModalAddLabelled#render
         */
        render: function() {
            this.$el.html(
                template(
                    {
                        color: getColor(this.category),
                        labels: this.category.get("labels").toJSON(),
                        scale: getScale(this.category)
                    },
                    {
                        partials: {
                            labelChooser: tmplLabelChooser,
                            scaleChooser: tmplScaleChooser
                        }
                    }
                )
            );

            return this;
        },

        /**
         * Listener for click on a button to add a `label` content item
         * @alias module:views-modal-add-labelled.ModalAddLabelled#onLabelledContent
         */
        onLabelledContent: function(event) {
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");

            this.model.addContent({
                type: "label",
                title: null,
                value: labelId
            });
            this.trigger("modal:request-close");
        },

        /**
         * Listener for click on a button to add a `scaling` content item
         * @alias module:views-modal-add-labelled.ModalAddLabelled#onScalingContent
         */
        onScalingContent: function(event) {
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");
            var scaleValueId = $button.data("scalevalue");

            this.model.addContent({
                type: "scaling",
                title: null,
                value: { label: labelId, scaling: scaleValueId }
            });
            this.trigger("modal:request-close");
        }
    });
});

function getColor(category) {
    var json = category.toJSON();

    return json && json.settings && json.settings.color;
}

function getScale(category) {
    var scale = null;
    if (category.get("scale_id")) {
        scale = annotationTool.video.get("scales").get(category.get("scale_id"));
        scale = _.extend(scale.toJSON(), { scaleValues: scale.get("scaleValues").toJSON() });
    }

    return scale;
}
