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
    "underscore",
    "models/content-item",
    "templates/questionnaire-block-label",
    "templates/questionnaire-block-layout",
    "templates/partial-label-chooser",
    "backbone",
    "bootstrap"
], function (_, ContentItem, template, tmplLayout, tmplLabelChooser, Backbone) {
    "use strict";

    return Backbone.View.extend({
        tagName: "section",
        className: "questionnaire-block-label",
        events: {
            "click .btn": "onClick"
        },
        initialize: function (options) {
            this.item = options.item;
            this.model = new ContentItem({ type: "label", title: this.item.title, value: null });
            this.validationErrors = [];
        },
        render: function () {
            var category = getCategoryByName(this.item.category);
            this.$el.html(
                template(
                    {
                        item: this.item,
                        color: getColor(category),
                        labels: getLabels(category, this.model)
                    },
                    { partials: { layout: tmplLayout, labelChooser: tmplLabelChooser } }
                )
            );
            return this;
        },
        validate: function () {
            if (!_.isString(this.model.get("value"))) {
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

            this.model.set("value", labelId);
            this.render();
        }
    });

    function getColor(category) {
        var json = category.toJSON();

        return json && json.settings && json.settings.color;
    }

    function getLabels(category, contentItem) {
        var labelId = contentItem.get("value");
        var labels = category
            .get("labels")
            .toJSON()
            .map(function (label) {
                return _.extend(label, { selected: label.id === labelId });
            });

        return labels;
    }

    function getCategoryByName(name) {
        return annotationTool.video.get("categories").models.find(function (category) {
            return category.get("name") === name;
        });
    }
});
