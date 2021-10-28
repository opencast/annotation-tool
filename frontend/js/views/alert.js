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
        "jquery",
        "underscore",
        "backbone",
        "templates/alert-modal",
        "bootstrap"
    ],
    function (
        $,
        _,
        Backbone,
        AlertTemplate
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-alert
         */
        var Alert = Backbone.View.extend({

            el: $("#alert"),

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
                "click #confirm-alert": "hide"
            },

            /**
             * Constructor
             */
            initialize: function () {
                _.bindAll(this, "show", "hide");
            },

            /**
             * Display the modal with the given message as the given alert type
             * @param  {String} message The message to display
             * @param  {String | Object} type The name of the alert type or the type object itself, see {@link module:views-alert.Alert#TYPES}
             */
            show: function (message, type) {
                var params;

                if (_.isString(type)) {
                    type = Alert.TYPES[type.toUpperCase()];
                }

                if (_.isUndefined(message) || _.isUndefined(type) ||
                    _.isUndefined(type.title)  || _.isUndefined(type.className)) {
                    throw "Alert modal requires a valid type and a message!";
                }

                params = _.extend(type, { message: message });

                this.$el.empty();
                this.$el.append(this.template(params));
                this.delegateEvents();

                this.$el.modal(_.defaults(type.modalOptions || {}, { show: true, backdrop: true, keyboard: false }));
            },

            /**
             * Hide the modal
             */
            hide: function () {
                this.$el.modal("hide");
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
                    className: "alert-error"
                },
                FATAL: {
                    title: "alert.fatal.title",
                    className: "alert-error",
                    hideButtons: true,
                    modalOptions: {
                        backdrop: "static",
                        keyboard: false
                    }
                },
                WARNING: {
                    title: "alert.warning.title",
                    className: ""
                },
                INFO: {
                    title: "alert.info.title",
                    className: "alert-info"
                }
            }
        });

        return Alert;

    }
);
