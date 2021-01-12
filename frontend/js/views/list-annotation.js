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
define(["jquery",
        "underscore",
        "util",
        "i18next",
        "views/comments-container",
        "templates/comments-container-header",
        "templates/list-annotation",
        "templates/list-annotation-expanded",
        "templates/list-annotation-edit",
        "backbone",
        "handlebarsHelpers"],

    function ($, _, util, i18next, CommentsContainer, commentsContainerHeader, TmplCollapsed, TmplExpanded, TmplEdit, Backbone) {

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

                this.model.fetchComments();
                this.listenTo(this.model.get("comments"), "add remove reset reply", this.render);

                if (this.model.get("label")) {
                    category = this.model.get("label").category;

                    if (!category) {
                        category = this.model.get("label").get("category");
                    }

                    this.scale = annotationTool.video.get("scales").get(category.scale_id);
                }

                if (this.scale) {
                    this.scaleValues = this.scale.get("scaleValues");
                }

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
             * Save the modification done in the free text field
             * @alias module:views-list-annotation.ListAnnotation#saveFreeText
             * @param  {event} event Event object
             */
            saveFreeText: function (event) {

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && !(event.keyCode === 13 && !event.shiftKey)) {
                    return;
                }

                var newValue = this.$el.find(".freetext textarea").val();
                this.model.save({ text: newValue });

                if (event.type === "keydown") {
                    $(event.currentTarget).blur();
                }
                this.toggleEditState(event);
            },

            /**
             * Save the scaling value
             * @alias module:views-list-annotation.ListAnnotation#saveScaling
             * @param  {event} event Event object
             */
            saveScaling: function (event) {
                var newValue = _.escape(this.$el.find(".scaling select").val());

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && event.keyCode !== 13) {
                    return;
                }

                if (newValue === "OFF") {
                    this.model.unset("scalevalue");
                } else {
                    this.model.set({ scalevalue: this.scaleValues.get(newValue).toJSON() });
                    this.$el.find(".scaling span").html(this.scaleValues.get(newValue).get("name"));
                }

                this.model.save();
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
                    scaleValues,
                    category,
                    selectedScaleValue,
                    title;

                modelJSON              = this.model.toJSON();
                modelJSON.track        = this.track.get("name");
                modelJSON.textReadOnly = _.escape(modelJSON.text).replace(/\n/g, "<br/>");
                modelJSON.duration     = (modelJSON.duration || 0.0);
                modelJSON.textHeight   = this.$el.find("span.freetext").height();

                if (modelJSON.label) {
                    category = annotationTool.video.get("categories").get(this.model.get("label").category.id);

                    title = modelJSON.label.abbreviation + " - " + modelJSON.label.value;
                    this.$el.css("background-color", category.get("settings").color);
                } else {
                    title = modelJSON.text;
                }

                if (modelJSON.isMine && this.scale && modelJSON.label.category.scale_id) {
                    // Check if the category is still linked to the video to get the current version
                    if (category) {
                        modelJSON.hasScale = category.get("settings").hasScale;
                    } else {
                        // Othervise use the json copy
                        modelJSON.hasScale = this.model.get("label").category.settings.hasScale;
                    }

                    if (modelJSON.hasScale && this.scale) {
                        scaleValues = this.scaleValues.toJSON();
                        selectedScaleValue = _.where(scaleValues, { id: modelJSON.scale_value_id });

                        if (selectedScaleValue.length > 0) {
                            selectedScaleValue[0].isSelected = true;
                        }
                    }
                    modelJSON.scalevalues = scaleValues;
                }

                modelJSON.numberOfComments = this.model.get("comments").countCommentsAndReplies();
                modelJSON.state = this.getState().id;
                modelJSON.end = modelJSON.start + modelJSON.duration;

                this.$el.html(this.currentState.render(modelJSON));

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

                this.delegateEvents(this.getState().events);

                return this;
            },

            /**
             * Listener for click on this annotation
             * @alias module:views-list-annotation.ListAnnotation#onSelect
             * @param {Event} event the click event
             */
            onSelect: function (event) {
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

                this.commentContainer.setState(CommentsContainer.STATES.READ);
                this.setState(ListAnnotation.STATES.EDIT, ListAnnotation.STATES.EXPANDED);

                if (this.isEditEnable) {
                    this.trigger("edit", this);
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
                    withComments: true,
                    id: "expanded",
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
                        "keydown .freetext textarea": "saveFreeText",
                        "focusout .start-value": "saveStart",
                        "focusout .end-value": "saveEnd",
                        "click button[type=submit]": "saveFreeText",
                        "click button[type=button]": "toggleEditState",
                        "focusout .freetext textarea": "saveFreeText",
                        "change .scaling select": "saveScaling",
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
