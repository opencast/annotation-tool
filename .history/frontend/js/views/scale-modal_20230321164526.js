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
    "jquery",
    "models/scale",
    "collections/scalevalues",
    "views/modal",
    "views/scale-modal/scale-editor",
    "templates/scale-modal",
    "templates/scale-modal/scale-selector"
], function (
    _,
    $,
    Scale,
    ScaleValues,
    Modal,
    ScaleEditor,
    template,
    scaleSelectorTemplate
) {
    "use strict";

    var ScaleModal = Modal.extend({

        events: {
            "click .cancel": "remove",
            "change select": function (event) {
                this.model = annotationTool.video.get("scales").get(event.target.value);

                this.render();
            },
            "submit form": function (event) {
                event.preventDefault();

                if (this.model.isNew()) {
                    annotationTool.video.get("scales").add(this.model);
                }
                var previousScaleValues = this.model.get("scaleValues");
                return this.model.save(this.scaleEditor.model.attributes)
                    .then(_.bind(function () {
                        return $.when.apply(
                            $,
                            this.scaleEditor.model.attributes.scaleValues.map(function (scaleValue, index) {
                                return scaleValue.save({ order: index });
                            }).concat(
                                previousScaleValues.chain()
                                    .filter(function (scaleValue) {
                                        // Empty placeholder value must not trigger HTTP request (would cause error 405)
                                        var isEmptyPlacehoder = !scaleValue.id && !scaleValue.attributes.value;

                                        if (isEmptyPlacehoder) {
                                            // @todo CC | Review: Check if this is really needed
                                            // Safety measure to avoid doing something with the unneeded placeholder
                                            scaleValue.collection.remove(scaleValue);
                                            return false;
                                        }

                                        return !this.model.get("scaleValues").get(scaleValue.id);
                                    }, this)
                                    .invoke("destroy")
                                    .value()
                            )
                        );
                    }, this))
                    .then(_.bind(this.remove, this));
            },
            "click #delete": function () {
                this.hide();
                annotationTool.deleteOperation.start(
                    this.model,
                    annotationTool.deleteOperation.targetTypes.SCALE,
                    _.bind(this.remove, this),
                    _.bind(this.show, this)
                );
            }
        },

        initialize: function (options) {
            Modal.prototype.initialize.apply(this, arguments);

            if (options && options.create) {
                this.model = new Scale({ scaleValues: [{}] }, { parse: true });
            }

            this.render();
        },

        render: function () {
            this.$el.html(this.template({
                create: this.model && this.model.isNew(),
                model: this.model && this.model.toJSON(),
                scales: annotationTool.video.get("scales").toJSON()
            }, {
                partials: {
                    selector: scaleSelectorTemplate
                }
            }));

            this.body = this.$el.find(".modal-body");

            if (this.model) {
                // Roundabout way to clone our scale so that it doesn't refetch the scale values,
                // and also gets a new scale value collection.
                var clone = new Scale(
                    _.chain(this.model.attributes)
                        .omit("id")
                        .extend({ scaleValues: new ScaleValues(
                            this.model.get("scaleValues").invoke("clone"),
                            {
                                scale: this.model
                            }
                        ) })
                        .value()
                );
                this.scaleEditor = new ScaleEditor({
                    model: clone,
                    deletable: !this.model.isNew() });
                this.body.append(this.scaleEditor.el);
            }
        },

        template: template,
        scaleSelectorTemplate: scaleSelectorTemplate
    });

    return ScaleModal;
});
