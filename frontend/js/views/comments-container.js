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
 */

/**
 * A module representing the view for a comments container
 * @module views-comments-container
 * @requires jQuery
 * @requires underscore
 * @requires views-comment
 * @requires templates/comments-container.tmpl
 * @requires handlebars
 * @requires backbone
 */
define(["jquery",
        "views/comment",
        "templates/comments-container",
        "handlebars",
        "backbone"],

    function ($, CommentView, Template, Handlebars, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-comments-container
         * @alias module:views-comments-container.CommentsContainer
         */
        var CommentsContainer = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-comments-container.CommentsContainer#tagName
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @alias module:views-comments-container.CommentsContainer#className
             * @type {string}
             */
            className: "comments-container",

            /**
             * View template
             * @alias module:views-comments-container.CommentsContainer#template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Define if the view is or not collapsed
             * @alias module:views-comments-container.CommentsContainer#collapsed
             * @type {boolean}
             */
            collapsed: true, //Todo: Collapse function needs to be completely removed.

            /**
             * Events to handle
             * @alias module:views-comments-container.CommentsContainer#events
             * @type {object}
             */
            events: {
                "click a.add-comment"                      : "onAddComment",
                "keyup textarea.create"                    : "keyupInsertProxy",
                "click button[type=submit].add-comment"    : "insert",
                "click button[type=button].cancel-comment" : "onCancelComment"
            },

            currentState: false,

            /**
             * constructor
             * @alias module:views-comments-container.CommentsContainer#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                if (typeof attr.collapsed !== "undefined") {
                    this.collapsed = attr.collapsed;
                }
                
                this.annotationId        = attr.id;
                this.id                  = "comments-container" + attr.id;
                this.el.id               = this.id;
                this.comments            = attr.comments;
                this.commentViews        = [];
                this.cancelCallback      = attr.cancel;
                this.editCommentCallback = attr.edit;

                // Bind function to the good context
                _.bindAll(this,
                          "render",
                          "deleteView",
                          "onAddComment",
                          "insert",
                          "onCancelComment",
                          "keyupInsertProxy",
                          "resetViews",
                          "toggleAddState");

                // Add backbone events to the model
                _.extend(this.comments, Backbone.Events);

                this.listenTo(this.comments, "destroy", this.deleteView);
                this.listenTo(this.comments, "remove", this.deleteView);
                this.listenTo(this.comments, "reset", this.resetViews);

                this.currentState = CommentsContainer.STATES.READ;

                this.resetViews();

                return this.render();
            },

            setState: function (state) {
                this.currentState = state;
            },

            toggleAddState: function (state) {
                if (!_.isUndefined(state)) {
                    this.currentState = state;
                } else {
                    this.currentState = !this.addState;
                }
            },

            toggleEditState: function (state) {
                if (!_.isUndefined(state)) {
                    this.addState = state;
                } else {
                    this.addState = !this.addState;
                }
            },

            /**
             * Reset all the views set
             * @alias module:views-comments-container.CommentsContainer#resetViews
             */
            resetViews: function () {
                _.each(this.commentViews, function (commentView, index) {
                    this.commentViews.splice(index, 1);
                    commentView.deleteView();
                }, this);

                _.each(this.comments.toArray(), function (comment) {
                    this.addComment(comment);
                }, this);
            },

            /**
             * Render this view
             * @alias module:views-comments-container.CommentsContainer#render
             */
            render: function () {
                this.$el.html(this.template({
                    id        : this.annotationId,
                    comments  : this.comments.models,
                    addState  : this.currentState === CommentsContainer.STATES.ADD
                }));

                this.commentList = this.$el.find("div#comment-list" + this.annotationId);

                this.commentList.empty();

                _.each(this.commentViews, function (commentView) {
                    this.commentList.append(commentView.render().$el);
                }, this);

                this.delegateEvents(this.events);
                return this;
            },

            /**
             * Remove the given comment from the views list
             * @alias module:views-comments-container.CommentsContainer#deleteView
             * @param {Comment} Comment from which the view has to be deleted
             */
            deleteView: function (delComment) {
                _.find(this.commentViews, function (commentView, index) {
                    if (delComment === commentView.model) {
                        this.commentViews.splice(index, 1);
                        commentView.deleteView();
                        this.render();
                        return;
                    }
                }, this);
            },

            /**
             * Sort all the comments in the list by date
             * @alias module:views-comments-container.CommentsContainer#sortViewsByDate
             */
            sortViewsByDate: function () {
                this.commentViews = _.sortBy(this.commentViews, function (commentViews) {
                    return commentViews.model.get("created_at");
                });
                this.render();
            },

            /**
             * Proxy to insert comments by pressing the "return" key
             * @alias module:views-comments-container.CommentsContainer#keyupInsertProxy
             * @param  {event} event Event object
             */
            keyupInsertProxy: function (event) {
                  // If enter is pressed and shit not, we insert a new annotation
                if (event.keyCode === 13 && !event.shiftKey) {
                    this.insert();
                }
            },

            /**
             * Submit a comment to the backend
             * @alias module:views-comments-container.CommentsContainer#insert
             */
            insert: function () {
                var textValue = this.$el.find("textarea").val(),
                    commentModel;

                if (textValue === "") {
                    return;
                }

                commentModel = this.comments.create({text: textValue});

                this.cancel();
                this.addComment(commentModel);
                this.render();
            },

            /**
             * Add a new comment to the container
             * @alias module:views-comments-container.CommentsContainer#addComment
             * @param {Comment} comment Comment to add
             */
            addComment: function (comment) {
                var self = this,
                    commentModel = new CommentView({
                        model: comment,
                        cancel: function () {
                            self.setState(CommentsContainer.STATES.ADD);
                            self.cancelCallback();
                            self.render();
                        },
                        edit: function () {
                            self.setState(CommentsContainer.STATES.EDIT);
                            self.editCommentCallback();
                            self.render();
                        }
                    });

                this.commentViews.push(commentModel);

                this.$el.parent().find(".comment-amount").text(this.comments.length);

                this.$el.find("textarea").focus();
            },

            /**
             * Start the insertion of a new comment, display the textarea for it.
             * @alias module:views-comments-container.CommentsContainer#onAddComment
             * @param  {event} event Event object
             */
            onAddComment: function (event) {
                event.stopImmediatePropagation();
                this.$el.find("textarea").show();
                this.$el.find("button").removeClass("hide");
                this.$el.find("textarea").focus();
            },

            /**
             * Listener for the cancel button
             * @alias module:views-comments-container.CommentsContainer#onCancelComment
             * @param  {event} event Event object
             */
            onCancelComment: function (event) {
                event.stopImmediatePropagation();
                this.cancel();
            },

            /**
             * Cancel the insertion of a comment
             * @alias module:views-comments-container.CommentsContainer#cancel
             */
            cancel: function () {
                this.$el.find("textarea").val("");
                this.cancelCallback();
            }
        }, {
            STATES: {
                READ : "read",
                ADD  : "add-comment",
                EDIT : "edit-comment"
            }
        });
        return CommentsContainer;
    }
);