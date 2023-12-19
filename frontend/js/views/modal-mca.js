define([
    "underscore",
    "backbone",
    "i18next",
    "templates/modal-mca",
    "views/modal-add-free-text",
    "views/modal-add-labelled",
    "bootstrap"
], function (
    _,
    Backbone,
    i18next,
    template,
    AddFreeTextModal,
    AddLabelledModal
) {
    "use strict";

    return Backbone.View.extend({
        /**
         * Events to handle
         * @alias module:views-modal-edit-labelled.ModalMca#events
         * @type {object}
         */
        events: {
            "click button.mca--add-free-text-content": "addFreeTextContent",
            "click button.mca--add-labelled-content": "addLabelledContent"
        },

        /**
         * Constructor
         * @alias module:views-modal-edit-labelled.ModalMca#initialize
         */
        initialize: function () {
            this.listenTo(this, "modal:click", this.render);
        },

        /**
         * Render this view
         * @todo CC | Review: Category filter is similar to to other code places, maybe move altogether e.g. to collection?
         * @alias module:views-modal-edit-labelled.ModalMca#render
         */
        render: function () {
            const categories = annotationTool.video.get("categories")
                .filter(function (category) {
                    const isOwned = !(category.get("settings").createdAsMine && !category.isMine());

                    return isOwned && !category.get("deleted_at");
                })
                .map(function (category) {
                    return _.extend(category.toJSON());
                });

            this.$el.html(template({
                categories: categories
            }));

            return this;
        },

        /**
         * Add a new annotation with a content item containing free text.
         * @alias module:views-modal-edit-labelled.ModalMca#addFreeTextContent
         * @param {Event} event Event object
         */
        addFreeTextContent: function (event) {
            event.stopPropagation();

            this.trigger("modal:request-close");
            annotationTool.addModal(
                i18next.t("annotation.add content.add free text"),
                new AddFreeTextModal({ model: this.model }),
                i18next.t("common actions.insert")
            );
        },

        /**
         * Add a new annotation with a content item containing a label w/ or w/o a scale value.
         * @alias module:views-modal-edit-labelled.ModalMca#addLabelledContent
         * @param {Event} event Event object
         */
        addLabelledContent: function (event) {
            event.stopPropagation();

            const categoryID = $(event.target).data("category");
            const category = annotationTool.video.get("categories").get(categoryID);

            this.trigger("modal:request-close");
            annotationTool.addModal(
                i18next.t("annotation.add content.category") + " " + category.get("name"),
                new AddLabelledModal({ model: this.model, category: category })
            );
        }
    });
});
