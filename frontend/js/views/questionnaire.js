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
    "jquery",
    "i18next",
    "backbone",
    "templates/questionnaire",
    "views/questionnaire-block-categories",
    "views/questionnaire-block-help",
    "views/questionnaire-block-label",
    "views/questionnaire-block-scale",
    "views/questionnaire-block-text",
    "views/annotation-timestamp",
    "handlebarsHelpers"
], function(_, $, i18next, Backbone, template, CategoriesBlock, HelpBlock, LabelBlock, ScaleBlock, TextBlock, AnnotationTimestampView) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-questionnaire
     * @alias module:views-questionnaire.QuestionnaireView
     */
    return Backbone.View.extend({
        /** Events to handle
         * @alias module:views-questionnaire.QuestionnaireView
         * @type {object}
         */
        events: {
            "click .questionnaire-start": "onStart",
            "submit form": "onSubmitForm",
            "click button.cancel": "onCancel"
        },

        /**
         * Constructor
         * @alias module:views-questionnaire.QuestionnaireView#initialize
         */
        initialize: function(options) {
            this.questionnaire = annotationTool.video.getQuestionnaire();
            // TODO
            this.questionnaire = getMockupQuestionnaire();
            this.resetQuestionnaire();
            this.render();

            Backbone.on("questionnaire:edit-annotation", this.onShowEdit.bind(this));
        },

        /**
         * Reset local state of questionnaire.
         * @alias module:views-questionnaire.QuestionnaireView#resetQuestionnaire
         */
        resetQuestionnaire: function() {
            this.annotation = null;
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
         * Destructor
         * @alias module:views-questionnaire.QuestionnaireView#remove
         */
        remove: function() {
            if (this.items) {
                _.invoke(this.items, "remove");
            }
            Backbone.off("questionnaire:edit-annotation");

            Backbone.View.prototype.remove.apply(this, arguments);
        },

        /**
         * Render this view
         * @alias module:views-questionnaire.QuestionnaireView#render
         */
        render: function() {
            _.each(this.items, function(item) {
                item.render().$el.detach();
            });

            this.timestampsView && this.timestampsView.$el.detach();

            var annotation;
            if (this.annotation) {
                annotation = this.annotation.toJSON();
                annotation.end = annotation.start + annotation.duration;
            }

            this.$el.html(template({
                annotation: annotation,
                prompt: this.questionnaire.prompt,
            }));

            if (this.annotation && !this.timestampsView) {
                this.timestampsView = new AnnotationTimestampView({ model: this.annotation }).render();
            }

            if (this.timestampsView) {
                this.$(".questionnaire-timestamps-container").append(this.timestampsView.$el);
            }

            var $viewContainer = this.$(".questionnaire-items");
            _.each(this.items, function(item) {
                $viewContainer.append(item.$el);
            });
        },

        /**
         * Listener for click on the cancel button
         * @alias module:views-questionnaire.QuestionnaireView#onCancel
         * @param {Event} event the click event
         */
        onCancel: function(event) {
            if (!this.annotation.get("createdFromQuestionnaire")) {
                annotationTool.deleteOperation.start(
                    this.annotation,
                    annotationTool.deleteOperation.targetTypes.ANNOTATION,
                    this.closeQuestionnaire.bind(this)
                );
            } else {
                this.closeQuestionnaire();
            }
        },

        /**
         * Helper function for resetting the local state and re-rendering.
         * @alias module:views-questionnaire.QuestionnaireView#onDestroy
         */
        onDestroy: function() {
            this.closeQuestionnaire();
        },

        /**
         * Closes the questionnaire.
         * @alias module:views-questionnaire.QuestionnaireView#closeQuestionnaire
         */
        closeQuestionnaire: function() {
            this.stopListening(this.annotation);
            this.annotation = null;
            this.resetQuestionnaire();
            this.render();
        },

        /**
         * Listener for changes while editing the end time
         * @alias module:views-questionnaire.Questionnaire#onChangeEnd
         * @param  {event} event Event object
         */
        onChangeEnd: function(event) {
            var $target = $(event.currentTarget);
            var value = $target.val();

            this.validationErrors.end = null;

            if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                this.validationErrors.end = "validation errors.wrong format";
                return;
            }

            var values = value.split(":");
            var newEnd;
            if (values.length === 3) {
                newEnd = parseInt(values[0], 10) * 3600 + parseInt(values[1], 10) * 60 + parseInt(values[2], 10);
            } else if (values.length === 2) {
                newEnd = parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
            } else {
                newEnd = parseInt(values[0], 10);
            }

            var start = this.annotation.get("start");
            if (annotationTool.playerAdapter.getDuration() < newEnd || start > newEnd) {
                this.validationErrors.end = "validation errors.out of bounds";

                return;
            }

            this.annotation.set({ duration: Math.round(newEnd - start) });
            this.annotation.save(null, { silent: true });
        },

        /**
         * Listener for changes while editing the start time
         * @alias module:views-questionnaire.Questionnaire#onChangeStart
         * @param  {event} event Event object
         */
        onChangeStart: function(event) {
            var $target = $(event.currentTarget);
            var $controlGroup = $target.closest(".control-group");
            var $error = $controlGroup.find(".error-msg");
            var value = $target.val();

            $error.html("");
            $controlGroup.removeClass("error");
            this.validationErrors.start = null;

            if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                this.validationErrors.start = "validation errors.wrong format";
                $controlGroup.addClass("error");
                $error.html(i18next.t(this.validationErrors.start));
                return;
            }

            var values = value.split(":");
            var newStart;
            if (values.length === 3) {
                newStart = parseInt(values[0], 10) * 3600 + parseInt(values[1], 10) * 60 + parseInt(values[2], 10);
            } else if (values.length === 2) {
                newStart = parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
            } else {
                newStart = parseInt(values[0], 10);
            }

            var duration = this.annotation.get("duration");
            var start = this.annotation.get("start");
            var end = start + duration;

            if (duration > 0 && end < newStart) {
                this.validationErrors.start = "validation errors.start after end";
                $controlGroup.addClass("error");
                $error.html(i18next.t(this.validationErrors.start));
                return;
            }

            this.annotation.set({ start: newStart, duration: Math.round(end - newStart) });
        },

        /**
         * Listener for click on the start button
         * @alias module:views-questionnaire.QuestionnaireView#onStart
         * @param {Event} event the click event
         */
        onStart: function(event) {
            var annotation = annotationTool.createAnnotation({});
            this.openQuestionnaire(annotation);
        },

        /**
         * Opens the questionnaire using the given annotation.
         * @alias module:views-questionnaire.QuestionnaireView#openQuestionnaire
         * @param {Annotation} annotation the annotation to show
         */
        openQuestionnaire: function (annotation) {
            this.annotation = annotation;
            this.listenTo(this.annotation, "destroy", this.onDestroy);
            this.items = createItems(this.questionnaire, this.annotation);
            this.render();
        },

        /**
         * Listener for submitting the form
         * @alias module:views-questionnaire.QuestionnaireView#onSubmitForm
         * @param {Event} event the submit event
         */
        onSubmitForm: function(event) {
            event.preventDefault();

            if (!this.validationErrors.start &&
                !this.validationErrors.end &&
                _.every(_.invoke(this.items, "validate"))) {
                var contentItems = _.filter(_.flatten(_.invoke(this.items, "getContentItems")));
                this.annotation.get("content").reset(contentItems);
                this.annotation.set({createdFromQuestionnaire: true});
                this.annotation.save();
                this.annotation = null;
            }

            this.onDestroy();
        },

        /**
         * Listener for the signal to open the questionnaire for editing of an existing annotation.
         * @alias module:views-questionnaire.QuestionnaireView#onShowEdit
         * @param {Annotation} annotation the annotation to edit
         */
        onShowEdit: function(annotation) {
            // we are already editing this annotation
            if (this.annotation && this.annotation.cid === annotation.cid) {
                console.error("You are already editing this annotation.");
                return;
            }

            if (!annotation.get("createdFromQuestionnaire")) {
                console.error("This annotation cannot be edited via questionnaire.");
                return;
            }

            if (this.annotation) {
                var confirmed = confirm(i18next.t("annotate.confirm edit"));
                if (!confirmed) {
                    return;
                }
            }

            this.closeQuestionnaire();
            this.openQuestionnaire(annotation);
        }
    });

    function createItems(jsonform, annotation) {
        var typeMapping = {
            label: LabelBlock,
            scale: ScaleBlock,
            string: TextBlock,
            categories: CategoriesBlock
        };

        var formFields = _.reduce(
            jsonform.schema,
            function(memo, item, key) {
                if (!(item.type in typeMapping)) {
                    throw new Error("Missing item type: " + item.type);
                }
                memo[key] = item;

                return memo;
            },
            {}
        );

        var values = annotation.get("content").groupBy(function (contentItem) {
            return contentItem.get("schema");
        });

        return _.map(jsonform.form, function(formItem) {
            if (_.isString(formItem) && formItem in formFields) {

                var formField = formFields[formItem];
                var typeFunction = typeMapping[formField.type];
                var value = null;
                if (formItem in values) {
                    value =
                        formField.type !== 'categories'
                        ? _.head(values[formItem]).get("value")
                        : values[formItem];
                }
                var block = new typeFunction({
                    item: formField,
                    schema: formItem,
                    value: value
                });

                return block;
            }

            if (_.isObject(formItem) && formItem.type && formItem.type === "help") {
                return new HelpBlock({ item: formItem });
            }

            throw "Invalid JSON form.";
        });
    }
});

function getMockupQuestionnaire() {
    return {
        "schema": {
            "item-0": {
                "type": "string",
                "title": "1. Beschreibung",
                "description": "Beschreiben Sie alle relevanten Ereignisse, die Sie hinsichtlich des Analysefokus entdecken können.",
                "required": true
            },
            "item-1": {
                "type": "categories",
                "title": "2a. Interpretation",
                "description": "Interpretieren und erklären Sie möglichst theoriegeleitet die (Re-)Aktion der Lehrperson (und ggf. der SuS) in dieser Unterrichtssequenz. Nutzen Sie die Kategorien des Analysefokus. (Wählen Sie mindestens eine Kategorie aus)",
                // "categories": [
                //     "KF-MO: Monitoring",
                //     "KF-ST: Strukturierung",
                //     "KF-RR: Regeln und Routinen"
                // ],
                "minItems": 1
            },
            "item-2": {
                "type": "string",
                "title": "2b. Interpretation",
                "description": "Interpretieren und erklären Sie möglichst theoriegeleitet die (Re-)Aktion der Lehrperson (und ggf. der SuS) in dieser Unterrichtssequenz. Begründen Sie Ihre Interpretation.",
                "required": true
            },
            "item-3": {
                "type": "string",
                "title": "3. Bewertung",
                "description": "Bewerten Sie, wie angemessen die (Re-)Aktion der Lehrperson im jeweiligen Kontext erscheint und begründen Sie Ihre Einschätzung.",
                "required": true
            },
            "item-4": {
                "type": "string",
                "title": "4. Handlungsalternative",
                "description": "Formulieren Sie eine sinnvolle Handlungsalternative für die Lehrperson und diskutieren Sie, ob und inwiefern diese im gegebenen Kontext angemessener als die realisierte Handlung der Lehrperson wäre.",
                "required": true
            }
        },
        "form": [
            {
                "type": "help",
                "helpvalue": "Freie Annotation des Unterrichtsvideos: Wählen Sie zunächst oben die Start- und Endzeit der annotierten Unterrichtssequenz. Benutzen Sie dann das folgende Analyseschema mit den vier Facetten der professionellen Unterrichtswahrnehmung."
            },
            "item-0",
            "item-1",
            "item-2",
            "item-3",
            "item-4"
        ]
    };
}
