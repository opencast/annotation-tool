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
 * A module representing the login modal
 * @module views-login
 * @requires jquery
 * @requires underscore
 * @requires backbone
 * @requires i18next
 * @requires models-user
 * @requires collections-users
 * @requires templates/user-login.tmpl
 * @requires ROLES
 * @requires handlebars
 */
define([
    "jquery",
    "underscore",
    "backbone",
    "i18next",
    "models/user",
    "collections/users",
    "templates/user-login",
    "roles",
    "handlebars",
    "handlebarsHelpers"
], function (
    $,
    _,
    Backbone,
    i18next,
    User,
    Users,
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
        this.$el.append(this.loginTemplate({ localStorage: annotationTool.localStorage }));
        this.$el.modal({show: true, backdrop: true, keyboard: false });
        this.$el.modal("hide");
        this.$el.on("hide", function () {
            // If user not set, display the login window again
            if (_.isUndefined(annotationTool.user)) {
                setTimeout(function () {$("#user-login").modal("show"); }, 5);
            }
        });
    },

    /**
     * Show the login modal
     * @alias module:views-login.Login#show
     * @param {Object} options The options to prefill the form with
     */
    show: function (options) {
        var userNickname    = this.$el.find("#nickname");
        var userEmail       = this.$el.find("#email");
        if (options) {
            userNickname.val(options.nickname);
            userEmail.val(options.email);
        }
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
     * Log the current user of the tool in
     * @alias module:views-login.Login#login
     * @return {User} the current user
     */
    login: function () {
        // Fields from the login form
        var userNickname    = this.$el.find("#nickname"),
            userEmail       = this.$el.find("#email"),
            userId          = annotationTool.getUserExtId(userEmail.val()),
            userRemember    = this.$el.find("#remember"),
            userError       = this.$el.find(".alert"),
            user; // the new user

        userError.find("#content").empty();
        try {
            user = annotationTool.login(
                {
                    user_extid: userId,
                    nickname: userNickname.val(),
                    email: userEmail.val(),
                    role: annotationTool.localStorage && (
                        this.$el.find("#supervisor")[0].checked ? ROLES.ADMINISTRATOR : ROLES.USER
                    )
                },
                {
                    error: $.proxy(function (model, error) {
                        this.$el.find("#" + error.attribute).parentsUntil("form").addClass("error");
                        userError.find("#content").append(i18next.t("login.error", { error: error.message }) + "<br/>");
                    }, this)
                }
            );
        } catch (error) {
            userError.find("#content").append(i18next.t("login.error", { error: error }) + "<br/>");
            this.$el.find(".alert").show();
            return undefined;
        }

        // If we have to remember the user
        if (userRemember.is(":checked")) {
            annotationTool.users.add(user);
            Backbone.localSync("create", user, {
                success: function () {
                    console.log("current user saved locally");
                },
                error: function (error) {
                    console.warn(error);
                }
            });
        }

        this.$el.modal("toggle");

        return user;
    }
});

return LoginView;

});
