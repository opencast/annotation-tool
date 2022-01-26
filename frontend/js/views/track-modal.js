/**
 *  Copyright 2021, ELAN e.V., Germany
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
    "access",
    "i18next",
    "views/modal",
    "templates/track-modal"
], function (
    ACCESS,
    i18next,
    Modal,
    template
) {
    var TrackModal = Modal.extend({

        initialize: function (options) {
            this.track = options.track;
            this.render();
        },

        render: function () {
            this.$el.html(template({
                action: this.track.isNew() ? "add" : "update",
                track: this.track.toJSON()
            }));

            var access = ACCESS.render(this.track.get("access"));
            this.$el.find("[name='access-radio'][value='" + access + "']").prop("checked", true);

            return this;
        },

        events: {
            "click .cancel": "remove",
            "change [name='access-radio']": "fixExplanationVisibility",
            "submit form": function (event) {
                event.preventDefault();

                var name = this.$el.find("#name").val();
                var description = this.$el.find("#description").val();

                if (name === "") {
                    this.$el.find(".alert #content").html(i18next.t("timeline.name required"));
                    this.$el.find(".alert").show();
                    return;
                } else if (name.search(/<\/?script>/i) >= 0 || description.search(/<\/?script>/i) >= 0) {
                    this.$el.find(".alert #content").html(i18next.t("timeline.scripts not allowed"));
                    this.$el.find(".alert").show();
                    return;
                }

                var access;
                var accessRadio = this.$el.find("input[name='access-radio']:checked");
                if (accessRadio.length > 0) {
                    access = ACCESS.parse(accessRadio.val());
                } else {
                    access = ACCESS.PUBLIC;
                }

                var attrs = {
                    name: name,
                    description: description,
                    access: access
                };
                if (this.track.isNew()) {
                    annotationTool.video.get("tracks").create(attrs, { wait: true });
                } else {
                    this.track.save(attrs);
                }

                this.remove();
            }
        },

        modalOptions: {
            show: true,
            backdrop: false,
            keyboard: true
        },

        template: template
    });

    return TrackModal;
});
