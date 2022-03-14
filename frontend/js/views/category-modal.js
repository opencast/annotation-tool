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
    "underscore",
    "access",
    "collections/labels",
    "views/modal",
    "views/category-modal/label",
    "templates/category-modal",
    "bootstrap",
    "jquery.colorPicker"
], function (
    _,
    ACCESS,
    Labels,
    Modal,
    LabelView,
    template
) {
    "use strict";

    var CategoryModal = Modal.extend({

        render: function () {
            var model = this.model.toJSON();

            this.$el.html(this.template({
                model: model,
                isNew: this.model.isNew(),
                scales: annotationTool.video.get("scales").toJSON()
            }));

            // Enable all the settings before potentially disabling them later
            // The reason being hiding any help-blocks
            this.enableScale();
            this.enableAffiliation();

            var access = ACCESS.render(this.model.get("access"));
            this.$el.find("[name='access'][value='" + access + "']").attr("checked", true);
            var affiliation = this.model.get("series_category_id") ? "series" : "event";
            this.$el.find("[name='affiliation'][value='" + affiliation + "']").attr("checked", true);

            if (affiliation === "series") {
                this.disableScale();
            }

            if (this.model.get("scale_id")) {
                this.$el.find("option[value='" + this.model.get("scale_id") + "']").attr("selected", true);
                this.disableAffiliation();
            }

            this.$el.find("input[type='color']").colorPicker();

            var labelsTable = this.$el.find("#labels");
            this.labels.each(function (label) {
                labelsTable.append(new LabelView({ model: label }).el);
            });

            this.$el.modal({ show: true, backdrop: "static", keyboard: false });
            return this;
        },

        events: {
            "submit form": function (event) {
                event.preventDefault();

                var scale = this.$el.find("select").val();

                var access = this.model.get("settings").createdAsMine
                    ? ACCESS.parse(this.$el.find("[name='access']:checked").val())
                    : ACCESS.PUBLIC;

                this.model.set({
                    access: access,
                    name: this.$el.find("#name").val(),
                    scale_id: scale,
                    settings: _.extend({}, this.model.get("settings"), {
                        color: this.$el.find("input[type='color']").val(),
                        hasScale: !!scale
                    })
                });

                if (this.model.isNew()) {
                    annotationTool.video.get("categories").add(this.model);
                }
                this.model.save(null, { async: false });

                // Fix the affiliation. We do this as a second step
                // because the category needs an ID for this
                var affiliation = this.$el.find("[name='affiliation']:checked").val();
                var seriesCategoryId = this.model.get("series_category_id") || this.model.id;
                var seriesParams = null;
                if (affiliation === "series") {
                    seriesParams = {
                        series_category_id: seriesCategoryId,
                        series_extid: annotationTool.video.get("series_extid")
                    };
                } else {
                    seriesParams = {
                        series_category_id: null,
                        series_extid: null
                    };
                }
                this.model.save(seriesParams);

                _.each(this.removeLabels, function (label) {
                    this.model.get("labels").get(label).destroy();
                }, this);

                this.model.get("labels").each(function (label) {
                    label.save(this.labels.get(label.id).attributes);
                }, this);

                _.each(this.addLabels, function (label) {
                    this.model.get("labels").create(label.attributes);
                }, this);

                this.remove();
            },
            "click input[type='color']": function (event) {
                // Don't open the browsers' built-in color picker;
                // we provide our own.
                event.preventDefault();
            },
            "change input[name='affiliation']": function (event) {
                if (event.target.value === "series") {
                    this.disableScale();
                } else {
                    this.enableScale();
                }
            },
            "change select": function (event) {
                if (event.target.value) {
                    this.disableAffiliation();
                } else {
                    this.enableAffiliation();
                }
            },
            "click #new-label": function () {
                var label = this.labels.push();
                this.addLabels[label.cid] = label;
                this.$el.find("#labels").append(new LabelView({ model: label }).el);
            },
            "click .cancel": "remove"
        },

        initialize: function (options) {
            Modal.prototype.initialize.apply(this, arguments);

            this.model = options.model;

            this.labels = new Labels(
                this.model.get("labels").invoke("clone"),
                { category: this.model }
            );

            this.addLabels = {};
            this.removeLabels = [];

            if (!this.labels.length) {
                var newLabel = this.labels.add({}).at(0);
                this.addLabels[newLabel.cid] = newLabel;
            }

            this.listenTo(this.labels, "remove", function (label) {
                if (label.isNew()) {
                    delete this.addLabels[label.cid];
                } else {
                    this.removeLabels.push(label);
                }
            });

            this.render();
        },

        template: template,

        // TODO Until we update jQuery, we can't use `show` and `hide` here,
        //   since our current jQuery version does not preserve
        //   the `display` property correctly.

        disableAffiliation: function () {
            this.$el.find("input[name='affiliation']").prop("disabled", true);
            this.$el.find("#no-series-affiliation-with-scale").css("display", "");
        },

        enableAffiliation: function () {
            this.$el.find("input[name='affiliation']").prop("disabled", false);
            this.$el.find("#no-series-affiliation-with-scale").hide();
        },

        disableScale: function () {
            this.$el.find("select").prop("disabled", true);
            this.$el.find("#no-scale-on-series-category").css("display", "");
            this.$el.find("#scales-description").hide();
        },

        enableScale: function () {
            this.$el.find("select").prop("disabled", false);
            this.$el.find("#no-scale-on-series-category").hide();
            this.$el.find("#scales-description").css("display", "");
        }
    });

    return CategoryModal;
});
