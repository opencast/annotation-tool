/**
 * A module representing the login modal
 * @module views-login
 * @requires jQuery
 * @requires backbone
 * @requires models-user
 * @requires collections-users
 * @requires templates/user-login.tmpl
 * @requires ROLES
 * @requires handlebars
 */
define(["jquery",
        "backbone",
        "models/user",
        "collections/users",
        "text!templates/user-login.tmpl",
        "roles",
        "handlebars"],
        function ($, Backbone, User, Users, LoginTmpl, ROLES, Handlebars) {

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
                 * @type {DOM Element}
                 */
                el: $("#user-login"),

                /**
                 * Login modal template
                 * @alias module:views-login.Login#groupTemplate
                 * @type {Handlebars template}
                 */
                loginTemplate: Handlebars.compile(LoginTmpl),

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
                 */
                show: function () {
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
                    var userId          = annotationsTool.getUserExtId(),
                        userNickname    = this.$el.find("#nickname"),
                        userEmail       = this.$el.find("#email"),
                        userRemember    = this.$el.find("#remember"),
                        userError       = this.$el.find(".alert"),
                        valid  = true, // Variable to keep the form status in memory
                        user; // the new user

                    userError.find("#content").empty();
                    // Try to create a new user
                    try {

                        if (annotationsTool.localStorage) {
                            user = annotationsTool.users.create({user_extid: userId,
                                                              nickname: userNickname.val(),
                                                              role: this.$el.find("#supervisor")[0].checked ? ROLES.SUPERVISOR : ROLES.USER},
                                                              {wait: true});
                        } else {
                            user = annotationsTool.users.create({user_extid: userId, nickname: userNickname.val()}, {wait: true});
                        }
                        // Bind the error user to a function to display the errors
                        user.bind("error", $.proxy(function (model, error) {
                            this.$el.find("#" + error.attribute).parentsUntil("form").addClass("error");
                            userError.find("#content").append(error.message + "<br/>");
                            valid = false;
                        }, this));

                    } catch (error) {
                        valid = false;
                        userError.find("#content").append(error + "<br/>");
                    }

                    // If email is given, we set it to the user
                    if (user && userEmail.val()) {
                        user.set({email: userEmail.val()});
                    }

                    // If user not valid
                    if (!valid) {
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

                    user.save();
                    annotationsTool.user = user;
                    this.$el.modal("toggle");
                    annotationsTool.users.trigger("login");
                    annotationsTool.trigger(annotationsTool.EVENTS.USER_LOGGED);
                    
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