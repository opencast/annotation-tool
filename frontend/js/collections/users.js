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
 * A module representing a users collection
 * @module collections-users
 * @requires jQuery
 * @requires models-user
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/user",
        "backbone",
        "localstorage"],

       function ($, User, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-users
         * @alias module:collections-users.User
         */
        var Users = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-users.User#initialize
             */
            model: User,

            /**
             * Localstorage container for the collection
             * @alias module:collections-users.User#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Users"),

            /**
             * constructor
             * @alias module:collections-users.User#initialize
             */
            initialize: function () {
                this.url = window.annotationTool.restEndpointsUrl + "/users";
            },

            /**
             * Parse the given data
             * @alias module:collections-users.User#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the users
             */
            parse: function (resp) {
                return resp.users;
            }
        });

        return Users;
    }
);
