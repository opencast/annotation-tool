/**
 * Module containing the questionnaire.
 * Handles tab data delegation and child views.
 *
 * @module questionnaire-drafts
 */
define([
    "i18next",
    "backbone",
    "access",
    "roles",
    "templates/questionnaire-drafts",
    "views/questionnaire-drafts/list",
    "views/questionnaire-drafts/tabs"
], function (
    i18next,
    Backbone,
    ACCESS,
    ROLES,
    Template,
    ViewList,
    ViewTabs
) {
    "use strict";

    /**
     * List of default tabs
     * @type {object}
     */
    const TABS = {
        ALL: {
            id: "all",
            name: i18next.t("questionnaire.tabs.all"),
            filter: function (questionnaire) {
                return !questionnaire.get("settings").createdAsMine || questionnaire.isMine();
            }
        },
        PUBLIC: {
            id: "public",
            name: i18next.t("questionnaire.tabs.public"),
            filter: function (questionnaire) {
                return !questionnaire.get("settings").createdAsMine;
            },
            role: ROLES.ADMINISTRATOR,
            attributes: {
                access: ACCESS.PUBLIC,
                settings: {
                    createdAsMine: false
                }
            }
        },
        MINE: {
            id: "mine",
            name: i18next.t("questionnaire.tabs.mine"),
            filter: function (questionnaire) {
                return questionnaire.get("settings").createdAsMine && questionnaire.isMine();
            },
            role: ROLES.USER,
            attributes: {
                // We do not want to add an extra layer of sharing to annotations created with a template (so that sharing is
                // more intuitive for users), also this allows to use the same behaviour of sharing as "classic" MCAs
                // (which are access-controlled and shared by track and category). Additionally a layer of sharing could be added later
                // (if found to be necessary). If the access level is too low, the read-only annotations from templates cannot be accessed
                // by third party users to whom was shared. Instead of: ACCESS.SHARED_WITH_ADMIN
                access: ACCESS.PUBLIC,
                settings: {
                    createdAsMine: true
                }
            }
        }
    };

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-questionnaire-drafts
     * @alias module:views-questionnaire-drafts.QuestionnaireView
     */
    return Backbone.View.extend({
        /**
         * View template
         * @alias module:views-questionnaire-drafts.QuestionnaireView#template
         * @type {HandlebarsTemplate}
         */
        template: Template,

        /**
         * List view instance
         * @alias module:views-questionnaire-drafts.QuestionnaireView#viewList
         * @type {null|module:views-questionnaire-drafts.QuestionnaireViewList}
         */
        viewList: null,

        /**
         * Tabs view instance
         * @alias module:views-questionnaire-drafts.QuestionnaireView#viewTabs
         * @type {null|module:views-questionnaire-drafts.QuestionnaireViewTabs}
         */
        viewTabs: null,

        /**
         * List container element
         * @alias module:views-questionnaire-drafts.QuestionnaireView#$listContainer
         * @type {null|object}
         */
        $listContainer: null,

        /**
         * Tabs container element
         * @alias module:views-questionnaire-drafts.QuestionnaireView#$tabsContainer
         * @type {null|object}
         */
        $tabsContainer: null,

        /**
         * State: List of questionnaires in this tab
         * @alias module:views-questionnaire-drafts.QuestionnaireView#questionnaires
         * @type {null|Questionnaires}
         */
        questionnaires: null,

        /**
         * Constructor
         * @alias module:views-questionnaire-drafts.QuestionnaireView#initialize
         * @param {object} _options Configuration
         */
        initialize: function (_options) {
            this.questionnaires = annotationTool.video.get("questionnaires");

            this.viewList = new ViewList({
                tabHelpers: this.getTabHelpers(),
                questionnaires: this.questionnaires
            });

            this.viewTabs = new ViewTabs({
                tabHelpers: this.getTabHelpers()
            });

            this.render();
        },

        /**
         * Render self and child views
         * @alias module:views-questionnaire-drafts.QuestionnaireView#render
         */
        render: function () {
            const $el = this.$el;

            $el.html(this.template());
            $el.find("#questionnaire-list-container").append(this.viewList.$el);
            $el.find("#questionnaire-tabs-container").append(this.viewTabs.$el);

            return this;
        },

        /**
         * Remove this view from the DOM and clean up all of its data and event handlers.
         */
        remove: function () {
            this.viewList.remove();
            this.viewTabs.remove();
            Backbone.View.prototype.remove.apply(this, arguments);
        },

        /**
         * Get initial active tab data
         * @alias module:views-questionnaire-drafts.QuestionnaireView#getInitialActiveTab
         * @return {object} Tab data
         */
        getInitialActiveTab: function () {
            return Object.values(TABS)[0];
        },

        /**
         * Get all tabs data
         * @alias module:views-questionnaire-drafts.QuestionnaireView#getAllTabs
         * @return {object} Tabs data
         */
        getAllTabs: function () {
            return TABS;
        },

        /**
         * Get one tabs data
         * @alias module:views-questionnaire-drafts.QuestionnaireView#getOneTab
         * @param {string} id Tab identifier
         * @return {object} Tab data
         */
        getOneTab: function (id) {
            return TABS[id.toUpperCase()];
        },

        /**
         * Get tab helper functions
         * @alias module:views-questionnaire-drafts.QuestionnaireView#getTabHelpers
         * @return {object} Functions
         */
        getTabHelpers: function () {
            return {
                getInitialActiveTab: this.getInitialActiveTab,
                getAllTabs: this.getAllTabs,
                getOneTab: this.getOneTab
            };
        }
    });
});
