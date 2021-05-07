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
 */
define(
    [
        "underscore",
        "views/comment",
        "templates/comments-container",
        "backbone"
    ],
    function (
        _,
        CommentView,
        template,
        Backbone
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-comments-container
         */
        var CommentsContainer = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @type {string}
             */
            tagName: "div",

            /**
             * Class name from the view element
             * @type {string}
             */
            className: "comments-container",

            /**
             * View template
             * @type {HandlebarsTemplate}
             */

            /**
             * Events to handle
             * @type {object}
             */
            events: {
                "keyup textarea.create"                    : "handleInsertCancelButtonShortcuts",
                "click button[type=submit].add-comment"    : "insert",
                "click button[type=button].cancel-comment" : "onCancelComment"
            },

            currentState: false,
            template: template,

            /**
             * constructor
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                this.commentViews = [];

                // Bind function to the good context
                _.bindAll(
                    this,
                    "render",
                    "deleteView",
                    "insert",
                    "onCancelComment",
                    "resetViews"
                );

                this.listenTo(this.collection, "remove", this.deleteView);
                this.listenTo(this.collection, "reset", this.resetViews);

                this.currentState = CommentsContainer.STATES.READ;

                this.resetViews();

                return this.render();
            },

            /**
             * Set the state of this view.
             * For possible values, see {@link module:views-comments-container.CommentsContainer.STATES}.
             * @param {String} state The new state
             */
            setState: function (state) {
                this.currentState = state;
                this.render();
                this.trigger(state);
            },

            /**
             * Reset all the views set
             */
            resetViews: function () {
                _.each(this.commentViews, function (commentView, index) {
                    commentView.remove();
                }, this);
                this.commentViews = [];

                _.each(this.collection.toArray(), function (comment) {
                    this.addComment(comment);
                }, this);
            },

            /**
             * Render this view
             */
            render: function () {
                this.$el.html(this.template({
                    comments  : this.collection.models,
                    addState  : this.currentState === CommentsContainer.STATES.ADD
                }));

                this.commentList = this.$("div.comment-list");

                this.commentList.empty();

                _.each(this.commentViews, function (commentView) {
                    this.commentList.append(commentView.render().$el);
                }, this);

                this.delegateEvents(this.events);
                return this;
            },

            /**
             * Remove the given comment from the views list
             * @param {Comment} Comment from which the view has to be deleted
             */
            deleteView: function (delComment) {
                _.find(this.commentViews, function (commentView, index) {
                    if (delComment === commentView.model) {
                        this.commentViews.splice(index, 1);
                        commentView.remove();
                        this.render();
                        return true;
                    }
                    return false;
                }, this);
            },

            /**
             * Handle keyboard shortcuts to control the insert and cancel buttons in the new comment form.
             * @param  {event} event Event object
             */
            handleInsertCancelButtonShortcuts: function (event) {
                if (event.keyCode === 27) {
                    // If escape is pressed, we cancel
                    this.cancel();
                } else if (event.keyCode === 13 && !event.shiftKey) {
                    // If enter is pressed but not shift, we insert a new comment
                    this.insert(event);
                }
            },

            /**
             * Submit a comment to the backend
             * @param  {event} event Event object
             */
            insert: function (event) {
                event.stopImmediatePropagation();

                var textValue = this.$("textarea").val(),
                    commentModel;

                if (textValue === "") {
                    return;
                }

                commentModel = this.collection.create({ text: textValue });

                this.cancel();
                this.addComment(commentModel);
                this.render();
            },

            /**
             * Add a new comment to the container
             * @param {Comment} comment Comment to add
             */
            addComment: function (comment) {
                var commentView = new CommentView({ model: comment });
                this.listenTo(commentView, "edit", function () {
                    this.setState(CommentsContainer.STATES.EDIT);
                    this.trigger("edit");
                    this.render();
                });

                this.commentViews.push(commentView);

                this.$el.parent().find(".comment-amount").text(this.collection.length);

                this.$("textarea").focus();
            },

            /**
             * Listener for the cancel button
             * @param  {event} event Event object
             */
            onCancelComment: function (event) {
                event.stopImmediatePropagation();
                this.cancel();
            },

            /**
             * Cancel the insertion of a comment
             */
            cancel: function () {
                this.$("textarea").val("");
                this.trigger("cancel");
                this.setState(CommentsContainer.STATES.READ);
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             */
            remove: function () {
                _.each(this.commentViews, function (commentView) {
                    commentView.remove();
                });
                Backbone.View.prototype.remove.apply(this, arguments);
            }
        }, {
            /**
             * Possible states for this view
             */
            STATES: {
                READ : "read",
                ADD  : "add",
                EDIT : "edit"
            }
        });
        return CommentsContainer;
    }
);
