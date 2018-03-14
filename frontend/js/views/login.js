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
 *
 */

/**
 * A module representing the login modal.
 * Note that this is currently only used in the local configurations.
 * @module views-login
 * @requires jquery
 * @requires underscore
 * @requires backbone
 * @requires i18next
 * @requires templates/user-login.tmpl
 * @requires ROLES
 * @requires handlebars
 */
define([
    "jquery",
    "underscore",
    "backbone",
    "models/user",
    "i18next",
    "templates/user-login",
    "roles",
    "handlebars",
    "handlebarsHelpers"
], function (
    $,
    _,
    Backbone,
    User,
    i18next,
    LoginTemplate,
    ROLES
) { "use strict";

/**
 * @constructor
 * @see {@link http://www.backbonejs.org/#View}
 * @augments module:Backbone.View
 * @memberOf module:views-login
 * @alias module:views-login.Login
 */
var LoginView = Backbone.View.extend({

    /**
     * Main container of the login modal
     * @alias module:views-login.Login#el
     * @type {DOMElement}
     */
    el: $("#user-login"),

    /**
     * Login modal template
     * @alias module:views-login.Login#groupTemplate
     * @type {HandlebarsTemplate}
     */
    loginTemplate: LoginTemplate,

    /**
     * Events to handle
     * @alias module:views-login.Login#events
     * @type {object}
     */
    events: {
        "click #save-user": "login",
        "keydown": "loginOnInsert"
    },

    /**
     * Constructor
     * @alias module:views-login.Login#initialize
     */
    initialize: function () {
        this.$el.append(this.loginTemplate());
        this.$el.modal({ show: true, backdrop: "static", keyboard: false });
    },

    /**
     * Show the login modal
     * @alias module:views-login.Login#show
     */
    show: function (options) {
        this.$el.modal("show");
    },

    /**
     * Hide the login modal
     * @alias module:views-login.Login#hide
     */
    hide: function () {
        this.$el.modal("hide");
    },

    /**
     * Login by pressing "Enter" key
     * @alias module:views-login.Login#loginOnInsert
     */
    loginOnInsert: function (e) {
        if (e.keyCode === 13) {
            this.login();
        }
    },

    /**
     * Validate the given credentials and potentially signal the corresponding user's login
     * @alias module:views-login.Login#login
     */
    login: function () {

        // Fields from the login form
        var userNickname = this.$el.find("#nickname").val(),
            userEmail = this.$el.find("#email").val(),
            userRemember = this.$el.find("#remember").prop("checked"),
            userSupervisor = this.$el.find("#supervisor").prop("checked"),
            alert = this.$el.find(".alert"),
            userError = alert.find("#content"),
            validationErrors = false;

        // Remove potential previous validation errors
        this.$el.find(".error").removeClass("error");
        alert.hide();
        userError.empty();

        var user = new User();
        user.set({
            id: userNickname,
            user_extid: userNickname,
            nickname: userNickname,
            email: userEmail,
            role: userSupervisor ? ROLES.ADMINISTRATOR : ROLES.USER
        }, {
            error: _.bind(function (user, error) {
                this.$el.find("#" + error.attribute).parentsUntil("form").addClass("error");
                userError.append(i18next.t(
                    "login error." + error.attribute + "." + error.error
                ));
                alert.show();
                validationErrors = true;
            }, this)
        });

        if (validationErrors) return;

        this.trigger(LoginView.EVENTS.LOGIN, user, userRemember);
    }
}, {
    EVENTS: {
        LOGIN: "login"
    }
});

return LoginView;

});
