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
    "views/alert"
], function (
    AlertView
) { "use strict";

var alertModal = new AlertView();

/**
 * Handy functions to show alerts.
 * @exports alerts
 */
var alerts = {
    /**
     * Display an alert modal
     * @param {String} message The message to display
     */
    error: function (message) {
        alertModal.show(message, AlertView.TYPES.ERROR);
    },

    /**
     * Display a fatal error.
     * In addition to what {@link alertError} does, this also disables user interaction.
     * It effectively "crashes" the application with a (hopefully useful) error message.
     * @param {String} message The error message to display
     */
    fatal: function (message) {
        alertModal.show(message, AlertView.TYPES.FATAL);
    },

    /**
     * Display an warning modal
     * @param {String} message The message to display
     */
    warning: function (message) {
        alertModal.show(message, AlertView.TYPES.WARNING);
    },

    /**
     * Display an information modal
     * @param {String} message The message to display
     */
    info: function (message) {
        alertModal.show(message, AlertView.TYPES.INFO);
    }
};

return alerts;

});
