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
 * A module representing the annotations list view
 * @module views-list
 */
define(["underscore",
        "collections/tracks",
        "views/list-annotation",
        "templates/list",
        "backbone",
        "bootstrap"],

    function (_, Tracks, AnnotationView, template, Backbone) {

        "use strict";

        var lastAddedAnnotationView;

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-list
         * @alias module:views-list.List
         */
        var List = Backbone.View.extend({
            /**
             * Annotation views list
             * @alias module:views-list.List#annotationViews
             * @type {Array}
             */
            annotationViews: [],

            /**
             * List of views of selected annotation
             * @type {Array}
             */
            selectedAnnotations: [],

            /**
             * Old list of views of selected annotation
             * @type {Array}
             */
            oldSelectedAnnotations: [],

            /**
             * Define if the selection have been updated
             * @type {Boolean}
             */
            selectionUpdated: false,

            visible: true,

            /**
             * Events to handle
             * @alias module:views-list.List#events
             * @type {object}
             */
            events: {
                "click .collapse-all": "collapseAll",
                "click .expand-all": "expandAll"
            },

            /**
             * Constructor
             * @alias module:views-list.List#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (options) {
                // Bind functions to the good context
                _.bindAll(this, "render",
                               "addTrackList",
                               "addTrack",
                               "addAnnotation",
                               "addList",
                               "clearList",
                               "getPosition",
                               "getViewFromAnnotation",
                               "insertView",
                               "select",
                               "renderSelect",
                               "updateView",
                               "potentiallyOpenCurrentItems");

                this.annotationViews = [];
                this.tracks          = annotationTool.video.get("tracks");
                this.playerAdapter   = options.playerAdapter;

                this.listenTo(this.tracks, "change:access", this.render);
                this.listenTo(this.tracks, Tracks.EVENTS.VISIBILITY, this.addTrackList);
                this.listenTo(annotationTool, annotationTool.EVENTS.ANNOTATION_SELECTION, this.select);

                this.listenTo(annotationTool.video.get("categories"), "change:visible", this.render);

                this.listenTo(annotationTool, "togglefreetext", this.render);

                this.autoExpand = options.autoExpand;
                annotationTool.addTimeupdateListener(this.potentiallyOpenCurrentItems, 900);

                this.$el.html(template());
                this.scrollableArea = this.$el.find("#content-list-scroll");
                this.$list = this.scrollableArea.find("#content-list");

                this.addTrackList(this.tracks.getVisibleTracks());

                this.render();

                window.requestAnimationFrame(this.renderSelect);

                return this;
            },

            /**
             * Tracks bulk insertion
             * @param {array} tracks Tracks to insert
             */
            addTrackList: function (tracks) {
                this.clearList();
                _.each(tracks, this.addTrack, this);
            },

            /**
             * Add one track
             * @alias module:views-list.List#initialize
             * @param {Track} track to add
             * @param {Integer} index The index of the track in the list
             */
            addTrack: function (track, index) {
                var ann = track.get("annotations"),
                    annotationTrack = track;

                this.stopListening(ann);

                this.listenTo(ann, "add", _.bind(function (newAnnotation) {
                    this.addAnnotation(newAnnotation, annotationTrack);
                }, this));

                this.listenTo(ann, "change:start change:duration", this.updateView);

                this.addList(ann.toArray(), annotationTrack, _.isNumber(index) && index === (this.tracks.length - 1));
            },

            /**
             * Add an annotation as view to the list
             * @alias module:views-list.List#addAnnotation
             * @param {Annotation} the annotation to add as view
             * @param {Track} track Annotation target
             * @param {Boolean} isPartofList Define if the annotation is added with a whole list
             */
            addAnnotation: function (annotation, track, isPartofList) {
                var view;

                // Wait that the id has been set on the model before to add it
                if (_.isUndefined(annotation.get("id"))) {
                    annotation.once("ready", function () {
                        this.addAnnotation(annotation, track, isPartofList);
                    }, this);
                    return;
                }
                view = new AnnotationView({ annotation: annotation, track: track });
                this.insertView(view);

                if (!isPartofList) {
                    if (lastAddedAnnotationView) {
                        lastAddedAnnotationView.toggleCollapsedState(undefined, true);
                    }
                    view.toggleCollapsedState();
                    view.once("change:state", function () {
                        if (view === lastAddedAnnotationView) {
                            lastAddedAnnotationView = undefined;
                        }
                    });

                    annotationTool.setSelection([annotation], false);
                    lastAddedAnnotationView = view;
                }
            },

            /**
             * Inserts the given views at the right index in the list
             * @alias module:views-list.List#insertView
             * @param  {Object} view The view to add
             */
            insertView: function (view) {
                var index = this.getPosition(view);

                view.index = index;

                this.annotationViews.splice(index, 0, view);

                if (index === 0) {
                    this.$list.prepend(view.render().$el);
                } else {
                    this.annotationViews[index - 1].$el.after(view.render().$el);
                }

            },

            /**
             * Updates the position of view of the given annotation in the list
             * @alias module:views-list.List#updateView
             * @param  {Object} annotation The annotation of the view to update
             */
            updateView: function (annotation) {
                var view = this.getViewFromAnnotation(annotation.get("id"));

                // Remove the view in the list if the view index is valid
                if (!_.isUndefined(view.index) && this.annotationViews[view.index] === view) {
                    this.annotationViews.splice(view.index, 1);
                }

                this.insertView(view);
            },

            /**
             * Add a list of annotation, creating a view for each of them
             * @alias module:views-list.List#addList
             * @param {Array} annotationsList List of annotations
             * @param {Boolean} sorting Defines if the list should be sorted after the list insertion
             */
            addList: function (annotationsList, track) {
                var annotation,
                    i;

                for (i = 0; i < annotationsList.length; i++) {
                    annotation = annotationsList[i];
                    this.addAnnotation(annotation, track, true);
                }
            },

            /**
             * Select the given annotation
             * @alias module:views-list.List#select
             * @param  {Annotation} annotations The annotation to select
             */
            select: function (annotations) {
                var annotation,
                    i,
                    view,
                    selectedAnnotations = [];

                // only remove the annotations
                for (i = 0; i < annotations.length; i++) {
                    annotation = annotations[i];
                    if (annotation) {
                        view = this.getViewFromAnnotation(annotation.get("id"));

                        // If view not found, annotation has been newly created
                        if (!_.isUndefined(view)) {
                            selectedAnnotations[i] = view;
                        }
                    }
                }

                this.oldSelectedAnnotations = this.selectedAnnotations;
                this.selectedAnnotations = selectedAnnotations;

                this.selectionUpdated = true;

                if (this.scheduledAnimationFrame) {
                    return;
                }

                this.scheduledAnimationFrame = true;
                window.requestAnimationFrame(this.renderSelect);
            },

            /**
             * Render the annotations selection on the list
             * @alias module:views-list.List#renderSelect
             */
            renderSelect: function () {
                var annotations = this.selectedAnnotations,
                    oldAnnotations = this.oldSelectedAnnotations,
                    view,
                    i;

                // Display selection only if it has been updated
                if (this.selectionUpdated) {

                    for (i = 0; i < oldAnnotations.length; i++) {
                        view = oldAnnotations[i];
                        if (_.isUndefined(view)) {
                            continue;
                        }
                        view.$el.removeClass("selected");
                        view.isSelected = false;
                    }

                    for (i = 0; i < annotations.length; i++) {
                        view = annotations[i];
                        if (_.isUndefined(view)) {
                            continue;
                        }
                        view.$el.addClass("selected");

                        // Only scroll the list to the first item of the selection
                        if (i === 0 && !view.isSelected) {
                            this.scrollableArea.scrollTop(view.$el.offset().top - this.scrollableArea.offset().top);
                        }

                        view.isSelected = true;
                    }

                    this.selectionUpdated = false;
                }

                this.scheduledAnimationFrame = false;
            },

            /**
             * Get the view representing the given annotation
             * @alias module:views-list.List#getViewFromAnnotation
             * @param  {String} id The target annotation id
             * @return {ListAnnotation}            The view representing the annotation
             */
            getViewFromAnnotation: function (id) {
                var annotationViews = this.annotationViews,
                    view,
                    i;

                for (i = 0; i < annotationViews.length; i++) {
                    view = annotationViews[i];
                    if (view.model.get("id") === id) {
                        return view;
                    }
                }

                return undefined;
            },

            /**
             * Returns the index of the given view in the list 
             * @alias module:views-list.List#getPosition
             * @param  {Object} view The target view
             * @return {Integer}      The view index
             */
            getPosition: function (view) {
                // Each view keep the position
                var index = _.sortedIndex(this.annotationViews, view, function (annotationView) {
                    return annotationView.model.get("start");
                }, this);

                return index;
            },

            /**
             * Expand all annotations in the list
             * @alias module:views-list.List#expandAll
             */
            expandAll: function (event) {
                _.invoke(this.annotationViews, "expand");
            },

            /**
             * Collapse all annotations in the list
             * @alias module:views-list.List#collapseAll
             */
            collapseAll: function (event) {
                _.invoke(this.annotationViews, "collapse");
            },

            /**
             * Listener for player "timeupdate" event to open the current annotations in the list view
             * @alias module:views-list.List#potentiallyOpenCurrentItems
             */
            potentiallyOpenCurrentItems: function () {
                var previousAnnotations = [];
                return function () {
                    if (!this.autoExpand) return;

                    _.each(previousAnnotations, function (annotation) {
                        this.getViewFromAnnotation(annotation.id).collapse(true);
                    }, this);
                    var currentAnnotations = annotationTool.getCurrentAnnotations();
                    _.each(currentAnnotations, function (annotation) {
                        this.getViewFromAnnotation(annotation.id).expand(true);
                    }, this);
                    previousAnnotations = currentAnnotations;
                };
            }(),

            /**
             * Display the list
             * @alias module:views-list.List#render
             */
            render: function () {
                var $listContainer = this.$list.detach();

                _.each(this.annotationViews, function (annView) {
                    annView.render().$el.detach();
                });

                $listContainer.empty();

                _.each(this.annotationViews, function (annView) {
                    var category = annView.model.category();
                    if (category && !category.get("visible")) return;
                    if (!category && !annotationTool.freeTextVisible) return;
                    $listContainer.append(annView.$el);
                });

                this.scrollableArea.append($listContainer);

                return this;
            },

            clearList: function () {
                this.tracks.each(function (track) {
                    track.get("annotations").each(function (annotations) {
                        this.stopListening(annotations);
                        annotations.stopListening();
                    }, this);
                    this.stopListening(track);
                    track.stopListening();
                }, this);

                _.each(this.annotationViews, function (annView) {
                    annView.undelegateEvents();
                    annView.stopListening();
                }, this);

                this.annotationViews = [];
                this.$el.find("#content-list").empty();
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             * @alias module:views-list.List#remove
             */
            remove: function () {
                _.each(this.annotationViews, function (annotationView) {
                    annotationView.remove();
                });
                Backbone.View.prototype.remove.call(this);
            }
        });

        return List;
    });
