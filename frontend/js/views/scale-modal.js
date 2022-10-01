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
                console.warn("ScaleModal : change select");

                this.model = annotationTool.video.get("scales").get(event.target.value);
                console.log(this.model);

                this.render();
            },
            "submit form": function (event) {
                console.warn("ScaleModal : submit form");

                event.preventDefault();

                if (this.model.isNew()) {
                    annotationTool.video.get("scales").add(this.model);
                }
                // Wahrscheinlich hier schon Unterschied: Warum ist es befüllt, und womit?
                // Todo: Check if scaleValues is filled anytime. Check model.
                var previousScaleValues = this.model.get("scaleValues");

                console.warn("ScaleModal : submit form - previousScaleValues");
                console.log(previousScaleValues);

                console.warn("ScaleModal : submit form - NOW: save …");
                console.log(this.scaleEditor.model.attributes);
                console.log(this.scaleEditor.model.toJSON());
                console.log(this.scaleEditor.model.isNew());
                console.log(this.model.isNew());

                return this.model
                    .save(this.scaleEditor.model.attributes, {
                        // Todo: This might be bad for scale but good for scalevalues (???)
                        // Todo: This might be bad for scale but good for scalevalues (???)
                        // __XXX__: 0,
                        // parse: false,
                        /* * /
                        success: (model, resp, options) => {
                            // Todo: Unsure if this is useful, here 'scaleValues' are already empty again
                            console.warn(
                                "ScaleModal : submit form / model.save - success"
                            );
                            console.log([model.cid, model.id]);
                            console.log(model.attributes);
                            console.log(model);
                            console.log(resp);
                            console.log(options);
                            console.log(">>> ---");
                            console.log(this);
                            console.log([this.model.cid, this.model.id]);
                            console.log(this.model.attributes);
                            console.log(this.model.previousAttributes());
                            console.log(this.model.previous("scaleValues"));
                            console.log(this.model.get("scaleValues"));
                            console.log("---");
                            console.log([
                                this.scaleEditor.model.cid,
                                this.scaleEditor.id,
                            ]);
                            console.log(this.scaleEditor.model.attributes);
                            console.log(
                                this.scaleEditor.model.previousAttributes()
                            );
                            console.log(
                                this.scaleEditor.model.previous("scaleValues")
                            );
                            console.log(
                                this.scaleEditor.model.get("scaleValues")
                            );
                            console.log(this.scaleEditor.model.toJSON());
                            console.log(this.scaleEditor.model.isNew());
                            console.log("--- <<<");
                        },
                        /* */
                    })
                    .then(
                        _.bind(function () {
                            console.warn(
                                "ScaleModal : submit form / model.save .then .bind"
                            );
                            console.log(this.model.get("scaleValues"));

                            return $.when.apply(
                                $,
                                // Once arriving here 'this.model.get("scaleValues")' is magically empty again
                                // - Despite previous debugs can show that it contains values.
                                // Das funktioniert schon nicht mehr (scalevalue save)
                                // Entweder keine Daten (?) oder sonst ein Fehler?
                                this.model
                                    .get("scaleValues")
                                    .map(function (scaleValue, index) {
                                        console.warn(
                                            "ScaleModal : submit form / $.when.apply"
                                        );
                                        console.log(scaleValue, index);
                                        return scaleValue.save({
                                            order: index,
                                        });
                                    })
                                    .concat(
                                        // previousScaleValues = []
                                        // - Filter lässt vermutlich alles durch, da nichts da ist
                                        // Empty array und invoke(destroy) = Failure?
                                        // Warum dann überhaupt aufrufen, wenn es kein Previous geben sollte?
                                        // Todo: This request must be understood + fixed, as modal won't close without it
                                        previousScaleValues
                                            .chain()
                                            .filter(function (scaleValue) {
                                                return !this.model
                                                    .get("scaleValues")
                                                    .get(scaleValue.id);
                                            }, this)
                                            //.tap((sv) => {
                                            //    console.log(
                                            //        "previousScaleValues",
                                            //        sv
                                            //    );
                                            //})
                                            .invoke("destroy")
                                            .value()
                                    )
                            );
                        }, this)
                    )
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
                // Todo: Why array with object? In 'scale' the default is just the array
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
                // Todo: Check if that maybe breaks the scale / scalevalue data ???
                // Todo: Check if that maybe breaks the scale / scalevalue data ???
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
