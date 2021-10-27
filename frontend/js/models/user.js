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
        "roles",
        "access",
        "models/resource"
    ],
    function (
        ROLES,
        ACCESS,
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
                role: ROLES.USER,
                access: ACCESS.PUBLIC
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
             * @return {boolean} Whether or not this user is an admin
             */
            isAdmin: function () {
                return this.get("role") === ROLES.ADMINISTRATOR;
            }
        });
        return User;
    }
);
