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
define(["templates/modal-add-free-text", "backbone"], function (template, Backbone) {
    "use strict";

    return Backbone.View.extend({
        /**
         * Constructor
         * @alias module:views-modal-add-free-text.ModalAddFreeText#initialize
         */
        initialize: function () {
            this.error = false;
            this.listenTo(this, "modal:click", this.addContent);
        },
        /**
         * Render this view
         * @alias module:views-modal-add-free-text.ModalAddFreeText#render
         */
        render: function () {
            this.$el.html(template({ cid: this.cid, error: this.error }));
            return this;
        },
        /**
         * Listener for click on this modal's submit button
         * @alias module:views-modal-add-free-text.ModalAddFreeText#addContent
         */
        addContent: function (event) {
            this.error = false;
            var value = this.$("textarea").val();
            if (value.length) {
                this.model.addContent({ type: "text", title: null, value: value });
                this.trigger("modal:request-close");
            } else {
                this.error = true;
                this.render();
            }
        }
    });
});
