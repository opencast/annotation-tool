/**
 * A module representing the login modal
 * @module views-login
 * @requires jQuery
 * @requires backbone
 * @requires i18next
 * @requires models-user
 * @requires collections-users
 * @requires templates/user-login.tmpl
 * @requires ROLES
 * @requires handlebars
 */
define(["jquery",
        "backbone",
        "i18next",
        "models/user",
        "collections/users",
        "templates/user-login",
        "roles",
        "handlebars",
        "handlebarsHelpers"],
    function ($, Backbone, i18next, User, Users, LoginTemplate, ROLES) {

            "use strict";

            /**
             * @constructor
             * @see {@link http://www.backbonejs.org/#View}
             * @augments module:Backbone.View
             * @memberOf module:views-login
             * @alias module:views-login.Login
             */
            var loginView = Backbone.View.extend({

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

                    _.bindAll(this, "loginOnInsert", "login", "reset", "show", "hide");

                    _.extend(this, Backbone.Events);

                    this.$el.append(this.loginTemplate({localStorage: annotationsTool.localStorage}));
                    this.$el.modal({show: true, backdrop: true, keyboard: false });
                    this.$el.modal("hide");
                    this.$el.on("hide", function () {
                        // If user not set, display the login window again
                        if (_.isUndefined(annotationsTool.user)) {
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
                    userNickname.val(options.nickname);
                    userEmail.val(options.email);
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
                        userId          = annotationsTool.getUserExtId(userEmail.val()),
                        userRemember    = this.$el.find("#remember"),
                        userError       = this.$el.find(".alert"),
                        user; // the new user

                    userError.find("#content").empty();
                    try {
                        user = annotationsTool.login(
                            {
                                user_extid: userId,
                                nickname: userNickname.val(),
                                email: userEmail.val(),
                                role: annotationsTool.localStorage && (
                                    this.$el.find("#supervisor")[0].checked ? ROLES.SUPERVISOR : ROLES.USER
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
                        annotationsTool.users.add(user);
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
                },

                /**
                 * Reset the view
                 * @alias module:views-login.Login#reset
                 */
                reset: function () {
                    this.$el.find("#nickname")[0].value = "";
                    this.$el.find("#email")[0].value = "";
                    this.$el.find("#remember")[0].value = "";
                    //this.$el.modal("toggle");
                }

            });
            return loginView;
        }
);