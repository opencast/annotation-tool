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
 * @module questionnaire
 */
define([
    "models/content-item",
    "templates/questionnaire/block-scale",
    "templates/questionnaire/block-layout",
    "templates/partial-scale-chooser",
    "backbone",
    "bootstrap"
], function (ContentItem, template, tmplLayout, tmplScaleChooser, Backbone) {
    "use strict";

    return Backbone.View.extend({
        tagName: "section",
        className: "questionnaire-block-scale",
        events: {
            "click .btn": "onClick",
        },
        initialize: function (options) {
            this.item = options.item;
            var value = options.value || {};
            this.model = new ContentItem({
                type: "scaling",
                title: this.item.title,
                value: value
            });
            this.validationErrors = [];
        },
        render: function () {
            var category = getCategoryByName(this.item.category);
            this.$el.html(
                template(
                    {
                        item: this.item,
                        color: getColor(category),
                        labels: getLabels(category, this.model),
                        scale: getScale(category, this.model),
                    },
                    {
                        partials: {
                            layout: tmplLayout,
                            scaleChooser: tmplScaleChooser,
                        },
                    }
                )
            );
            return this;
        },
        validate: function () {
            var value = this.model.get("value");
            if (!_.isObject(value) || !value.label || !value.scaling) {
                this.validationErrors = ["validation errors.empty"];
                return false;
            }
            this.validationErrors = [];

            return true;
        },
        getContentItems: function () {
            return this.model;
        },
        onClick: function (event) {
            event.preventDefault();
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");
            var scaleValueId = $button.data("scalevalue");

            this.model.set("value", { label: labelId, scaling: scaleValueId });
            this.render();
        }
    });

    function getColor(category) {
        var json = category.toJSON();

        return json && json.settings && json.settings.color;
    }

    function getLabels(category, contentItem) {
        var labelId = contentItem.get("value").label;
        var labels = category
            .get("labels")
            .toJSON()
            .map(function (label) {
                return _.extend(label, { selected: label.id === labelId });
            });

        return labels;
    }

    function getScale(category, contentItem) {
        var scale;
        if (category.get("scale_id")) {
            var selectedScaleValueId =
                contentItem && contentItem.get("value").scaling;
            scale = annotationTool.video
                .get("scales")
                .get(category.get("scale_id"));
            var scaleValues = scale
                .get("scaleValues")
                .toJSON()
                .map(function (scaleValue) {
                    return _.extend(scaleValue, {
                        selected: scaleValue.id === selectedScaleValueId,
                    });
                });
            scale = _.extend(scale.toJSON(), { scaleValues: scaleValues });
        }

        return scale;
    }

    function getCategoryByName(name) {
        return annotationTool.video
            .get("categories")
            .models.find(function (category) {
                return category.get("name") === name;
            });
    }
});
