/**
 *  Copyright 2018, ELAN e.V., Germany
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
    "views/alert"
], function (
    _,
    AlertModal
) { "use strict";

/**
 * Handy functions to show alerts.
 * @exports alerts
 */
var alerts = {
    /**
     * Display an alert modal
     * @param {string} message The message to display
     */
    error: function (message) {
        new AlertModal(_.extend({}, AlertModal.TYPES.ERROR, { message: message })).show(message);
    },

    /**
     * Display a fatal error.
     * In addition to what {@link alertError} does, this also disables user interaction.
     * It effectively "crashes" the application with a (hopefully useful) error message.
     * @param {string} message The error message to display
     */
    fatal: function (message) {
        new AlertModal(_.extend({}, AlertModal.TYPES.FATAL, { message: message })).show(message);
    },

    /**
     * Display an warning modal
     * @param {string} message The message to display
     */
    warning: function (message) {
        new AlertModal(_.extend({}, AlertModal.TYPES.WARNING, { message: message })).show(message);
    },

    /**
     * Display an information modal
     * @param {string} message The message to display
     */
    info: function (message) {
        new AlertModal(_.extend({}, AlertModal.TYPES.INFO, { message: message })).show(message);
    }
};

return alerts;

});
