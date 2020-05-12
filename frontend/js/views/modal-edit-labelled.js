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
define(["templates/modal-add-labelled", "backbone", "bootstrap"], function(template, Backbone) {
    "use strict";

    return Backbone.View.extend({
        events: {
            "click .btn.label": "updateLabelledContent",
            "click .btn.label-and-scale": "updateScalingContent",
        },

        initialize: function(options) {
            this.category = options.category;
            this.contentItem = options.contentItem;
        },

        render: function() {
            var labels = this.category.get("labels").toJSON();
            var scale = null;
            if (this.category.get("scale_id")) {
                scale = annotationTool.video.get("scales").get(this.category.get("scale_id"));
                scale = _.extend(scale.toJSON(), { scaleValues: scale.get("scaleValues").toJSON() });
            }

            this.$el.html(template({
                cid: this.cid,
                annotation: this.model.toJSON(),
                category: this.category.toJSON(),
                contentItem: this.contentItem.toJSON(),
                labels: labels,
                scale: scale
            }));

            return this;
        },

        updateLabelledContent: function (event) {
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");

            this.contentItem.set('value', labelId);
            this.model.save();
            this.trigger("modal:request-close");
        },

        updateScalingContent: function (event) {
            var $button = $(event.currentTarget);
            var labelId = $button.data("label");
            var scaleValueId = $button.data("scalevalue");

            this.contentItem.set('value', { label: labelId, scaling: scaleValueId });
            this.model.save();
            this.trigger("modal:request-close");
        },
    });
});
