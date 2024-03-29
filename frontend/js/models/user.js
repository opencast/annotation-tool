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
 * A module representing the user model
 * @module models-user
 */
define(
    [
        "access",
        "roles",
        "models/resource"
    ],
    function (
        ACCESS,
        ROLES,
        Resource
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-user
         */
        var User = Resource.extend({
            /**
             * Default models value
             * @type {map}
             * @static
             */
            defaults: {
                access: ACCESS.PUBLIC,
                isAdmin: false
            },

            /**
             * REST endpont for this model
             * @type {string}
             */
            urlRoot: "/users",

            /**
             * Define that all post operation have to been done through PUT method
             * @type {boolean}
             */
            noPOST: true,

            /**
             * @return {boolean} Whether or not this user has the given role
             * @param {string} role A valid role name. See {@link module:ROLES}.
             */
            hasRole: function (role) {
                return role === ROLES.USER || this.get("isAdmin");
            }
        });
        return User;
    }
);
