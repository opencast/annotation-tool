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
    "underscore",
    "templates/category-modal/label"
], function (
    Backbone,
    _,
    template
) {
    "use strict";

    var LabelView = Backbone.View.extend({

        events: {
            "change .value": function (event) {
                this.model.set({ value: event.target.value });
                this.updateAbbreviation();
            },
            "change .abbreviation": function (event) {
                this.model.set({ abbreviation: event.target.value });
            },
            "click .remove": function (event) {
                if (this.model.collection.length === 1) {
                    this.model.set({ value: "", abbreviation: "" });
                    this.render();
                } else {
                    this.model.collection.remove(this.model.cid);
                    this.remove();
                }
            }
        },

        render: function () {
            var model = this.model.toJSON();
            this.$el.html(this.template(model));
            return this;
        },

        initialize: function (options) {
            this.model = options.model;
            this.render();
        },

        updateAbbreviation: function () {
            var abbreviation = this.model.get("abbreviation");
            var value = this.model.get("value");

            if (_.isUndefined(abbreviation) || abbreviation === "" || abbreviation === value.substr(0, 3).toUpperCase()) {
                var newAbbreviation = value.substr(0, 3).toUpperCase();
                this.model.set({ abbreviation: newAbbreviation });
                this.$el.find(".abbreviation").val(newAbbreviation);
            }
        },

        template: template,

        tagName: "tr"
    });

    return LabelView;
});
