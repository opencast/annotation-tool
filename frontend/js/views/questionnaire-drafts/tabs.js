/**
 * Module containing the questionnaire tab
 *
 * @module questionnaire-drafts
 */
define([
    "jquery",
    "backbone",
    "alerts",
    "templates/questionnaire-drafts/tabs"
], function (
    $,
    Backbone,
    alerts,
    Template
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-questionnaire-drafts
     * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs
     */
    return Backbone.View.extend({
        /**
         * View template
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#template
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
         * Custom events
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#customEvents
         * @type {object}
         */
        customEvents: {
            // Publish
            fileImported: "questionnaire-drafts:file-imported",
            tabChanged: "questionnaire-drafts:tab-changed"
        },

        /**
         * View events
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#events
         * @type {object}
         */
        events: {
            "click #questionnaire [data-toggle='tab']": "showTab",
            "click #questionnaire [data-toggle='import']": "chooseFileImport"
        },

        /**
         * Constructor
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#initialize
         * @param {object} options Configuration
         */
        initialize: function (options) {
            this.tabHelpers = options.tabHelpers;
            this.activeTab = options.tabHelpers.getInitialActiveTab();

            this.render();
            this.bind();
        },

        /**
         * Render the view
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#render
         */
        render: function () {
            this.$el.html(this.template({
                tabs: this.tabHelpers.getAllTabs(),
                activeTabId: this.activeTab.id
            }));
        },

        /**
         * Event binding. Override browser/Bootstrap behaviour and UI.
         *
         * Notable browser behaviour: 'Change' event does not fire if the same file is selected again.
         * Google Chrome checks the file name, not content. Intended by browser but maybe bad UX?
         *
         * @todo CC | Review: How to handle duplicate file uploads (browser decides by name). Allow, ignore, show message?
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#bind
         */
        bind: function () {
            this.$el.find("[data-file-input]")
                .on("click", (event) => event.stopPropagation())
                .on("change", (event) => {
                    this.processFileImport(event.target);
                });
        },

        /**
         * Show and set active tab (hides others). Trigger event for other views.
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#showTab
         * @param {object} event Click
         */
        showTab: function (event) {
            const id = event.currentTarget.dataset.tabid;
            this.activeTab = this.tabHelpers.getOneTab(id);

            $(event.currentTarget).tab("show");

            Backbone.trigger(this.customEvents.tabChanged, id);
        },

        /**
         * File import UI: Simulate click on hidden file input box to choose a file.
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#chooseFileImport
         * @param {object} event Click event
         */
        chooseFileImport: function (event) {
            const id = event.target.dataset.file;
            const $file = this.$el.find("#" + id);

            event.preventDefault();
            event.stopImmediatePropagation();

            $file.click();
        },

        /**
         * Import new questionnaires
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#processFileImport
         * @param {object} $element File upload element
         */
        processFileImport: function ($element) {
            const file = $element.files[0];
            const reader = new FileReader();

            reader.onload = (event) => this.onFileRead.call(this, event);
            reader.readAsText(file);

            // Reset file status, unfocus menu
            $element.value = "";
            document.children[0].click();
        },

        /**
         * Import callback of file reading
         * @alias module:views-questionnaire-drafts.QuestionnaireViewTabs#onFileRead
         * @param {object} event Onload event
         */
        onFileRead: function (event) {
            const attributes = this.activeTab.attributes; // Can be 'undefined'

            try {
                annotationTool.importQuestionnaires(
                    event.target.result,
                    attributes
                );
            } catch (_error) {
                alerts.error(_error);
                console.error(_error);
                return;
            }

            Backbone.trigger(this.customEvents.fileImported);
        }
    });
});
