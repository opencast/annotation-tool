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
 *
 */

/**
 * A module containing the ACCESS values enum.
 * @module ACCESS
 */
define([
    "underscore"
], function (
    _
) {

    "use strict";

    /**
     * Enum for access to ressource
     *
     * @readonly
     * @enum {number}
     */
    return {
        PRIVATE: 0,
        PUBLIC: 1,
        SHARED_WITH_ADMIN: 2,
        SHARED_WITH_EVERYONE: 3,

        /**
         * @param {string} specifier an access specifier
         *     <code>kebab-case</code>
         * @return {number} the numerical constant
         *     representing that access specifier
         */
        parse: function (specifier) {
            return this[specifier.replace(/-/g, "_").toUpperCase()];
        },

        /**
         * @param {number} access a numerical access identifier
         * @return {string} a string representation of that identifier
         *     for use in the UI
         */
        render: function (access) {
            return _.findKey(this, function (value) {
                return value === access;
            }).replace(/_/g, "-").toLowerCase();
        }
    };
});
