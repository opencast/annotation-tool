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
define(["templates/modal-container", "backbone", "bootstrap"], function(template, Backbone) {
    "use strict";

    return Backbone.View.extend({
        /**
         * Events to handle
         * @alias module:views-modal-container.ModalContainer#events
         * @type {object}
         */
        events: { "click .btn-primary": "onClick" },
        /**
         * Constructor
         * @alias module:views-modal-container.ModalContainer#initialize
         */
        initialize: function(options) {
            console.warn("modal-container / initialize");

            this.buttonText = options.buttonText;
            this.contentView = options.contentView;
            this.header = options.header;

            this.listenTo(this.contentView, "modal:request-close", this.close);

            // auto-render into #dialogs
            Backbone.$("#dialogs").append(this.render().$el);
            this.$(".modal").modal({ show: true, backdrop: true, keyboard: true });
        },
        /**
         * Destructor
         * @alias module:views-modal-container.ModalContainer#remove
         */
        remove: function() {
            console.warn("modal-container / remove");

            this.contentView.remove();
            Backbone.View.prototype.remove.apply(this, arguments);
        },

        /**
         * Render this view
         * @alias module:views-modal-container.ModalContainer#render
         */
        render: function() {
            this.$el.html(template({ cid: this.cid, buttonText: this.buttonText, header: this.header }));
            this.$(".modal-body").append(this.contentView.render().$el);

            return this;
        },

        /**
         * Listener for a close event out of this container
         * @alias module:views-modal-container.ModalContainer#close
         */
        close: function() {
            console.warn("modal-container / close");

            this.$(".modal").modal("hide");
            this.remove();
        },

        /**
         * Listener for a click on the submit button of this modal.
         * @alias module:views-modal-container.ModalContainer#onClick
         */
        onClick: function(event) {
            console.warn("modal-container / onClick");

            this.contentView.trigger("modal:click", event);
        }
    });
});
