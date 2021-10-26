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
    "views/modal",
    "views/scale-modal/scale-editor",
    "templates/scale-modal",
    "templates/scale-modal/scale-selector"
], function (
    _,
    $,
    Scale,
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
                return this.model.save(this.scaleEditor.model.attributes)
                    .then(_.bind(function () {
                        return $.when(
                            this.model.get("scaleValues").map(function (scaleValue, index) {
                                return scaleValue.save({ order: index });
                            })
                        );
                    }, this))
                    .then(_.bind(this.remove, this));
            },
            "click #delete": function () {
                this.remove();
                annotationTool.deleteOperation.start(
                    this.model,
                    annotationTool.deleteOperation.targetTypes.SCALE,
                    _.bind(this.remove, this)
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
                this.scaleEditor = new ScaleEditor({ model: this.model.clone() });
                this.body.append(this.scaleEditor.el);
            }
        },

        template: template,
        scaleSelectorTemplate: scaleSelectorTemplate
    });

    return ScaleModal;
});
