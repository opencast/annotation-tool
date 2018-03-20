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
 * @requires jQuery
 * @requires underscore
 * @requires ROLES
 * @requires ACCESS
 * @requires backbone
 * @requires models/resource
 * @requires email-addresses
 */
define(["jquery",
        "underscore",
        "roles",
        "access",
        "backbone",
        "models/resource",
        "email-addresses"],

    function ($, _, ROLES, ACCESS, Backbone, Resource, emailAddresses) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-user
         * @alias module:models-user.User
         */
        var User = Resource.extend({

            /**
             * Default models value
             * @alias module:models-user.User#defaults
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
             * @alias module:models-user.User#noPOST
             * @type {boolean}
             */
            noPOST: true,

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-user.User#validate
             * @param {Object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;


                if (!attr.nickname) {
                    return {
                        attribute: "nickname",
                        error: "absent"
                    };
                }

                if (attr.email && !emailAddresses.parseOneAddress(attr.email)) {
                    return {
                        attribute: "email",
                        error: "invalid"
                    };
                }

                return undefined;
            }
        });
        return User;
    }
);
