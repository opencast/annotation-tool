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
        events: {
            "click .btn.label": "onLabelledContent",
            "click .btn.label-and-scale": "onScalingContent"
        },

        initialize: function(options) {
            this.category = options.category;
            this.contentItem = options.contentItem;
        },

        render: function() {
            this.$el.html(
                template(
                    {
                        color: getColor(this.category),
                        labels: getLabels(this.category, this.contentItem),
                        scale: getScale(this.category, this.contentItem)
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

        onLabelledContent: function(event) {
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");

            this.contentItem.set("value", labelId);
            this.model.save();
            this.trigger("modal:request-close");
        },

        onScalingContent: function(event) {
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");
            var scaleValueId = $button.data("scalevalue");

            this.contentItem.set("value", { label: labelId, scaling: scaleValueId });
            this.model.save();
            this.trigger("modal:request-close");
        }
    });
});

function getColor(category) {
    var json = category.toJSON();

    return json && json.settings && json.settings.color;
}

function getLabels(category, contentItem) {
    var selectedLabel = contentItem.getLabel();
    var labels = category
        .get("labels")
        .toJSON()
        .map(function(label) {
            return _.extend(label, { selected: label.id === selectedLabel.id });
        });

    return labels;
}

function getScale(category, contentItem) {
    var scale;
    if (category.get("scale_id")) {
        var selectedScaleValueId = contentItem && contentItem.get("value").scaling;
        scale = annotationTool.video.get("scales").get(category.get("scale_id"));
        var scaleValues = scale
            .get("scaleValues")
            .toJSON()
            .map(function(scaleValue) {
                return _.extend(scaleValue, { selected: scaleValue.id === selectedScaleValueId });
            });
        scale = _.extend(scale.toJSON(), { scaleValues: scaleValues });
    }

    return scale;
}
