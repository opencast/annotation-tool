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
 * A module representing the view for a comments container
 * @module views-comment
 */
define(
    [
        "underscore",
        "util",
        "templates/comment",
        "backbone",
        "views/comments-container"
    ],
    function (
        _,
        util,
        template,
        Backbone,
        CommentsContainer
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-comment
         */
        var CommentView = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @type {string}
             */
            tagName: "div",

            /**
             * View template for read-only modus
             * @type {HandlebarsTemplate}
             */
            template: template,

            /**
             * Events to handle
             * @type {object}
             */
            events: {
                "click": util.stopPropagation,
                "click i.delete-comment": "onDeleteComment",
                "dblclick span.comment": "onEditComment",
                "click i.edit-comment": "onEditComment",
                "click i.add-reply": "onAddReply",
                "keyup textarea": "keyupInsertProxy",
                "click button[type=submit]": "onSubmit",
                "click button[type=button]": "onCancel"
            },

            /**
             * constructor
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                this.commentId      = attr.model.get("id");
                this.id             = "comment" + this.commentId;
                this.el.id          = this.id;

                // Bind function to the good context
                _.bindAll(
                    this,
                    "cancel",
                    "onDeleteComment",
                    "onEditComment",
                    "onSubmit",
                    "onCancel",
                    "render"
                );

                this.isEditEnable = !!attr.isEditEnable;

                // Type use for delete operation
                this.typeForDelete = annotationTool.deleteOperation.targetTypes.COMMENT;

                // Fix up circular dependency
                if (!CommentsContainer) CommentsContainer = require("views/comments-container");

                this.replyContainer = new CommentsContainer({ collection: this.model.replies });

                this.listenTo(this.model, "reply", this.render);

                return this;
            },

            /**
             * Delete the comment related to this view
             */
            onDeleteComment: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                annotationTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Switch in edit modus
             */
            onEditComment: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                this.trigger("edit");
                this.isEditEnable = true;
                this.render();
            },

            /**
             * Allow the user to enter a new reply to this views comment
             */
            onAddReply: function (event) {
                event.stopImmediatePropagation();
                this.replyContainer.setState(CommentsContainer.STATES.ADD);
                this.render();
            },

            /**
             * Submit the modifications on the comment
             */
            onSubmit: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                var textValue = this.$el.find("textarea").val();

                if (textValue === "") {
                    return;
                }

                this.model.save({
                    text: textValue,
                    updated_at: new Date()
                });

                this.cancel();
            },

            /**
             * Proxy to insert comments by pressing the "return" key
             * @param  {event} event Event object
             */
            keyupInsertProxy: function (event) {
                  // If enter is pressed and shit not, we insert a new annotation
                if (event.keyCode === 13 && !event.shiftKey) {
                    this.onSubmit();
                }
            },

            /**
             * Listener for the click on the cancel button
             */
            onCancel: function (event) {
                event.stopImmediatePropagation();
                this.cancel();
            },

            /**
             * Cancel the modifications
             */
            cancel: function () {
                this.isEditEnable = false;
                this.render();
                this.trigger("cancel");
            },

            /**
             * Render this view
             */
            render: function () {
                var data = {
                    creator: this.model.get("created_by_nickname"),
                    creationdate: this.model.get("created_at"),
                    text: this.model.get("text"),
                    canEdit: this.model.isMine(),
                    numberOfReplies: this.model.replies.countCommentsAndReplies(),
                    isEditEnable: this.isEditEnable
                },
                    updatedAt = this.model.get("updated_at");
                if (updatedAt && !util.datesEqual(updatedAt, data.creationdate)) {
                    data.updator = this.model.get("updated_by_nickname");
                    data.updateddate = updatedAt;
                }
                this.$el.html(this.template(data));
                this.$el.find(".replies").first().append(this.replyContainer.render().el);
                this.delegateEvents(this.events);
                return this;
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             */
            remove: function () {
                this.replyContainer.remove();
                Backbone.View.prototype.remove.apply(this, arguments);
            }
        });
        return CommentView;
    }
);
