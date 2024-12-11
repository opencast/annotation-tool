/**
 *  Copyright 2021, elan e.V., Germany
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
    "backbone",
    "templates/scale-modal/scale-value"
], function (
    Backbone,
    template
) {
    "use strict";

    var ScaleValueView = Backbone.View.extend({
        events: {
            "click .add": function () {
                this.trigger("add", this);
            },
            "click .remove": function () {
                this.trigger("remove", this);
            },
            "click .move-down": function () {
                this.trigger("move-down", this);
            },
            "click .move-up": function () {
                this.trigger("move-up", this);
            },
            "change .name": function (event) {
                this.model.set({ name: event.target.value });
            },
            "change .value": function (event) {
                this.model.set({ value: Number(event.target.value) });
            }
        },

        initialize: function (options) {
            this.model = options.model;
            this.render();
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        template: template,

        tagName: "tr"
    });

    return ScaleValueView;
});
