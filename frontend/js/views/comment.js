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
 * @requires jQuery
 * @requires underscore
 * @requires util
 * @requires templates/comment.tmpl
 * @requires handlebars
 * @requires backbone
 */
define(["jquery",
        "underscore",
        "util",
        "templates/comment",
        "handlebars",
        "backbone",
        "handlebarsHelpers"],

    function ($, _, util, Template, Handlebars, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-comment
         * @alias module:views-comment.Comment
         */
        var CommentView = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-comment.Comment#tagName
             * @type {string}
             */
            tagName: "div",

            /**
             * View template for read-only modus
             * @alias module:views-comment.Comment#template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * Events to handle
             * @alias module:views-comment.Comment#events
             * @type {object}
             */
            events: {
                "click"                     : "stopPropagation",
                "click i.delete-comment"    : "onDeleteComment",
                "dblclick span.comment"     : "onEditComment",
                "click i.edit-comment"      : "onEditComment",
                "click i.add-reply"         : "onAddReply",
                "keyup textarea"            : "keyupInsertProxy",
                "click button[type=submit]" : "onSubmit",
                "click button[type=button]" : "onCancel"
            },

            /**
             * constructor
             * @alias module:views-comment.Comment#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                this.commentId      = attr.model.get("id");
                this.id             = "comment" + this.commentId;
                this.el.id          = this.id;

                // Bind function to the good context
                _.bindAll(this,
                          "cancel",
                          "deleteView",
                          "onDeleteComment",
                          "onEditComment",
                          "onSubmit",
                          "onCancel",
                          "stopPropagation",
                          "render");

                _.extend(this, Backbone.Events);

                this.isEditEnable = !!attr.isEditEnable;

                this.listenTo(this.model.replies, "add remove reset", this.render);

                // Type use for delete operation
                this.typeForDelete = annotationsTool.deleteOperation.targetTypes.COMMENT;

                return this;
            },

            /**
             * Stop the propagation of the given event
             * @alias module:views-comment.Comment#stopPropagation
             * @param  {event} event Event object
             */
            stopPropagation: function (event) {
                event.stopImmediatePropagation();
            },

            /**
             * Delete only this comment
             * @alias module:views-comment.Comment#deleteView
             */
            deleteView: function () {
                this.remove();
                this.undelegateEvents();
                this.deleted = true;
            },

            /**
             * Delete the comment related to this view
             * @alias module:views-comment.Comment#onDeleteComment
             */
            onDeleteComment: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Switch in edit modus
             * @alias module:views-comment.Comment#onEditComment
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
             * @alias module:views-comment.Comment#onAddReply
             */
            onAddReply: function () {
                this.model.replies.create({
                    text: "yeah!"
                });
            },

            /**
             * Submit the modifications on the comment
             * @alias module:views-comment.Comment#onSubmit
             */
            onSubmit: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                var textValue = this.$el.find("textarea").val();

                if (textValue === "") {
                    return;
                }

                this.model.set({
                    "text"       : textValue,
                    "updated_at" : new Date()
                });
                this.model.save();

                this.cancel();
            },

            /**
             * Proxy to insert comments by pressing the "return" key
             * @alias module:views-comments-container.Comment#keyupInsertProxy
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
             * @alias module:views-comment.Comment#onCancel
             */
            onCancel: function (event) {
                event.stopImmediatePropagation();
                this.cancel();
            },

            /**
             * Cancel the modifications
             * @alias module:views-comment.Comment#cancel
             */
            cancel: function () {
                this.isEditEnable = false;
                this.render();
                this.trigger("cancel");
            },

            /**
             * Render this view
             * @alias module:views-comment.Comment#render
             */
            render: function () {
                var data = {
                        creator: this.model.get("created_by_nickname"),
                        creationdate: this.model.get("created_at"),
                        text: this.model.get("text"),
                        canEdit: this.model.get("isMine"),
                        numberOfReplies: this.model.replies.length,
                        isEditEnable: this.isEditEnable
                    },
                    updatedAt = this.model.get("updated_at");

                if (updatedAt && !util.datesEqual(updatedAt, data.creationdate)) {
                    data.updator = this.model.get("updated_by_nickname");
                    data.updateddate = updatedAt;
                }
                this.$el.html(this.template(data));
                this.model.replies.each(function (reply) {
                    this.$el.find(".replies").first().append(new CommentView({ model: reply }).render().$el);
                }, this);
                this.delegateEvents(this.events);
                return this;
            }
        });
        return CommentView;
    }
);
