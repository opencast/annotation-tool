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
    "underscore",
    "backbone",
    "i18next",
    "jquery",
    "collections/annotation-content",
    "templates/questionnaire/block-categories",
    "templates/questionnaire/block-layout",
    "views/modal-add-labelled",
    "bootstrap"
], function (
    _,
    Backbone,
    i18next,
    $,
    ContentItems,
    template,
    tmplLayout,
    AddLabelledModal
) {
    "use strict";

    return Backbone.View.extend({
        tagName: "section",
        className: "questionnaire-block-categories",
        events: {
            "click button.add-labelled-content": "addContentItem",
            "click button.questionnaire-content-item-remove":
                "removeContentItem",
        },
        initialize: function (options) {
            this.annotation = options.annotation;
            this.item = options.item;
            this.schema = options.schema;
            var value = options.value || [];
            this.contentItems = new ContentItems(value);
            this.listenTo(this.contentItems, "all", this.render);
            this.validationErrors = [];
        },
        /**
         * @param {*} arguments Custom object: {isFirstOpen: true} | Backbone native/arbitrary
         */
        render: function () {
            const isFirstOpen = arguments[0] && arguments[0].isFirstOpen;
            const categories = getCategories(this.item);

            if (!isFirstOpen && this.annotation.isMine()) {
                this.validate();
            }

            this.$el.html(
                template(
                    {
                        isMine: this.annotation.isMine(),
                        item: this.item,
                        categories: categories,
                        contentItems: this.contentItems.toJSON(),
                        validationErrors: this.validationErrors,
                    },
                    { partials: { layout: tmplLayout } }
                )
            );

            return this;
        },
        validate: function () {
            if (
                this.item.minItems &&
                this.contentItems.size() < this.item.minItems
            ) {
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
            var category = annotationTool.video
                .get("categories")
                .get(categoryID);

            var self = this;
            annotationTool.addModal(
                i18next.t("annotation.add content.category") +
                    " " +
                    category.get("name"),
                new AddLabelledModal({
                    model: {
                        addContent: function (content) {
                            content.schema = self.schema;

                            return self.contentItems.add(content);
                        },
                    },
                    category: category,
                })
            );
        },
        removeContentItem: function (event) {
            var $button = Backbone.$(event.currentTarget);
            var position = $button.closest("li").prevAll().length;
            this.contentItems.remove(this.contentItems.at(position));
        },
    });

    /**
     * @todo CC | Review: If categories is an empty array or not an array, what should happen then? (Currently = Result empty)
     * @todo CC | Review: Maybe 'isPublic' should be done in the resource (analog to isMine)?
     * @todo CC | Optimize: Simplify extending JSON with 'isPublic' (less code?)
     */
    function getCategories(item) {
        const categories = "categories" in item
            ? _.filter(_.map(item.categories, getCategoryByName))
            : getCategoryFiltered();
        const json = _.invoke(categories, "toJSON");

        _.each(json, (jsonCategory) => {
            const category = _.findWhere(categories, { id: jsonCategory.id });
            jsonCategory.isPublic = category.isPublic();
        });

        return json;
    }

    /**
     * Get category by name.
     * @todo CC | Review: Duplicate names can lead to picking wrong category (e.g. same name but different rights -> Display issues)
     */
    function getCategoryByName(name) {
        return getCategoryFiltered()
            .find(function (category) {
                return category.get("name") === name;
            });
    }

    /**
     * Get own categories by name.
     * @see module:views-annotate-category#initialize for consistent solution
     */
    function getCategoryFiltered() {
        return annotationTool.video
            .get("categories").models
            .filter(function (category) {
                const isOwned = !(category.get("settings").createdAsMine && !category.isMine());

                return isOwned;
            });
    }
});
