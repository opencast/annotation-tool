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
    "handlebarsHelpers"
], function(_, $, i18next, Backbone, template, CategoriesBlock, HelpBlock, LabelBlock, ScaleBlock, TextBlock) {
    "use strict";

    return Backbone.View.extend({
        events: {
            "click .questionnaire-start": "onStart",
            "submit form": "onSubmitForm",
            "click button.cancel": "onCancel"
        },

        initialize: function(options) {
            this.questionnaire = annotationTool.video.getQuestionnaire();
            // TODO
            this.questionnaire = getMockupQuestionnaire();

            this.annotation = null;
            this.items = createItems(this.questionnaire);
            this.validationErrors = {};
            this.render();
        },

        remove: function() {
            _.invoke(this.items, "remove");
            Backbone.View.prototype.remove.apply(this, arguments);
        },

        render: function() {
            _.each(this.items, function(item) {
                item.render().$el.detach();
            });

            var annotation;
            if (this.annotation) {
                annotation = this.annotation.toJSON();
                annotation.end = annotation.start + annotation.duration;
            }

            this.$el.html(template({ annotation: annotation, prompt: this.questionnaire.prompt }));
            var $viewContainer = this.$(".questionnaire-items");

            _.each(this.items, function(item) {
                $viewContainer.append(item.$el);
            });
        },

        onCancel: function(event) {
            annotationTool.deleteOperation.start(
                this.annotation,
                annotationTool.deleteOperation.targetTypes.ANNOTATION
            );
            this.onDestroy();
        },

        onDestroy: function() {
            this.stopListening(this.annotation);
            this.annotation = null;
            this.render();
        },

        /**
         * Save the end time
         * @alias module:views-list-annotation.ListAnnotation#saveEnd
         * @param  {event} event Event object
         */
        onChangeEnd: function(event) {
            var $target = $(event.currentTarget);
            var value = $target.val();

            // If keydown event but not enter, value must not be saved
            if (event.type === "keydown" && event.keyCode !== 13) {
                return;
            }

            delete this.validationErrors.end;

            if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                this.validationErrors.end = "validation errors.wrong format";
                return;
            }

            var values = value.split(":");

            var seconds;
            if (values.length === 3) {
                seconds = parseInt(values[0], 10) * 3600 + parseInt(values[1], 10) * 60 + parseInt(values[2], 10);
            } else if (values.length === 2) {
                seconds = parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
            } else {
                seconds = parseInt(values[0], 10);
            }

            if (annotationTool.playerAdapter.getDuration() < seconds || this.annotation.get("start") > seconds) {
                this.validationErrors.end = "validation errors.out of bounds";

                return;
            }

            this.annotation.set("duration", Math.round(seconds - this.annotation.get("start")));
            this.annotation.save(null, { silent: true });
        },

        /**
         * Save the start time
         * @alias module:views-list-annotation.ListAnnotation#saveStart
         * @param  {event} event Event object
         */
        onChangeStart: function(event) {
            var $target = $(event.currentTarget);
            var value = $target.val();

            // If keydown event but not enter, value must not be saved
            if (event.type === "keydown" && event.keyCode !== 13) {
                return;
            }

            var duration = this.annotation.get("duration");

            delete this.validationErrors.end;

            if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                this.validationErrors.end = "validation errors.wrong format";
                return;
            }
            var values = value.split(":");

            var seconds;
            if (values.length === 3) {
                seconds = parseInt(values[0], 10) * 3600 + parseInt(values[1], 10) * 60 + parseInt(values[2], 10);
            } else if (values.length === 2) {
                seconds = parseInt(values[0], 10) * 60 + parseInt(values[1], 10);
            } else {
                seconds = parseInt(values[0], 10);
            }

            if (duration > 0 && duration + this.annotation.get("start") < seconds) {
                this.validationErrors.end = "validation errors.out of bounds";
                return;
            }

            this.annotation.set({
                start: seconds,
                duration: Math.round(this.annotation.get("duration") + this.annotation.get("start") - seconds)
            });
            this.annotation.save(null, { silent: true });
        },

        onStart: function(event) {
            this.annotation = annotationTool.createAnnotation({});
            this.listenTo(this.annotation, "destroy", this.onDestroy);
            this.render();
        },

        onSubmitForm: function(event) {
            event.preventDefault();

            if (_.every(_.invoke(this.items, "validate"))) {
                var contentItems = _.filter(_.flatten(_.invoke(this.items, "getContentItems")));
                this.annotation.get("content").reset(contentItems);
                this.annotation.save();
                this.annotation = null;
            }

            this.render();
        }
    });

    function createItems(jsonform) {
        var formFields = _.reduce(
            jsonform.schema,
            function(memo, item, key) {
                var block;
                switch (item.type) {
                    case "label":
                        block = new LabelBlock({ item: item });
                        break;
                    case "scale":
                        block = new ScaleBlock({ item: item });
                        break;
                    case "string":
                        block = new TextBlock({ item: item });
                        break;
                    case "categories":
                        block = new CategoriesBlock({ item: item });
                        break;

                    default:
                        throw new Error("Missing item type: " + item.type);
                }
                memo[key] = block;

                return memo;
            },
            {}
        );

        return _.map(jsonform.form, function(item) {
            if (_.isString(item) && item in formFields) {
                return formFields[item];
            }

            if (_.isObject(item) && item.type && item.type === "help") {
                return new HelpBlock({ item: item });
            }

            throw "Invalid JSON form.";
        });
    }
});

function getMockupQuestionnaire() {
    return {
        prompt:
            "Ut enimad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        schema: {
            free: {
                type: "string",
                title: "Ein Freitext-Inhalt",
                description: "Duis aute irure dolor in reprehenderit in voluptate",
                required: true
            },
            free2: {
                type: "string",
                title: "Ein zweiter Freitext-Inhalt",
                description: "Duis aute irure dolor in reprehenderit in voluptate",
                required: true
            },
            label: {
                type: "label",
                title: "Ein Inhalt mit Kennzeichen",
                category: "Qualität",
                description: "Velit esse cillum dolore eu fugiat nulla pariatur"
            },
            scale: {
                type: "scale",
                title: "Ein Inhalt mit Kennzeichen und Skalenwert",
                category: "Numerisch",
                description: "Velit esse cillum dolore eu fugiat nulla pariatur"
            },
            many: {
                type: "categories",
                title: "Eines von vielen",
                categories: ["Qualität", "Numerisch"],
                description: "Velit esse cillum dolore eu fugiat nulla pariatur",
                minItems: 1
            }
        },
        form: [
            {
                type: "help",
                helpvalue:
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            },
            "free",
            {
                type: "help",
                helpvalue:
                    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            },
            "free2",
            "many"
        ]
    };
}
