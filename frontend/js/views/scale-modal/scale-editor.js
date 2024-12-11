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
    "views/scale-modal/scale-values",
    "templates/scale-modal/scale-editor"
], function (
    Backbone,
    ScaleValuesView,
    template
) {
    "use strict";

    var ScaleEditor = Backbone.View.extend({
        events: {
            "change #scale-modal-name": function (event) {
                this.model.set({ name: event.target.value });
            }
        },

        initialize: function (options) {
            this.model = options.model;

            var modelJSON = this.model.toJSON();
            modelJSON.deletable = options.deletable;

            this.$el.html(this.template(modelJSON));

            new ScaleValuesView({
                el: this.$el.find("#scale-values"),
                collection: this.model.get("scaleValues")
            });
        },

        template: template
    });

    return ScaleEditor;
});
