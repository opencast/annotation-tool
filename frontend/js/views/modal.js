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
    "backbone"
], function (
    _,
    Backbone
) {
    "use strict";

    var Modal = Backbone.View.extend({

        className: "modal",

        attributes: {
            tabindex: -1
        },

        show: function (options) {
            this.$el.modal(
                _.chain(this.modalOptions)
                    .extend(options)
                    .extend({ show: true })
                    .value()
            );
        },

        hide: function () {
            this.$el.modal("hide");
        },

        initialize: function (options) {
            _.chain(this.modalOptions)
                .defaults({
                    // By default, the modal should not be closable implicitly,
                    // so that the client is forced to take care of any cleanup logic.
                    // Additionally, we are truly modal by default,
                    // i.e. the user can't muck about with the state of the app
                    // outside of the dialog.
                    backdrop: "static",
                    keyboard: false
                })
                .extend(options);
        },

        remove: function () {
            this.hide();
        }
    });

    return Modal;
});
