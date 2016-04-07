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
 * @requires jQuery
 * @requires player-adapter
 * @requires models-annotation
 * @requires models-user
 * @requires views-comments-container
 * @requires templates/list-annotation.tmpl
 * @requires backbone
 * @requires handlebars
 */
define(["jquery",
        "prototypes/player_adapter",
        "models/annotation",
        "models/user",
        "views/comments-container",
        "text!templates/list-annotation.tmpl",
        "backbone",
        "handlebarsHelpers"],

function ($, PlayerAdapter, Annotation, User, CommentsContainer, Template, Backbone, Handlebars) {

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

        /**
         * Class name from the view element
         * @alias module:views-list-annotation.ListAnnotation#className
         * @type {String}
         */
        className: "annotation",

        /**
         * View template
         * @alias module:views-list-annotation.ListAnnotation#template
         * @type {Handlebars template}
         */
        template: Handlebars.compile(Template),

        /**
         * Define if the view has been or not deleted
         * @alias module:views-list-annotation.ListAnnotation#deleted
         * @type {boolean}
         */
        deleted: false,

        /**
         * Define if the view is or not collapsed
         * @alias module:views-list-annotation.ListAnnotation#collapsed
         * @type {boolean}
         */
        collapsed: true,

        /** Events to handle
         * @alias module:views-list-annotation.ListAnnotation#events
         * @type {object}
         */
        events: {
            "click"                      : "onSelect",
            "click .toggle-edit"         : "switchEditModus",
            "click .proxy-anchor"        : "stopPropagation",
            "click .freetext textarea"   : "stopPropagation",
            "click .scaling select"      : "stopPropagation",
            "click .end-value"           : "stopPropagation",
            "click .start-value"         : "stopPropagation",
            "click i.delete"             : "deleteFull",
            "click .select"              : "onSelect",
            "click button.in"            : "setCurrentTimeAsStart",
            "click button.out"           : "setCurrentTimeAsEnd",
            "click a.collapse"           : "onCollapse",
            "click i.icon-comment-amount": "onCollapse",
            "dblclick .start"            : "startEdit",
            "dblclick .end"              : "startEdit",
            "dblclick .end-btn"          : "startEdit",
            "dblclick .start-btn"        : "startEdit",
            "keydown .start-value"       : "saveStart",
            "keydown .end-value"         : "saveEnd",
            "keydown .freetext textarea" : "saveFreeText",
            "focusout .start-value"      : "saveStart",
            "focusout .end-value"        : "saveEnd",
            "focusout .freetext textarea": "saveFreeText",
            "change .scaling select"     : "saveScaling"
        },

        /**
         * constructor
         * @alias module:views-comments-container.CommentsContainer#initialize
         */
        initialize: function (attr) {
            var category;

            if (!attr.annotation) {
                throw "The annotations have to be given to the annotate view.";
            }

            // Bind function to the good context
            _.bindAll(this, "render",
                            "deleteFull",
                            "deleteView",
                            "onSelect",
                            "onSelected",
                            "selectVisually",
                            "onCollapse",
                            "startEdit",
                            "saveStart",
                            "saveEnd",
                            "saveFreeText",
                            "saveScaling",
                            "stopPropagation",
                            "switchEditModus",
                            "setCurrentTimeAsStart",
                            "setCurrentTimeAsEnd");

            this.model = attr.annotation;

            this.id = this.model.get("id");

            this.isEditEnable = false;

            this.commentContainer = new CommentsContainer({id: this.id, comments: this.model.get("comments"), collapsed: this.collapsed});
            this.model.fetchComments();

            if (this.model.get("label")) {
                category = this.model.get("label").category;

                if (!category) {
                    category = this.model.get("label").get("category");
                }

                this.scale = annotationsTool.video.get("scales").get(category.scale_id);
            }

            if (this.scale) {
                this.scaleValues = this.scale.get("scaleValues");
            }

            // Add backbone events to the model
            _.extend(this.model, Backbone.Events);

            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model.get("comments"), "add", this.render);
            this.listenTo(this.model.get("comments"), "change", this.render);
            this.listenTo(this.model.get("comments"), "remove", this.render);
            this.listenTo(this.model, "destroy", this.deleteView);
            this.listenTo(this.model, "remove", this.deleteView);

            // Type use for delete operation
            this.typeForDelete = annotationsTool.deleteOperation.targetTypes.ANNOTATION;

            if (attr.track) {
                this.track = attr.track;
            } else {
                this.track = annotationsTool.selectedTrack;
            }

            return this.render();
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
            annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
        },

        /**
         * Delete only this annotation view
         * @alias module:views-list-annotation.ListAnnotation#deleteView
         */
        deleteView: function () {
            this.remove();
            this.undelegateEvents();
            this.deleted = true;
        },

        /**
         * Move the video current time to this annotation
         * @alias module:views-list-annotation.ListAnnotation#jumpTo
         */
        jumpTo: function () {
            annotationsTool.setSelection([this.model], true);
        },

        /**
         * Switch in/out edit modus
         * @alias module:views-list-annotation.ListAnnotation#switchEditModus
         * @param  {event} event Event object
         */
        switchEditModus: function (event) {
            event.stopImmediatePropagation();

            this.isEditEnable = !this.isEditEnable;
            this.$el.toggleClass("edit-on");

            if (this.isEditEnable) {
                this.startEdit({currentTarget: this.$el.find(".start")[0]});
                this.startEdit({currentTarget: this.$el.find(".end")[0]});

                if (this.collapsed) {
                    this.onCollapse();
                }
            } else {
                this.$el.find(".start input").attr("disabled", "disabled");
                this.$el.find(".end input").attr("disabled", "disabled");
                this.render();
            }
        },

        /**
         * Enter in edit modus
         * @alias module:views-list-annotation.ListAnnotation#startEdit
         * @param  {event} event Event object
         */
        startEdit: function (event) {
            var $target = $(event.currentTarget).find("input");

            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }

            if (!this.model.get("isMine")) {
                return;
            }

            // Hack for Firefox, add an button over it
            if ($target.length === 0 && event.currentTarget.className.match(/-btn$/)) {
                $target = $(event.currentTarget).parent().find(".input");
                $(event.currentTarget).parent().find(".text-container span").hide();
            }

            if ($target.attr("disabled")) {
                $target.removeAttr("disabled");
                $target.focus();
            }
        },

        /**
         * Save the modification done in the free text field
         * @alias module:views-list-annotation.ListAnnotation#saveFreeText
         * @param  {event} event Event object
         */
        saveFreeText: function (event) {
            var newValue = this.$el.find(".freetext textarea").val();

            // If keydown event but not enter, value must not be saved
            if (event.type === "keydown" && !(event.keyCode === 13 && !event.shiftKey)) {
                return;
            }

            this.model.set({text: newValue});
            this.model.save();

            if (event.type === "keydown") {
                $(event.currentTarget).blur();
            }
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
                this.model.set({scalevalue: this.scaleValues.get(newValue).toJSON()});
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

                if (annotationsTool.playerAdapter.getDuration() < seconds || this.model.get("start") > seconds) {
                    $target.addClass("error");
                    return;
                }

                $target.parent().find(".text-container span").show();
                this.model.set("duration", Math.round(seconds - this.model.get("start")));
                this.model.save({siltent: true});
            }

            if (!this.isEditEnable) {
                $target.attr("disabled", "disabled");
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

                if ((this.model.get("duration") + this.model.get("start")) < seconds) {
                    $target.addClass("error");
                    return;
                }

                $target.parent().find("span").show();
                this.model.set({
                    start   : seconds,
                    duration: Math.round(this.model.get("duration") + this.model.get("start") - seconds)
                });
                this.model.save();
            }

            if (!this.isEditEnable) {
                $target.attr("disabled", "disabled");
            }
        },

        /**
         * Save the current playhead time as start time
         * @alias module:views-list-annotation.ListAnnotation#setCurrentTimeAsStart
         * @param  {event} event Event object
         */
        setCurrentTimeAsStart: function (event) {
            var currentTime = Math.round(annotationsTool.playerAdapter.getCurrentTime()),
                end = this.model.get("start") + this.model.get("duration");

            event.stopImmediatePropagation();

            if (currentTime < end) {
                this.model.set({start: currentTime, duration: this.model.get("duration") + this.model.get("start") - currentTime});
                this.model.save();
            }
        },

        /**
         * Save the current playhead time as end time
         * @alias module:views-list-annotation.ListAnnotation#setCurrentTimeAsEd
         * @param  {event} event Event object
         */
        setCurrentTimeAsEnd: function (event) {
            var currentTime = Math.round(annotationsTool.playerAdapter.getCurrentTime());
            event.stopImmediatePropagation();
            if (currentTime > this.model.get("start")) {
                this.model.set({duration: currentTime - this.model.get("start")});
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
                selectedScaleValue;

            if (this.deleted) {
                return "";
            }

            this.model.set({collapsed: this.collapsed}, {silent: true});
            modelJSON = this.model.toJSON();
            modelJSON.track = this.track.get("name");
            modelJSON.textReadOnly = _.escape(modelJSON.text).replace(/\n/g, "<br/>");
            modelJSON.duration = (modelJSON.duration || 0.0);

            if (modelJSON.isMine && this.scale && modelJSON.label.category.scale_id) {
                category = annotationsTool.video.get("categories").get(this.model.get("label").category.id);

                // Check if the category is still linked to the video to get the current version
                if (category) {
                    modelJSON.hasScale = category.get("settings").hasScale;
                } else {
                    // Othervise use the json copy
                    modelJSON.hasScale = this.model.get("label").category.settings.hasScale;
                }

                if (modelJSON.hasScale && this.scale) {
                    scaleValues = this.scaleValues.toJSON();
                    selectedScaleValue = _.where(scaleValues, {id: modelJSON.scale_value_id});

                    if (selectedScaleValue.length > 0) {
                        selectedScaleValue[0].isSelected = true;
                    }
                }
                modelJSON.scalevalues = scaleValues;
            }

            modelJSON.isEditEnable = this.isEditEnable;
            modelJSON.numberOfComments = this.model.get("comments").length;

            this.$el.html(this.template(modelJSON));
            this.$el.attr("id", this.id);

            // Hack for Firefox, add an button over it
            if ($.browser.mozilla) {
                if (modelJSON.duration > 0) {
                    this.$el.find(".end").append("<span class=\"end-btn\" title=\"Double click to edit\">&nbsp;</span>");
                }
                this.$el.find(".start").append("<span class=\"start-btn\" title=\"Double click to edit\">&nbsp;</span>");
            }

            this.$el.find("div#text-container" + this.id).after(this.commentContainer.render().$el);

            this.delegateEvents(this.events);
            return this;
        },

        /**
         * Listener for click on this annotation
         * @alias module:views-list-annotation.ListAnnotation#onSelect
         */
        onSelect: function () {
            // If annotation already selected
            if (annotationsTool.hasSelection() && annotationsTool.getSelection()[0].get("id") === this.model.get("id")) {
                annotationsTool.setSelection();
                this.isSelected = false;
            } else {
                annotationsTool.setSelection([this.model], true, true);
            }
        },

        /**
         * Listener for selection done on this annotation
         * @alias module:views-list-annotation.ListAnnotation#onSelected
         */
        onSelected: function () {
            if (!this.$el.hasClass("selected")) {
                this.$el.parent().find(".selected").removeClass("selected");
                this.selectVisually();
            }
        },

        /**
         * Stop the propagation of the given event
         * @alias module:views-list-annotation.ListAnnotation#stopPropagation
         * @param  {event} event Event object
         */
        stopPropagation: function (event) {
            event.stopImmediatePropagation();
        },

        /**
         * Display the annotation selection on its presentation
         * @alias module:views-list-annotation.ListAnnotation#selectVisually
         */
        selectVisually: function () {
            this.$el.addClass("selected");
        },

        /**
         * Toggle the visibility of the text container
         * @alias module:views-list-annotation.ListAnnotation#onCollapse
         * @param  {event} event Event object
         */
        onCollapse: function (event) {
            if (event) {
                event.stopImmediatePropagation();
            }

            this.collapsed = !this.collapsed;

            this.$el.find("> .header-container > div > a.collapse > i").toggleClass("icon-chevron-right").toggleClass("icon-chevron-down");

            if (this.collapsed) {
                this.$el.find("> div.text-container.in").collapse("hide");
                this.$el.find("> div.comments-container.in").collapse("hide");
            } else {
                if (!this.model.areCommentsLoaded()) {
                    this.model.fetchComments();
                }

                this.$el.find("> div.text-container.collapse").collapse("show");
                this.$el.find("> div.comments-container.collapse").collapse("show");
            }
        }
    });
    return ListAnnotation;
});