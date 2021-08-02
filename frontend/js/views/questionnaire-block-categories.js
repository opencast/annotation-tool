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
    "backbone",
    "i18next",
    "jquery",
    "collections/annotation-content",
    "templates/questionnaire-block-categories",
    "templates/questionnaire-block-layout",
    "views/modal-add-labelled",
    "bootstrap"
], function (_, Backbone, i18next, $, ContentItems, template, tmplLayout, AddLabelledModal) {
    "use strict";

    return Backbone.View.extend({
        tagName: "section",
        className: "questionnaire-block-categories",
        events: {
            "click button.add-labelled-content": "addContentItem",
            "click button.questionnaire-content-item-remove": "removeContentItem"
        },
        initialize: function (options) {
            this.item = options.item;
            this.contentItems = new ContentItems([]);
            this.listenTo(this.contentItems, "all", this.render);
            this.validationErrors = [];
        },
        render: function () {
            var categories = _.invoke(_.filter(_.map(this.item.categories, getCategoryByName)), "toJSON");
            this.$el.html(
                template(
                    {
                        item: this.item,
                        categories: categories,
                        contentItems: this.contentItems.toJSON(),
                        validationErrors: this.validationErrors
                    },
                    { partials: { layout: tmplLayout } }
                )
            );

            return this;
        },
        validate: function () {
            if (this.item.minItems && this.contentItems.size() < this.item.minItems) {
                this.validationErrors = ["validation errors.min items"];

                return false;
            }
            this.validationErrors = [];

            return true;
        },
        getContentItems: function () {
            return this.contentItems.models;
        },
        addContentItem: function (event) {
            var self = this;
            var categoryID = $(event.target).data("category");
            var category = annotationTool.video.get("categories").get(categoryID);

            annotationTool.addModal(
                i18next.t("annotation.add content.category") + " " + category.get("name"),
                new AddLabelledModal({
                    model: { addContent: this.contentItems.add.bind(this.contentItems) },
                    category: category
                })
            );
        },
        removeContentItem: function (event) {
            var $button = Backbone.$(event.currentTarget);
            var position = $button.closest("li").prevAll().length;
            this.contentItems.remove(this.contentItems.at(position));
        }
    });

    function getCategoryByName(name) {
        return annotationTool.video.get("categories").models.find(function (category) {
            return category.get("name") === name;
        });
    }
});
