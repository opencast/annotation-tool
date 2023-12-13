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
    "templates/questionnaire-block-help",
    "templates/questionnaire-block-layout",
    "backbone",
    "bootstrap"
], function (template, tmplLayout, Backbone) {
    "use strict";

    return Backbone.View.extend({
        tagName: "section",
        className: "questionnaire-block-help",
        initialize: function (options) {
            this.item = options.item;
        },
        render: function () {
            this.$el.html(template({ item: this.item }, { partials: { layout: tmplLayout } }));
            return this;
        },
        validate: function () {
            return true;
        },
        getContentItems: function () {
            return [];
        }
    });
});
