/**
 * Module containing the questionnaire list
 *
 * @module questionnaire-drafts
 */
define([
    "underscore",
    "backbone",
    "templates/questionnaire-drafts/list"
], function (
    _,
    Backbone,
    Template
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-questionnaire-drafts
     * @alias module:views-questionnaire-drafts.QuestionnaireViewList
     */
    return Backbone.View.extend({
        /**
         * View template
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#template
         * @type {HandlebarsTemplate}
         */
        template: Template,

        /**
         * Tab helper functions
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#tabHelpers
         * @type {null|object}
         */
        tabHelpers: null,

        /**
         * Active tab
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#activeTab
         * @type {null|object}
         */
        activeTab: null,

        /**
         * Questionnaires
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#questionnaires
         * @type {null|object}
         */
        questionnaires: null,

        /**
         * View events
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#events
         * @type {object}
         */
        events: {
            "click #questionnaire [data-toggle='editor']": "showEditor",
            "click #questionnaire [data-toggle='delete']": "deleteItem"
        },

        /**
         * Custom event name map
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#customEvents
         * @type {object}
         */
        customEvents: {
            // Publish
            createAnnotation: "questionnaire:create-annotation",

            // Subscribe
            fileImported: "questionnaire-drafts:file-imported",
            tabChanged: "questionnaire-drafts:tab-changed"
        },

        /**
         * Constructor
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#initialize
         * @param {object} options Configuration
         */
        initialize: function (options) {
            this.typeForDelete = annotationTool.deleteOperation.targetTypes.QUESTIONNAIRE;
            this.tabHelpers = options.tabHelpers;
            this.activeTab = options.tabHelpers.getInitialActiveTab();
            this.questionnaires = options.questionnaires;

            this.render();
            this.bind();
        },

        /**
         * Event binding
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#bind
         */
        bind: function () {
            Backbone.on(this.customEvents.fileImported, this.render.bind(this));
            Backbone.on(this.customEvents.tabChanged, this.onTabChange.bind(this));
        },

        /**
         * Destructor
         * @augments module:Backbone.View
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#remove
         */
        remove: function () {
            Backbone.off(this.customEvents.fileImported);
            Backbone.off(this.customEvents.tabChanged);
        },

        /**
         * Render the view
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#render
         */
        render: function () {
            this.$el.html(this.template({
                activeTabId: this.activeTab.id,
                questionnaires: this.getFilteredQuestionnaires(),
                tabs: this.tabHelpers.getAllTabs()
            }));
        },

        /**
         * Update active tab and re-render
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#onTabChange
         * @param {string} id Active tab ID
         */
        onTabChange: function (id) {
            this.activeTab = this.tabHelpers.getOneTab(id);

            this.render();
        },

        /**
         * Show editor
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#showEditor
         * @param {object} event Click event
         */
        showEditor: function (event) {
            const id = +event.currentTarget.dataset.id;

            annotationTool.views.main.openViewQuestionnaire();
            Backbone.trigger(this.customEvents.createAnnotation, id);
        },

        /**
         * Delete item and trigger re-render
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#deleteItem
         * @param {object} event Click event
         */
        deleteItem: function (event) {
            const model = this.questionnaires.getOneById(event.currentTarget.dataset.id);

            annotationTool.deleteOperation.start(model, this.typeForDelete, _.bind(this.render, this));
        },

        /**
         * Get questionnaires filtered to active tab
         * @alias module:views-questionnaire-drafts.QuestionnaireViewList#getFilteredQuestionnaires
         * @return {object} Filtered questionnaires
         */
        getFilteredQuestionnaires: function () {
            const questionnaires = this.questionnaires
                .filter(function (questionnaire) {
                    return !questionnaire.get("deleted_at");
                })
                .filter(this.activeTab.filter);

            return questionnaires;
        }
    });
});
