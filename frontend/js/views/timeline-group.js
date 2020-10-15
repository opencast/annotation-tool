/**
 *  Copyright 2019, ELAN e.V., Germany
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

/**
 * A module representing the group header of a track in the timeline
 * @module views-timeline-group
 */
define([
    "underscore",
    "backbone",
    "access",
    "templates/timeline-group",
    "jquery"
], function (
    _,
    Backbone,
    ACCESS,
    template,
    $
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#View}
     * @augments module:Backbone.View
     * @memberOf module:views-timeline
     * @alias module:views-timeline.TimelineView
     */
    var TimelineGroup = Backbone.View.extend({
        /** @override */
        initialize: function (options) {
            this.parent = options.parent;

            this.tooltipSelector =
                ".visibility[data-id=" + this.model.id + "] button";

            $("body").on(
                "click",
                this.tooltipSelector,
                _.bind(function (event) {
                    this.model.save({
                        access: ACCESS.parse(
                            $(event.currentTarget).data("access")
                        )
                    });
                }, this)
            );

            $(document).on(
                "click.visibilityTooltip",
                _.bind(function (event) {
                    if (this.visibilityButton && (
                        !this.visibilityButton.has(event.target).length
                    )) {
                        this.visibilityButton.tooltip("hide");
                    }
                }, this)
            );
        },

        /** @override */
        remove: function () {
            $(document).off("click.visibilityTooltip");
            $("body").off("click", this.tooltipSelector);
            if (this.visibilityButton) {
                this.visibilityButton.tooltip("destroy");
            }
            return Backbone.View.prototype.remove.apply(this, arguments);
        },

        /** @override */
        render: function () {
            if (this.visibilityButton) {
                this.visibilityButton.tooltip("destroy");
            }

            var modelJSON = this.model.toJSON();
            modelJSON.access = ACCESS.render(modelJSON.access);
            this.$el.html(template(modelJSON));
            this.visibilityButton = this.$el.find(".visibility")
                .tooltip({
                    container: 'body',
                    html: true
                });
            return this;
        },

        /** @override */
        events: {
            "click .delete": function (event) {
                annotationTool.deleteOperation.start(
                    this.model,
                    annotationTool.deleteOperation.targetTypes.TRACK
                );
            },
            "click .update": function (event) {
                this.parent.initTrackModal(event, this.model);
            }
        }
    });

    return TimelineGroup;
});
