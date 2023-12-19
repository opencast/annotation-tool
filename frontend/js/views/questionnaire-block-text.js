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
    "templates/questionnaire-block-text",
    "templates/questionnaire-block-layout",
    "models/content-item",
    "backbone"
], function (template, tmplLayout, ContentItem, Backbone) {
    "use strict";

    return Backbone.View.extend({
        tagName: "section",
        className: "questionnaire-block-text",
        events: {
            "keyup textarea": "onKeyup"
        },
        initialize: function (options) {
            this.item = options.item;
            var value = options.value || null;

            if (typeof(Storage) !== "undefined") {
                if (window.localStorage.getItem("oat_questionnaire_draft") != null) {
                    //console.log("init block while draft = true, prefill");
                    value = window.localStorage.getItem("oat_questionnaire_field_" + this.item.name);
                } else {
                    //console.log("init block while draft = false, no prefill");
                }
            }

            this.model = new ContentItem({
                type: "text",
                schema: options.schema,
                title: this.item.title,
                value: value
            });
            this.validationErrors = [];
        },
        render: function () {
            this.$el.html(
                template(
                    {
                        item: this.item,
                        contentItem: this.model.toJSON(),
                        validationErrors: this.validationErrors
                    },
                    { partials: { layout: tmplLayout } }
                )
            );
            return this;
        },
        validate: function () {
            if (this.item.required) {
                var text = this.model.get("value");
                if (!_.isString(text) || !text.trim().length) {
                    this.validationErrors = ["validation errors.empty"];

                    return false;
                }
            }
            this.validationErrors = [];

            return true;
        },
        getContentItems: function () {
            return this.model;
        },
        onKeyup: function (event) {
            event.stopImmediatePropagation();
            //console.log($(event.target).attr("name"));
            if (typeof(Storage) !== "undefined") {
                window.localStorage.setItem("oat_questionnaire_draft","true");
                window.localStorage.setItem("oat_questionnaire_field_" + $(event.target).attr("name"), $(event.target).val());
            }
            this.model.set("value", $(event.target).val());
        }
    });
});
