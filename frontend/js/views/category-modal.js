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

// TODO Escape to close?
// TODO Click outside to close?
//   Only with a warning?

define([
    "underscore",
    "access",
    "models/category",
    "collections/labels",
    "views/modal",
    "views/category-modal/label",
    "templates/category-modal",
    "bootstrap",
    "jquery.colorPicker"
], function (
    _,
    ACCESS,
    Category,
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
                // TODO Should the template get this itself from some global scope somehow?
                scales: annotationTool.video.get("scales").toJSON()
            }));
            // TODO These parameters should probably be factored out ...
            //   and unified ...

            // Enable all the settings before potentially disabling them later
            // The reason being hiding any help-blocks
            this.enableScale();
            this.enableAffiliation();

            // TODO This should be done in the template ...
            var access = ACCESS.render(this.model.get("access"));
            // TODO Is this `attr` call the right thing?!
            //   What about the place about tracks where you copied this from?!
            this.$el.find("[name='access'][value='" + access + "']").attr("checked", true);
            // TODO Same for the affiliation
            var affiliation = this.model.get("series_category_id") ? "series" : "event";
            this.$el.find("[name='affiliation'][value='" + affiliation + "']").attr("checked", true);

            if (affiliation === "series") {
                this.disableScale();
            }

            if (this.model.get("scale_id")) {
                this.$el.find("option[value='" + this.model.get("scale_id") + "']").attr("selected", true);
                this.disableAffiliation();
            }

            // TODO Initialize the picker!
            this.$el.find("input[type='color']").colorPicker();

            var labelsTable = this.$el.find("#labels");
            this.labels.each(function (label) {
                labelsTable.append(new LabelView({ model: label }).el);
            });

            this.$el.modal({ show: true, backdrop: "static", keyboard: false });
            console.log("A change")
            return this;
        },

        events: {
            // TODO Actually name these? Navigating them is a bitch already.

            "submit form": function (event) {
                event.preventDefault();

                // TODO Waiting? Error handling?

                var scale = this.$el.find("select").val();
                var access = ACCESS.parse(this.$el.find("[name='access']:checked").val());
                this.model.set({
                    access: access,
                    name: this.$el.find("#name").val(),
                    scale_id: scale,
                    settings: _.extend({}, this.model.get("settings"), {
                        color: this.$el.find("input[type='color']").val(),
                        hasScale: !!scale,
                        // TODO I hate that this is here
                        //   Maybe this can stay in `annotate-tab` for now ...
                        //   since the button will eventually be there
                        //createdAsMine: access !== ACCESS.PUBLIC
                    }),
                });

                // TODO Can we not call `save` directly?
                //   Then we need to add first,
                //   and remove later in case of errors

                // TODO Is there no easier way to do these two steps?
                //   Can we just `create`? Well, we could steal the `attributes`, I guess.
                // TODO Should we assume that we need to add only because it's a new category?
                //   Maybe check if it already has a collection?
                // TODO This check needs to come before `save`!
                // TODO The thing needs to be removed again, if something fails!
                //   Which it shouldn't, though, because we validate, right?!
                // TODO We don't need this check, we can just always add
                //   But we only need to remove new ones if something goes wrong, though!
                // TODO Skip validation?
                if (this.model.isNew()) {
                    annotationTool.video.get("categories").add(this.model);
                }
                this.model.save(null, { async: false });

                // TODO It sucks that there is no way to create a new series category from scratch
                // Fix the affiliation. We do this as a second step
                // because the category needs an ID for this
                var affiliation = this.$el.find("[name='affiliation']:checked").val();
                var seriesCategoryId = this.model.get("series_category_id") || this.model.id;
                // TODO Async?
                this.model.save({
                    // TODO Is this even right, generally? Shouldn't setting the series ID be enough?
                    //   It should be set automatically ...
                    //   Also, what about the matching stuff?
                    series_category_id: affiliation === "series" ? seriesCategoryId : "",
                    // TODO This attribute does not belong here
                    //   Together with the above, we basically just want to specify the affiliation
                    //   (series vs. event) in the category, right?!
                    //   Or we reify series and let categories refer to either?
                    //   Because why would a series category refer to a specific video, still?
                    // TODO Duplication of the conditional
                    series_extid: affiliation === "series" ? annotationTool.video.get("series_extid") : ""
                });

                // TODO Do the following async as well? What if they fail?

                _.each(this.removeLabels, function (label) {
                    this.model.get("labels").get(label).destroy();
                }, this);

                this.model.get("labels").each(function (label) {
                    label.save(this.labels.get(label.id).attributes);
                }, this);

                _.each(this.addLabels, function (label) {
                    // TODO Is another clone really necessary here?
                    //   And is this the way to do it in general?
                    //   We could also just add it and `save`?
                    this.model.get("labels").create(label.attributes);
                }, this);

                this.remove();
            },
            "click input[type='color']": function (event) {
                event.preventDefault();
            },
            "change input[name='affiliation']": function (event) {
                // TODO Actually change back the selection?
                // TODO Do this on the initial render as well
                //   or in the template?
                if (event.target.value === "series") {
                    this.disableScale();
                    // TODO Show message
                    // TODO Ignore disabled thigns
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
                // TODO Why even add it here? It's not like we rerender the thing, right?
                //   But we need to add it so that we notice when it's removed!
                var label = this.labels.push();
                this.addLabels[label.cid] = label;
                this.$el.find("#labels").append(new LabelView({ model: label }).el);
            },
            "click .cancel": "remove"
        },

        initialize: function (options) {
            Modal.prototype.initialize.apply(this, arguments);
            // TODO Should we allow passing a hash of attributes?!
            this.model = (options || {}).model || new Category({
                // TODO This needs to be done differently and maybe not here?
                settings: { color: "#008080" }
            });

            // TODO This sucks!
            this.labels = new Labels(
                this.model.get("labels").map(
                    function (label) { return label.clone(); }
                ),
                { category: this.model }
            );

            this.addLabels = {};
            this.removeLabels = [];
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

        disableAffiliation: function () {
          this.$el.find("input[name='affiliation']").prop("disabled", true);
          this.$el.find("#no-series-affiliation-with-scale").show();
        },

        enableAffiliation: function () {
          this.$el.find("input[name='affiliation']").prop("disabled", false);
          this.$el.find("#no-series-affiliation-with-scale").hide();
        },

        disableScale: function () {
          this.$el.find("select").prop("disabled", true);
          this.$el.find("#no-scale-on-series-category").show();
          this.$el.find("#scales-description").hide();
        },

        enableScale: function () {
          this.$el.find("select").prop("disabled", false);
          this.$el.find("#no-scale-on-series-category").hide();
          this.$el.find("#scales-description").show();
        }
    });

    return CategoryModal;
});
