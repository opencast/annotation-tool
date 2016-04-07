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
 * @requires templates/comment.tmpl
 * @requires templates/edit-comment.tmpl
 * @requires handlebars
 * @requires backbone
 */
define(["jquery",
        "underscore",
        "text!templates/comment.tmpl",
        "text!templates/edit-comment.tmpl",
        "handlebars",
        "backbone"],

    function ($, _, Template, EditTemplate, Handlebars, Backbone) {

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
             * @type {Handlebars template}
             */
            template: Handlebars.compile(Template),

            /**
             * View template for edit modus
             * @alias module:views-comment.Comment#template
             * @type {Handlebars template}
             */
            editTemplate: Handlebars.compile(EditTemplate),

            /**
             * Events to handle
             * @alias module:views-comment.Comment#events
             * @type {object}
             */
            events: {
                "click i.delete-comment"    : "onDeleteComment",
                "click i.edit-comment"      : "onEditComment",
                "click button[type=submit]" : "onSubmit",
                "click button[type=button]" : "onCancel"
            },

            /**
             * constructor
             * @alias module:views-comment.Comment#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                this.model     = attr.model;
                this.commentId = attr.model.get("id");
                this.id        = "comment" + this.commentId;
                this.el.id     = this.id;
                // Bind function to the good context
                _.bindAll(this,
                          "deleteView",
                          "onDeleteComment",
                          "onEditComment",
                          "onSubmit",
                          "onCancel",
                          "render");

                // Type use for delete operation
                this.typeForDelete = annotationsTool.deleteOperation.targetTypes.COMMENT;

                return this;
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
                if (event) {
                    event.stopImmediatePropagation();
                }
                annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Switch in edit modus
             * @alias module:views-comment.Comment#onEditComment
             */
            onEditComment: function () {
                if (!this.isEditEnable) {
                    this.$el.append(this.editTemplate({text: this.model.get("text")}));
                    this.isEditEnable = true;
                }
            },

            /**
             * Submit the modifications on the comment
             * @alias module:views-comment.Comment#onSubmit
             */
            onSubmit: function () {
                var textValue = this.$el.find("textarea").val();

                if (textValue === "") {
                    return;
                }

                this.model.set("text", textValue);
                this.model.save();

                this.cancel();
                this.render();
            },

            /**
             * Listener for the click on the cancel button
             * @alias module:views-comment.Comment#onCancel
             */
            onCancel: function () {
                event.stopImmediatePropagation();
                this.cancel();
            },

            /**
             * Cancel the modifications
             * @alias module:views-comment.Comment#cancel
             */
            cancel: function () {
                this.isEditEnable = false;
                this.$el.find("textarea").remove();
                this.$el.find("button").remove();
            },

            /**
             * Render this view
             * @alias module:views-comment.Comment#render
             */
            render: function () {
                var modelJSON = this.model.toJSON(),
                    data = {
                        creator     : modelJSON.created_by_nickname,
                        creationdate: new Date(modelJSON.created_at),
                        text        : _.escape(modelJSON.text).replace(/\n/g, "<br/>"),
                        canEdit     : annotationsTool.user.get("id") === modelJSON.created_by
                    };
                if (modelJSON.created_at !== modelJSON.updated_at) {
                    data.updator = modelJSON.updated_by_nickname;
                    data.updateddate = new Date(modelJSON.updated_at);
                }
                this.$el.html(this.template(data));
                this.delegateEvents(this.events);
                return this;
            }
        });
        return CommentView;
    }
);