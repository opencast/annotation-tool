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
    "templates/questionnaire/block-text",
    "templates/questionnaire/block-layout",
    "models/content-item",
    "backbone"
], function (template, tmplLayout, ContentItem, Backbone) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-questionnaire
     * @alias module:views-questionnaire.TextBlock
     */
    return Backbone.View.extend({
        /**
         * Tag name from the view element
         * @type {string}
         */
        tagName: "section",

        /**
         * Class name from the view element
         * @type {string}
         */
        className: "questionnaire-block-text",

        /**
         * Storage prefix identifier
         * @type {string}
         */
        storagePrefix: "oat_questionnaire",

        /**
         * Events to handle
         * @alias module:views-questionnaire.TextBlock#events
         * @type {object}
         */
        events: {
            "keyup textarea": "onKeyup"
        },

        /**
         * Constructor
         * @alias module:views-questionnaire.TextBlock#initialize
         */
        initialize: function (options) {
            this.annotation = options.annotation;
            this.item = options.item;

            if (!this.annotation.id) {
                throw new Error("Annotation ID must exist (not persisted?).");
            }

            let val = options.value || null;

            if (this.hasStorageSupport() && this.isDraft()) {
                // Prefill block while draft
                val = localStorage.getItem(
                    this.getStorageIdentifier("field", this.item.name)
                );
            }

            this.model = new ContentItem({
                type: "text",
                schema: options.schema,
                title: this.item.title,
                value: val
            });

            this.validationErrors = [];
        },

        /**
         * Render the view
         * @alias module:views-questionnaire.TextBlock#render
         */
        render: function () {
            this.$el.html(
                template(
                    {
                        isMine: this.annotation.isMine(),
                        item: this.item,
                        contentItem: this.model.toJSON(),
                        validationErrors: this.validationErrors
                    },
                    { partials: { layout: tmplLayout } }
                )
            );

            return this;
        },

        /**
         * Validate items
         * @alias module:views-questionnaire.TextBlock#validate
         */
        validate: function () {
            if (this.item.required) {
                const text = this.model.get("value");

                if (!_.isString(text) || !text.trim().length) {
                    this.validationErrors = ["validation errors.empty"];

                    return false;
                }
            }

            this.validationErrors = [];

            return true;
        },

        /**
         * Get content items from model
         * @alias module:views-questionnaire.TextBlock#getContentItems
         */
        getContentItems: function () {
            return this.model;
        },

        /**
         * Get storage identifier string
         * @alias module:views-questionnaire.TextBlock#getStorageIdentifier
         */
        getStorageIdentifier: function (prefix, data) {
            const dataStr = !!data ? `_${data}` : "";

            return `${this.storagePrefix}_${prefix}${dataStr}_${this.annotation.id}`;
        },

        /**
         * Remove fields + draft from storage
         * @alias module:views-questionnaire.TextBlock#clearStorage
         */
        clearStorage: function (id) {
            if (!this.hasStorageSupport()) {
                return;
            }

            if (!id) {
                throw new Error("Annotation ID must exist.");
            }

            Object.keys(localStorage)
                .filter((x) => x.startsWith(this.storagePrefix))
                .filter((x) => x.endsWith(id))
                .forEach((x) => localStorage.removeItem(x));
        },

        /**
         * Get fields draft state
         * @alias module:views-questionnaire.TextBlock#isDraft
         */
        isDraft: function () {
            return localStorage.getItem(this.getStorageIdentifier("draft")) != null;
        },

        /**
         * Get if storage API exists in browser
         * @alias module:views-questionnaire.TextBlock#hasStorageSupport
         */
        hasStorageSupport: function () {
            return typeof Storage !== "undefined";
        },

        /**
         * Keyup event handling
         * @alias module:views-questionnaire.TextBlock#onKeyup
         */
        onKeyup: function (event) {
            const $element = $(event.target);

            event.stopImmediatePropagation();

            if (this.hasStorageSupport()) {
                localStorage.setItem(this.getStorageIdentifier("draft"), "true");
                localStorage.setItem(
                    this.getStorageIdentifier("field", $element.attr("name")),
                    $element.val()
                );
            }

            this.model.set("value", $element.val());
        }
    });
});
