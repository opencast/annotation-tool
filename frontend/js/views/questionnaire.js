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
 */
define([
    "underscore",
    "jquery",
    "alerts",
    "i18next",
    "backbone",
    "templates/questionnaire",
    "views/questionnaire/categories",
    "views/questionnaire/help",
    "views/questionnaire/label",
    "views/questionnaire/scale",
    "views/questionnaire/text",
    "views/annotation-timestamp"
], function (
    _,
    $,
    alerts,
    i18next,
    Backbone,
    template,
    CategoriesBlock,
    HelpBlock,
    LabelBlock,
    ScaleBlock,
    TextBlock,
    AnnotationTimestampView
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-questionnaire
     * @alias module:views-questionnaire.QuestionnaireView
     */
    return Backbone.View.extend({
        /**
         * Single questionnaire
         * @alias module:views-questionnaire.QuestionnaireView#questionnaire
         * @type {null|Questionnaire}
         */
        questionnaire: null,

        /**
         * List of questionnaires
         * @alias module:views-questionnaire.QuestionnaireView#questionnaires
         * @type {null|Questionnaires}
         */
        questionnaires: null,

        /**
         * Events to handle
         * @alias module:views-questionnaire.QuestionnaireView
         * @type {object}
         */
        events: {
            "submit form": "onSubmitForm",
            "click button.cancel": "onCancel"
        },

        /**
         * Custom event name map
         * @todo CC | Optimize: Implement storage deletion, if annotation is deleted (hook into its event)? Avoid stale data and filling the browsers capacity.
         * @alias module:views-questionnaire.QuestionnaireView#customEvents
         * @type {object}
         */
        customEvents: {
            // Subscribe
            createAnnotation: "questionnaire:create-annotation",
            editAnnotation: "questionnaire:edit-annotation"
        },

        /**
         * Constructor
         * @alias module:views-questionnaire.QuestionnaireView#initialize
         * @param {object} _options
         */
        initialize: function (_options) {
            this.questionnaires = annotationTool.video.get("questionnaires");

            this.resetViewAndValidation();
            this.render();
            this.bind();
        },

        /**
         * Event binding
         * @alias module:views-questionnaire.QuestionnaireView#bind
         */
        bind: function () {
            Backbone.on(
                this.customEvents.createAnnotation,
                this.onStart.bind(this)
            );

            Backbone.on(
                this.customEvents.editAnnotation,
                this.onShowEdit.bind(this)
            );
        },

        /**
         * Destructor
         * @augments module:Backbone.View
         * @alias module:views-questionnaire.QuestionnaireView#remove
         */
        remove: function () {
            Backbone.off(this.customEvents.createAnnotation);
            Backbone.off(this.customEvents.editAnnotation);

            if (this.items) {
                _.invoke(this.items, "remove");
            }

            Backbone.View.prototype.remove.apply(this, arguments);
        },

        /**
         * Reset storage of questionnaire for annotation.
         * @alias module:views-questionnaire.QuestionnaireView#resetDraft
         * @param {null|object} annotation Annotation to delete state for
         */
        resetDraft: function (annotation) {
            if (annotation) {
                TextBlock.prototype.clearStorage(annotation.id);
            }
        },

        /**
         * Reset view, state and validation.
         * @alias module:views-questionnaire.QuestionnaireView#resetViewAndValidation
         */
        resetViewAndValidation: function () {
            if (this.timestampsView) {
                this.timestampsView.remove();
                this.timestampsView = null;
            }

            if (this.items) {
                _.invoke(this.items, "remove");
            }

            this.items = {};
            this.validationErrors = { start: null, end: null };
        },

        /**
         * Render this view
         * @alias module:views-questionnaire.QuestionnaireView#render
         */
        render: function () {
            this.timestampsView && this.timestampsView.$el.detach();

            let annotation;
            if (this.annotation) {
                annotation = this.annotation.toJSON();
                annotation.end = annotation.start + annotation.duration;
            }

            if (this.annotation && this.questionnaire) {
                const jsonForm = this.questionnaire.getForm();
                this.items = createItems(jsonForm, this.annotation);
            }

            _.each(this.items, function (item) {
                item.render({ isFirstOpen: true }).$el.detach();
            });

            this.$el.html(
                template({
                    annotation: annotation,
                    prompt: this.questionnaire ? this.questionnaire.getPromptAttribute() : null
                })
            );

            if (this.annotation && !this.timestampsView) {
                this.timestampsView = new AnnotationTimestampView({
                    model: this.annotation
                }).render();
            }

            if (this.timestampsView) {
                this.$(".questionnaire-timestamps-container").append(
                    this.timestampsView.$el
                );
            }

            const $viewContainer = this.$(".questionnaire-items");
            _.each(this.items, function (item) {
                $viewContainer.append(item.$el);
            });
        },

        /**
         * Listener for click on the cancel button.
         * 1) Annotation is created from questionnaire, but initial value is '0'.
         * @todo CC | Optimize: Integrate cancel modal (see comment below)?
         * @todo CC | Review: Refactor - Remove legacy conditional check 'createdFromQuestionnaire'?
         * @todo CC | Review: Should multiple drafts be allowed (instead of deleting them on switching?)
         * @alias module:views-questionnaire.QuestionnaireView#onCancel
         * @param {Event} _event Click event
         */
        onCancel: function (_event) {
            if (!this.annotation.get("createdFromQuestionnaire")) { // 1)
                annotationTool.deleteOperation.start(
                    this.annotation,
                    annotationTool.deleteOperation.targetTypes.ANNOTATION,
                    this.closeQuestionnaire.bind(this)
                );
            } else {
                // alerts.warning( i18next.t("questionnaire.draft.cancel") );
                // Listener for cancel confirmation. See 'annotation-tool.js' example:
                // deleteModal.find("#confirm-delete").one("click", confirm) ...
                this.closeQuestionnaire(this.annotation);
            }
        },

        /**
         * Helper function for resetting the state and re-rendering.
         * @alias module:views-questionnaire.QuestionnaireView#onDestroy
         */
        onDestroy: function () {
            this.closeQuestionnaire(this.annotation);
        },

        /**
         * On persisting annotation for questionnaire, create view items and handle storage.
         * Annotation ID given from server is needed.
         * @alias module:views-questionnaire.QuestionnaireView#onDestroy
         */
        onPersist: function () {
            this.render();
        },

        /**
         * Listener for changes while editing the end time
         * @alias module:views-questionnaire.Questionnaire#onChangeEnd
         * @param  {Event} event Change event
         */
        onChangeEnd: function (event) {
            const $target = $(event.currentTarget);
            const value = $target.val();

            this.validationErrors.end = null;

            if (
                !value.match(
                    /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/
                )
            ) {
                this.validationErrors.end = "validation errors.wrong format";
                return;
            }

            const values = value.split(":");
            let newEnd;
            if (values.length === 3) {
                newEnd =
                    parseInt(values[0], 10) * 3600 +
                    parseInt(values[1], 10) * 60 +
                    parseInt(values[2], 10);
            } else if (values.length === 2) {
                newEnd = parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
            } else {
                newEnd = parseInt(values[0], 10);
            }

            const start = this.annotation.get("start");
            if (
                annotationTool.playerAdapter.getDuration() < newEnd ||
                start > newEnd
            ) {
                this.validationErrors.end = "validation errors.out of bounds";

                return;
            }

            this.annotation.set({ duration: Math.round(newEnd - start) });
            this.annotation.save(null, { silent: true });
        },

        /**
         * Listener for changes while editing the start time
         * @alias module:views-questionnaire.Questionnaire#onChangeStart
         * @param {Event} event Change start event
         */
        onChangeStart: function (event) {
            const $target = $(event.currentTarget);
            const $controlGroup = $target.closest(".control-group");
            const $error = $controlGroup.find(".error-msg");
            const value = $target.val();

            $error.html("");
            $controlGroup.removeClass("error");
            this.validationErrors.start = null;

            if (
                !value.match(
                    /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/
                )
            ) {
                this.validationErrors.start = "validation errors.wrong format";
                $controlGroup.addClass("error");
                $error.html(i18next.t(this.validationErrors.start));
                return;
            }

            const values = value.split(":");
            let newStart;
            if (values.length === 3) {
                newStart =
                    parseInt(values[0], 10) * 3600 +
                    parseInt(values[1], 10) * 60 +
                    parseInt(values[2], 10);
            } else if (values.length === 2) {
                newStart =
                    parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
            } else {
                newStart = parseInt(values[0], 10);
            }

            const duration = this.annotation.get("duration");
            const start = this.annotation.get("start");
            const end = start + duration;

            if (duration > 0 && end < newStart) {
                this.validationErrors.start = "validation errors.start after end";
                $controlGroup.addClass("error");
                $error.html(i18next.t(this.validationErrors.start));
                return;
            }

            this.annotation.set({
                start: newStart,
                duration: Math.round(end - newStart)
            });
        },

        /**
         * Listener for starting a new questionnaire.
         * - Destroy any old data if exists, just in case.
         * - Create annotation and bind events to defer rendering.
         * @todo CC | Optimize: If clicking away in UI (NOT on cancel button) or creating a new, the empty annotation should be deleted
         * @alias module:views-questionnaire.QuestionnaireView#onStart
         * @param {number} id Questionnaire ID
         */
        onStart: function (id) {
            this.closeQuestionnaire(this.annotation);

            const annotation = annotationTool.createAnnotation({ createdFromQuestionnaire: id });

            this.setQuestionnaire(id);
            this.setAnnotation(annotation);

            this.listenToOnce(annotation, "sync", this.onPersist);
            this.listenToOnce(annotation, "destroy", this.onDestroy);
            this.listenToOnce(annotation, "error", () => {
                throw new Error("Cannot persist annotation");
            });
        },

        /**
         * Listener for submitting the form
         * @alias module:views-questionnaire.QuestionnaireView#onSubmitForm
         * @param {Event} event Submit event
         */
        onSubmitForm: function (event) {
            event.preventDefault();

            if (
                !this.validationErrors.start &&
                !this.validationErrors.end &&
                _.every(_.invoke(this.items, "validate"))
            ) {
                const contentItems = _.filter(
                    _.flatten(_.invoke(this.items, "getContentItems"))
                );

                this.annotation.get("content").reset(contentItems);
                this.annotation.set({ createdFromQuestionnaire: this.questionnaire.id });
                this.annotation.save();

                this.onDestroy();
            } else {
                this.render();
            }
        },

        /**
         * Listener for the signal to open the questionnaire for editing of an existing annotation.
         * @todo CC | Review: Shouldn't discard confirmation also delete the empty annotation? Currently only happens on clicking 'cancel'..
         * @alias module:views-questionnaire.QuestionnaireView#onShowEdit
         * @param {Annotation} annotation The annotation to edit
         */
        onShowEdit: function (annotation) {
            const questionnaireId = annotation.get("createdFromQuestionnaire");

            if (!questionnaireId) {
                console.error("This annotation cannot be edited via questionnaire.");
                return;
            }

            if (this.annotation && this.annotation.cid === annotation.cid) {
                console.error("You are already editing this annotation.");
                this.showLayout();
                return;
            }

            if (this.annotation) {
                const confirmed = confirm(i18next.t("annotate.confirm edit"));

                if (!confirmed) {
                    console.error("Not confirmed, end.");
                    return;
                }
            }

            this.showLayout();
            this.closeQuestionnaire(this.annotation);
            this.openQuestionnaire(questionnaireId, annotation);
        },

        /**
         * Opens the questionnaire using the given annotation.
         * @alias module:views-questionnaire.QuestionnaireView#openQuestionnaire
         * @param {Number} questionnaireId The questionnaire ID
         * @param {Annotation} annotation The annotation to show
         */
        openQuestionnaire: function (questionnaireId, annotation) {
            this.setQuestionnaire(questionnaireId);
            this.setAnnotation(annotation);

            this.render();
        },

        /**
         * Closes the questionnaire.
         * Unbind, reset, delete all data and re-render view.
         * @alias module:views-questionnaire.QuestionnaireView#closeQuestionnaire
         */
        closeQuestionnaire: function (annotation) {
            this.stopListening(annotation);
            this.resetViewAndValidation();
            this.resetDraft(annotation);
            this.setQuestionnaire(null);
            this.setAnnotation(null);

            this.render();
        },

        /**
         * Set/unset annotation model
         * @†odo CC | Review: Unsetting annotation, should it then be removed from collection?
         * @alias module:views-questionnaire.QuestionnaireView#setAnnotation
         * @param {null|object} annotation Annotation model | null
         */
        setAnnotation: function (annotation) {
            this.annotation = annotation;
        },

        /**
         * Set/unset questionnaire model
         * @alias module:views-questionnaire.QuestionnaireView#setQuestionnaire
         * @param {null|number} id Questionnaire ID | null
         */
        setQuestionnaire: function (id) {
            this.questionnaire = id ? this.questionnaires.getOneById(id) : null;
        },

        /**
         * Switch layout to questionnaire
         * @alias module:views-questionnaire.QuestionnaireView#showLayout
         */
        showLayout: function () {
            annotationTool.switchTab("questionnaire");
        }
    });

    /**
     * Map JSON to view items
     * @alias module:views-questionnaire.QuestionnaireView#createItems
     * @param {object} jsonform JSON form data
     * @param {object} annotation Annotation model
     * @return {object} View blocks
     */
    function createItems(jsonform, annotation) {
        const typeMapping = {
            label: LabelBlock,
            scale: ScaleBlock,
            string: TextBlock,
            categories: CategoriesBlock
        };

        const formFields = _.reduce(
            jsonform.schema,
            function (memo, item, key) {
                if (!(item.type in typeMapping)) {
                    const msg = i18next.t("questionnaire.json format error", { name: "type" });

                    alerts.error(msg);
                    throw new Error(msg);
                }
                memo[key] = item;

                return memo;
            },
            {}
        );

        const values = annotation.get("content").groupBy(function (contentItem) {
            return contentItem.get("schema");
        });

        return _.map(jsonform.form, function (formItem) {
            if (_.isString(formItem) && formItem in formFields) {
                const formField = formFields[formItem];
                const typeFunction = typeMapping[formField.type];
                let value = null;

                if (formItem in values) {
                    value =
                        formField.type !== "categories"
                            ? _.head(values[formItem]).get("value")
                            : values[formItem];
                }

                const block = new typeFunction({
                    annotation: annotation,
                    item: formField,
                    schema: formItem,
                    value: value
                });

                return block;
            }

            if (
                _.isObject(formItem) &&
                formItem.type &&
                formItem.type === "help"
            ) {
                return new HelpBlock({ item: formItem });
            }

            throw new Error("Invalid JSON form.");
        });
    }
});
