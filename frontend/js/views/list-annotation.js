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
 * A module representing the view for an item of the annotations list
 * @module views-list-annotation
 */
define(
    [
        "jquery",
        "underscore",
        "util",
        "i18next",
        "views/comments-container",
        "views/modal-add-free-text",
        "views/modal-add-labelled",
        "views/modal-edit-free-text",
        "views/modal-edit-labelled",
        "templates/comments-container-header",
        "templates/list-annotation",
        "templates/list-annotation-expanded",
        "templates/list-annotation-edit",
        "templates/list-annotation-category",
        "templates/content-type-text",
        "templates/content-type-label",
        "templates/content-type-scaling",
        "templates/content-item-header",
        "backbone",
        "handlebarsHelpers"
    ],

    function ($, _, util, i18next, CommentsContainer, AddFreeTextModal, AddLabelledModal, EditFreeTextModal, EditLabelledModal, commentsContainerHeader, TmplCollapsed, TmplExpanded, TmplEdit, TmplCategory, TmplTypeText, TmplTypeLabel, TmplTypeScaling, TmplContentItemHeader, Backbone) {

        "use strict";

        /**
        * @constructor
        * @see {@link http://www.backbonejs.org/#View}
        * @augments module:Backbone.View
        * @memberOf module:views-list-annotation
        * @alias module:views-list-annotation.ListAnnotation
        */
        var ListAnnotation = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-list-annotation.ListAnnotation#tagName
             * @type {string}
             */
            tagName: "div",

            className: "annotation",

            /**
             * Define if the comments container is currently visible
             * @alias module:views-list-annotation.ListAnnotation#commentsVisible
             * @type {Boolean}
             */
            commentsVisible: false,

            /** Events to handle
             * @alias module:views-list-annotation.ListAnnotation#events
             * @type {object}
             */
            events: undefined,

            /**
             * The current view {@link ListAnnotation.STATES} of the annotation view
             * @alias module:views-list-annotation.ListAnnotation#currentStates
             * @type {ListAnnotation.STATES}
             */
            currentState: undefined,

            /**
             * constructor
             * @alias module:views-list-annotation.ListAnnotation#initialize
             */
            initialize: function (attr) {
                var category;

                this.commentContainer = new CommentsContainer({
                    collection: this.model.get("comments")
                });
                this.listenTo(this.commentContainer, "cancel", function () {
                    this.trigger("cancel", this);
                    this.toggleCommentsState();
                });
                this.listenTo(this.commentContainer, "edit", function () {
                    this.trigger("edit", this);
                    this.setState(ListAnnotation.STATES.COMMENTS, ListAnnotation.STATES.EXPANDED);
                    this.render();
                });

                this.listenTo(annotationTool.video.get("categories"), "change add remove", this.render);

                this.model.fetchComments();
                this.listenTo(this.model.get("comments"), "add remove reset reply", this.render);
                this.listenTo(this.model, "change", this.render);
                this.listenTo(this.model.get("comments"), "change", this.render);
                this.listenTo(this.model.get("comments"), "remove", this.render);

                // Type use for delete operation
                this.typeForDelete = annotationTool.deleteOperation.targetTypes.ANNOTATION;

                this.track = this.model.collection.track;

                this.currentState = ListAnnotation.STATES.COLLAPSED;

                // TODO This should actually be done in the list view,
                //   instead of the individual list item views.
                //   However, the list view is not designed to be rerendered, currently.
                //   Alternatively we could listen to the `model`-s category,
                //   but that's more complicated, because the entire category
                //   as opposed to just a property of it could change,
                //   even to something like "no category".
                //   However, that would probably be better for performance.
                this.listenTo(annotationTool.video.get("categories"), "change", this.render);

                return this.render();
            },

            /**
             * Set the state to the given newState or the fallbackState if newState is already set
             * @alias module:views-list-annotation.ListAnnotation#setState
             * @param {State} newState The new state to set if not already activated
             * @param {State} fallbackState The fallback state if the new state is already set
             */
            setState: function (newState, fallbackState) {
                var fallback = false;
                if (!_.isUndefined(fallbackState) && this.getState() === newState) {
                    this.currentState = fallbackState;
                    fallback = true;
                } else {
                    this.currentState = newState;
                }
                this.trigger("change:state", this, { fallback: fallback });

                this.manuallyExpanded = this.currentState === ListAnnotation.STATES.EXPANDED;
            },

            /**
             * Returns the state of the list annotation view
             * @alias module:views-list-annotation.ListAnnotation#getState
             * @return {State} The current state of the list annotation view
             */
            getState: function () {
                return this.currentState;
            },

            /**
             * Delete completely the annotation
             * @alias module:views-list-annotation.ListAnnotation#deleteFull
             * @param {event} event Event object
             */
            deleteFull: function (event) {
                if (event) {
                    event.stopImmediatePropagation();
                }
                annotationTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Save the end time
             * @alias module:views-list-annotation.ListAnnotation#saveEnd
             * @param  {event} event Event object
             */
            saveEnd: function (event) {
                var $target = $(event.currentTarget),
                    value = $target.val(),
                    radix = 10, // Radix is 10 for decimal
                    values,
                    seconds;

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && event.keyCode !== 13) {
                    return;
                }

                $target.removeClass("error");

                if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                    $target.addClass("error");
                    return;
                } else {
                    values = value.split(":");

                    if (values.length === 3) {
                        seconds = parseInt(values[0], radix) * 3600 + parseInt(values[1], radix) * 60 + parseInt(values[2], radix);
                    } else if (values.length === 2) {
                        seconds = parseInt(values[0], radix) * 60 + parseInt(values[1], radix);
                    } else {
                        seconds = parseInt(values[0], radix);
                    }

                    if (annotationTool.playerAdapter.getDuration() < seconds || this.model.get("start") > seconds) {
                        $target.addClass("error");
                        return;
                    }

                    $target.parent().parent().find("tr.text-container span").show();
                    this.model.set("duration", seconds - this.model.get("start"));
                    this.model.save(null, { silent: true });
                }
            },

            /**
             * Save the start time
             * @alias module:views-list-annotation.ListAnnotation#saveStart
             * @param  {event} event Event object
             */
            saveStart: function (event) {
                var $target = $(event.currentTarget),
                    value = $target.val(),
                    radix = 10, // Radix is 10 for decimal
                    values,
                    duration,
                    seconds;

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && event.keyCode !== 13) {
                    return;
                }

                duration = this.model.get("duration");

                $target.removeClass("error");

                if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                    $target.addClass("error");
                    return;
                } else {
                    values = value.split(":");

                    if (values.length === 3) {
                        seconds = parseInt(values[0], radix) * 3600 + parseInt(values[1], radix) * 60 + parseInt(values[2], radix);
                    } else if (values.length === 2) {
                        seconds = parseInt(values[0], radix) * 60 + parseInt(values[1], radix);
                    } else {
                        seconds = parseInt(values[0], radix);
                    }

                    if (duration > 0 && (duration + this.model.get("start")) < seconds) {
                        $target.addClass("error");
                        return;
                    }

                    $target.parent().find("span").show();
                    this.model.set({
                        start   : seconds,
                        duration: this.model.get("duration") + this.model.get("start") - seconds
                    });
                    this.model.save(null, { silent: true });
                }
            },

            /**
             * Save the current playhead time as start time
             * @alias module:views-list-annotation.ListAnnotation#setCurrentTimeAsStart
             * @param  {event} event Event object
             */
            setCurrentTimeAsStart: function (event) {
                var currentTime = annotationTool.playerAdapter.getCurrentTime(),
                    end = this.model.get("start") + this.model.get("duration");

                event.stopImmediatePropagation();

                if (currentTime < end) {
                    this.model.set({
                        start: currentTime,
                        duration: this.model.get("duration") + this.model.get("start") - currentTime
                    });
                    this.model.save();
                }
            },

            /**
             * Save the current playhead time as end time
             * @alias module:views-list-annotation.ListAnnotation#setCurrentTimeAsEd
             * @param  {event} event Event object
             */
            setCurrentTimeAsEnd: function (event) {
                var currentTime = annotationTool.playerAdapter.getCurrentTime();
                event.stopImmediatePropagation();
                if (currentTime > this.model.get("start")) {
                    this.model.set({ duration: currentTime - this.model.get("start") });
                    this.model.save();
                }
            },

            /**
             * Render this view
             * @alias module:views-list-annotation.ListAnnotation#render
             */
            render: function () {
                var modelJSON,
                    title;

                // See which content items are currently expanded;
                // we want to preserve that state during a re-render
                var itemExpanded = [];
                this.$el.find(".content-item").each(_.bind(function (index, item) {
                    if (this.$(item).hasClass("open")) {
                        itemExpanded[index] = true;
                    }
                }, this));

                modelJSON              = this.model.toJSON();
                modelJSON.track        = this.track.get("name");
                modelJSON.textReadOnly = _.escape(modelJSON.text).replace(/\n/g, "<br/>");
                modelJSON.duration     = (modelJSON.duration || 0.0);
                modelJSON.textHeight   = this.$el.find("span.freetext").height();

                modelJSON.numberOfComments = this.model.get("comments").countCommentsAndReplies();
                modelJSON.state = this.getState().id;
                modelJSON.end = modelJSON.start + modelJSON.duration;

                modelJSON.labels = annotationTool.video.getLabels();

                modelJSON.categories = annotationTool.video.get("categories")
                    .filter(function (category) {
                        return !category.get("deleted_at");
                    })
                    .map(
                        function (category) {
                            var labels = category.get("labels").toJSON()
                                .filter(function (label) {
                                    return !label.deleted_at;
                                });
                            var scale = null;
                            if (category.get("scale_id")) {
                                scale = annotationTool.video.get("scales").get(category.get("scale_id"));
                                scale = _.extend(scale.toJSON(), {
                                    scaleValues: scale.get("scaleValues").toJSON()
                                        .filter(function (scaleValue) {
                                            return !scaleValue.deleted_at;
                                        })
                                });
                            }
                            return _.extend(category.toJSON(), { labels: labels, scale: scale });
                        }
                    );

                var partials = _.extend(
                    {
						"category": TmplCategory,
						"text": TmplTypeText,
						"label": TmplTypeLabel,
						"scaling": TmplTypeScaling,
						"content-item-header": TmplContentItemHeader
                    },
                    this.currentState.partials || {}
                );
                this.$el.html(this.currentState.render(modelJSON, { partials: partials }));

                this.$el.css("background-color", this.model.getColor() || '');

                title = this.model.getTitleAttribute();

                if (this.getState() == ListAnnotation.STATES.EDIT) {
                    title += " edit-on";
                }

                if (this.getState() === ListAnnotation.STATES.COLLAPSED) {
                    this.$el.attr("title", title);
                } else {
                    this.$el.removeAttr("title");
                }


                // Hack for Firefox, add a button over it
                if ($.browser.mozilla) {
                    if (modelJSON.duration > 0) {
                        this.$el.find(".end").append("<span class=\"end-btn\" title=\"" + i18next.t("list annotation.double click to edit") + "\">&nbsp;</span>");
                    }
                    this.$el.find(".start").append("<span class=\"start-btn\" title=\"" + i18next.t("list annotation.double click to edit") + "\">&nbsp;</span>");
                }


                if (this.getState().withComments) {
                    if (!this.model.areCommentsLoaded()) {
                        this.model.fetchComments();
                    }

                    if (this.getState() === ListAnnotation.STATES.COMMENTS || this.model.get("comments").length > 0) {
                        this.$el.find(".comments").append(
                            commentsContainerHeader(),
                            this.commentContainer.render().$el
                        );
                    }
                }

                // Restore content item expansion state
                this.$el.find(".content-item").each(_.bind(function (index, item) {
                    if (itemExpanded[index]) {
                        this.$(item).addClass("open");
                    }
                }, this));

                this.delegateEvents(this.getState().events);

                return this;
            },

            /**
             * Listener for click on this annotation
             * @alias module:views-list-annotation.ListAnnotation#onSelect
             */
            onSelect: function (event) {
                if ($(event.target).is(".btn, .content-item header i")) {
                    return;
                }

                annotationTool.setSelection(
                    this.model,
                    // Toggle selection on single click,
                    // unconditionally select on double click
                    event.originalEvent.detail > 1,
                    "list"
                );
            },

            /**
             * Navigate to this view's annotation
             * @alias module:views-list-annotation.ListAnnotation#moveTo
             */
            moveTo: function () {
                annotationTool.playerAdapter.setCurrentTime(
                    this.model.get("start")
                );
            },

            /**
             * Switch in/out edit modus
             * @alias module:views-list-annotation.ListAnnotation#toggleEditState
             * @param {Event} event Event object
             */
            toggleEditState: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                if (this.model.get("createdFromQuestionnaire")) {
                    Backbone.trigger("questionnaire:edit-annotation", this.model);
                } else {

                    this.commentContainer.setState(CommentsContainer.STATES.READ);
                    this.setState(ListAnnotation.STATES.EDIT, ListAnnotation.STATES.EXPANDED);

                    if (this.isEditEnable) {
                        this.trigger("edit", this);
                    }
                }

                this.render();
            },

            /**
             * Toggle the visibility of the text container
             * @alias module:views-list-annotation.ListAnnotation#toggleCollapsedState
             * @param  {event} event Event object
             * @param  {boolean} force Force to collapse state
             */
            toggleCollapsedState: function (event, force) {
                if (!_.isUndefined(event) && !force) {
                    event.stopImmediatePropagation();
                }

                this.commentContainer.setState(CommentsContainer.STATES.READ);
                if (force) {
                    this.setState(ListAnnotation.STATES.COLLAPSED);
                } else {
                    this.setState(ListAnnotation.STATES.COLLAPSED, ListAnnotation.STATES.EXPANDED);
                }
                this.render();
            },

            /**
             * Toggle the visibility of the text container
             * @alias module:views-list-annotation.ListAnnotation#toggleExpandedState
             * @param {Event} event Event object
             * @param {boolean} force Force to expand state
             */
            toggleExpandedState: function (event, force) {
                if (!_.isUndefined(event) && !force) {
                    event.stopImmediatePropagation();
                }

                this.commentContainer.setState(CommentsContainer.STATES.READ);
                if (force) {
                    this.setState(ListAnnotation.STATES.EXPANDED);
                } else {
                    this.setState(ListAnnotation.STATES.EXPANDED, ListAnnotation.STATES.COLLAPSED);
                }
                this.render();
            },

            /**
             * Expand the text container
             * @alias module:views-list-annotation.ListAnnotation#expand
             * @param  {Boolean} auto Is this an automatic expansion as opposed to one initiated by the user?
             */
            expand: function (auto) {
                var wasManuallyExpanded = this.manuallyExpanded;
                this.toggleExpandedState(undefined, true);
                this.manuallyExpanded = wasManuallyExpanded || !auto;
            },

            /**
             * Collapse the text container
             * @alias module:views-list-annotation.ListAnnotation#collapse
             * @param  {Boolean} autoOnly Only really collapse the view when it was opened automatically.
             *                            See {@link expand}.
             */
            collapse: function (autoOnly) {
                if (autoOnly && this.manuallyExpanded) return;
                this.toggleCollapsedState(undefined, true);
            },

            /**
             * Toggle the comments state
             * @alias module:views-list-annotation.ListAnnotation#toggleCommentsState
             * @param  {event} event Event object
             */
            toggleCommentsState: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                if (this.getState() !== ListAnnotation.STATES.COMMENTS) {
                    this.commentContainer.setState(CommentsContainer.STATES.ADD);
                    this.trigger("edit", this);
                } else {
                    this.commentContainer.setState(CommentsContainer.STATES.READ);
                }

                this.setState(ListAnnotation.STATES.COMMENTS, ListAnnotation.STATES.EXPANDED);
                this.render();
                this.commentContainer.$el.find("textarea").focus();
            },

            /**
             * Proxy function for leaving edit mode through 'esc' keypress
             * @alias module:views-list-annotation.ListAnnotation#handleEsc
             * @param {event} event Event object
             */
            handleEsc: function (event) {
                // If enter is pressed and shit not, we insert a new annotation
                if (event.keyCode === 27 && !event.shiftKey && this.getState() === ListAnnotation.STATES.EDIT) {
                    this.toggleExpandedState(event, true);
                }
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             * @alias module:views-list-annotation.ListAnnotation#remove
             */
            remove: function () {
                this.commentContainer.remove();
                Backbone.View.prototype.remove.apply(this, arguments);
            },

            /**
             * Add a new annotation with a content item containing free text.
             * @alias module:views-list-annotation.ListAnnotation#addFreetextContent
             * @param {Event} event Event object
             */
            addFreeTextContent(event) {
                event.stopPropagation();

                annotationTool.addModal(
                    i18next.t("annotation.add content.add free text"),
                    new AddFreeTextModal({ model: this.model }),
                    i18next.t("common actions.insert")
                );
            },

            /**
             * Add a new annotation with a content item containing a label w/ or w/o a scale value.
             * @alias module:views-list-annotation.ListAnnotation#addLabelledContent
             * @param {Event} event Event object
             */
            addLabelledContent(event) {
                event.stopPropagation();

                var categoryID = $(event.target).data("category");
                var category = annotationTool.video.get("categories").get(categoryID);

                annotationTool.addModal(
                    i18next.t("annotation.add content.category") + " " + category.get("name"),
                    new AddLabelledModal({ model: this.model, category: category })
                );
            },

            /**
             * Edit an annotation's content item in a modal dialog.
             * @alias module:views-list-annotation.ListAnnotation#editContentitem
             * @param {Event} event Event object
             */
            editContentItem: function (event) {
                var $contentItem = $(event.target).closest(".content-item");
                var position = $contentItem.prevAll().length;
                var contentItems = this.model.get("content");
                var contentItem = contentItems.at(position);

                switch (contentItem.getType()) {
                case "text":
                    annotationTool.addModal(
                        i18next.t("annotation.edit.edit"),
                        new EditFreeTextModal({
                            model: this.model,
                            contentItem: contentItem
                        }),
                        i18next.t("common actions.save")
                    );
                    break;

                case "label":
                case "scaling":
                    annotationTool.addModal(
                        i18next.t("annotation.edit.edit"),
                        new EditLabelledModal({
                            model: this.model,
                            category: contentItem.getCategory(),
                            contentItem: contentItem
                        })
                    );
                    break;
                }
            },

            /**
             * Remove an annotation's content item.
             * @alias module:views-list-annotation.ListAnnotation#removeContentitem
             * @param {Event} event Event object
             */
            removeContentItem: function (event) {
                var $contentItem = $(event.target).closest(".content-item");
                var position = $contentItem.prevAll().length;
                var contentItems = this.model.get("content");
                contentItems.remove(contentItems.at(position));
                this.model.save();
                this.model.trigger("change", this.model, {});
            },

            /**
             * Toggle between expanding and collapsing an annotation's content item.
             * @alias module:views-list-annotation.ListAnnotation#toggleContentItem
             * @param {Event} event Event object
             */
            toggleContentItem: function (event) {
                var $contentItem = $(event.target).closest(".content-item");
                $contentItem.toggleClass("open");
            }
        }, {

            /** List of the different states existing for the annotation view in the list */
            STATES: {
                COLLAPSED: {
                    render: TmplCollapsed,
                    withComments: false,
                    id: "collapsed",
                    events: {
                        "click": "onSelect",
                        "dblclick": "moveTo",
                        "click .collapse": "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment": "toggleCommentsState",
                        "click .toggle-edit": "toggleEditState",
                        "click i.delete": "deleteFull"
                    }
                },
                EXPANDED: {
                    render: TmplExpanded,
                    partials: {
                        "text": TmplTypeText,
                        "label": TmplTypeLabel,
                        "scaling": TmplTypeScaling
                    },
                    withComments: true,
                    id: "expanded",
                    events: {
                        "click": "onSelect",
                        "dblclick": "moveTo",
                        "click .collapse": "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment": "toggleCommentsState",
                        "click .toggle-edit": "toggleEditState",
                        "click i.delete": "deleteFull",
                        "click button.add-free-text-content": "addFreeTextContent",
                        "click button.add-labelled-content": "addLabelledContent",
                        "click .content-item-expand": "toggleContentItem",
                        "click .content-item-collapse": "toggleContentItem",
                        "click .content-item-edit": "editContentItem",
                        "click .content-item-trash": "removeContentItem",
                    }
                },
                EDIT: {
                    render: TmplEdit,
                    withComments: true,
                    id: "edit-annotation",
                    events: {
                        "click": "onSelect",
                        "dblclick": "moveTo",
                        "click .collapse": "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment": "toggleCommentsState",
                        "click .toggle-edit": "toggleEditState",
                        "click .freetext textarea": util.stopPropagation,
                        "click .scaling select": util.stopPropagation,
                        "click .end-value": util.stopPropagation,
                        "click .start-value": util.stopPropagation,
                        "click i.delete": "deleteFull",
                        "click button.in": "setCurrentTimeAsStart",
                        "click button.out": "setCurrentTimeAsEnd",
                        "keydown .start-value": "saveStart",
                        "keydown .end-value": "saveEnd",
                        "focusout .start-value": "saveStart",
                        "focusout .end-value": "saveEnd",
                        "click button[type=button]": "toggleEditState",
                        "keyup": "handleEsc"
                    }
                },
                COMMENTS: {
                    render: TmplExpanded,
                    withComments: true,
                    id: "add-comment",
                    events: {
                        "click": "onSelect",
                        "dblclick": "moveTo",
                        "click .collapse": "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment": "toggleCommentsState",
                        "click .toggle-edit": "toggleEditState",
                        "dblclick span.text": "toggleEditState",
                        "dblclick span.category": "toggleEditState"
                    }
                }
            }
        });

    return ListAnnotation;

});
