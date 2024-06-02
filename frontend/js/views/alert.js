/**
 *  Copyright 2012, Entwine GmbH, Switzerland
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
 * A module representing the alert modal
 * @module views-alert
 */
define(
    [
        "underscore",
        "views/modal",
        "templates/alert-modal"
    ],
    function (
        _,
        Modal,
        AlertTemplate
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-alert
         */
        var Alert = Modal.extend({
            /**
             * Alert template
             * @type {HandlebarsTemplate}
             */
            template: AlertTemplate,

            /**
             * Events to handle
             * @type {object}
             */
            events: {
                "click .confirm-alert": "remove"
            },

            /**
             * Constructor
             * @param {object} attr Object literal containing the view initialization attributes.
             *     Sensible values for this parameter can be found in {@link Alert.TYPES}.
             */
            initialize: function (attr) {
                Modal.prototype.initialize.call(this, attr.modalOptions);
                _.extend(this, _.pick(attr, Alert.ATTRIBUTES));

                this.render();
            },

            /**
             * Draw the modal
             * @return {Alert} this alert modal
             */
            render: function () {
                this.$el.html(this.template(_.pick(this, Alert.ATTRIBUTES)));
            }
        }, {
            /**
             * Supported type of alert. Each of the type is represented as object and must have a title and a class property.
             * @type {PlainObject}
             * @constant
             */
            TYPES: {
                ERROR: {
                    title: "alert.error.title",
                    severity: "alert-error"
                },
                FATAL: {
                    title: "alert.fatal.title",
                    severity: "alert-error",
                    hideButtons: true
                },
                WARNING: {
                    title: "alert.warning.title"
                },
                INFO: {
                    title: "alert.info.title",
                    severity: "alert-info"
                }
            },
            ATTRIBUTES: [
                "title",
                "message",
                "severity",
                "hideButtons"
            ]
        });

        return Alert;

    }
);
