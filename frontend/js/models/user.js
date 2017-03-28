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
 * @requires ROLES
 * @requires ACCESS
 * @requires backbone
 */
define(["jquery",
        "roles",
        "access",
        "backbone",
        "email-addresses"],

    function ($, ROLES, ACCESS, Backbone, emailAddresses) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-user
         * @alias module:models-user.User
         */
        var User = Backbone.Model.extend({

            /**
             * Default models value
             * @alias module:models-scalevalue.Scalevalue#defaults
             * @type {map}
             * @static
             */
            defaults: {
                role: ROLES.USER,
                access: ACCESS.PUBLIC
            },

            /**
             * Constructor
             * @alias module:models-user.User#initialize
             * @param {Object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                if (_.isUndefined(attr.user_extid) || attr.user_extid === "" ||
                   _.isUndefined(attr.nickname) || attr.nickname === "") {
                    throw "'user_extid' and 'nickname' attributes are required";
                }

                // Check if the category has been initialized
                if (!attr.id) {
                    // If local storage, we set the cid as id
                    if (window.annotationsTool.localStorage) {
                        attr.id = attr.user_extid;
                    }
                    this.toCreate = true;
                }

                if (!attr.role && annotationsTool.getUserRole) {
                    attr.role = annotationsTool.getUserRole();

                    if (!attr.role) {
                        delete attr.role;
                    }
                }

                this.set(attr);

                // Define that all post operation have to been done through PUT method
                // see in wiki
                this.noPOST = true;
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-user.User#parse
             * @param  {Object} data Object literal containing the model attribute to parse.
             * @return {Object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at !== null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at !== null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at !== null ? Date.parse(attr.deleted_at): null;

                if (data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-user.User#validate
             * @param  {Object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var tmpCreated;

                if (attr.id) {
                    if (this.get("id") !== attr.id) {
                        this.id = attr.id;
                    }
                }

                if (_.isUndefined(attr.user_extid) || (!_.isString(attr.user_extid) && !_.isNumber(attr.user_extid))) {
                    return {attribute: "user_extid", message: "'user_extid' must be a valid string or number."};
                }

                if (_.isUndefined(attr.nickname) || !_.isString(attr.nickname)) {
                    return {attribute: "nickname", message: "'nickname' must be a valid string!"};
                }

                if (attr.email && !User.validateEmail(attr.email)) {
                    return {attribute: "email", message: "Given email is not valid!"};
                }

                if (attr.created_by && !(_.isNumber(attr.created_by) || attr.created_by instanceof User)) {
                    return "'created_by' attribute must be a number or an instance of 'User'";
                }

                if (attr.updated_by && !(_.isNumber(attr.updated_by) || attr.updated_by instanceof User)) {
                    return "'updated_by' attribute must be a number or an instance of 'User'";
                }

                if (attr.deleted_by && !(_.isNumber(attr.deleted_by) || attr.deleted_by instanceof User)) {
                    return "'deleted_by' attribute must be a number or an instance of 'User'";
                }

                if (attr.created_at) {
                    if ((tmpCreated = this.get("created_at")) && tmpCreated !== attr.created_at) {
                        return "'created_at' attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "'created_at' attribute must be a number!";
                    }
                }

                if (attr.updated_at) {
                    if (!_.isNumber(attr.updated_at)) {
                        return "'updated_at' attribute must be a number!";
                    }
                }

                if (attr.deleted_at) {
                    if (!_.isNumber(attr.deleted_at)) {
                        return "'deleted_at' attribute must be a number!";
                    }
                }
            }
        },
        // Class properties and functions
        {
            /**
             * Check if the email address has a valid structure
             * @static
             * @alias module:models-user.User.validateEmail
             * @param {String} email the email address to check
             * @return {Boolean} true if the address is valid
             */
            validateEmail: function (email) {
                return !!emailAddresses.parseOneAddress(email);
            }
        }
    );
        return User;
    }
);