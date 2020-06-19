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
        "views/list-annotation",
        "templates/list",
        "backbone",
        "bootstrap"],

    function (_, AnnotationView, template, Backbone) {

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
                var _this = _(this);
                _this.bindAll(
                    "renderSelect",
                    "potentiallyOpenCurrentItems"
                );

                _this.extend(_(options).pick(
                    "playerAdapter",
                    "autoExpand"
                ));

                this.tracks = annotationTool.video.get("tracks");

                this.listenTo(this.tracks, "visibility", this.setTrackList);
                this.listenTo(annotationTool, annotationTool.EVENTS.ANNOTATION_SELECTION, this.select);

                this.listenTo(annotationTool.video.get("categories"), "change:visible", this.updateVisibility);
                this.listenTo(annotationTool, "togglefreetext", this.updateVisibility);

                annotationTool.addTimeupdateListener(this.potentiallyOpenCurrentItems, 900);

                this.$el.html(template());
                this.scrollableArea = this.$el.find("#content-list-scroll");
                this.$list = this.scrollableArea.find("#content-list");

                this.setTrackList(this.tracks.getVisibleTracks());

                window.requestAnimationFrame(this.renderSelect);

                return this;
            },

            /**
             * Tracks bulk insertion
             * @param {array} tracks Tracks to insert
             */
            setTrackList: function (tracks) {
                this.removeAnnotationViews();
                this.annotationViews = [];
                _.each(tracks, this.addTrack, this);
                this.updateVisibility();
            },

            /**
             * Add one track
             * @alias module:views-list.List#initialize
             * @param {Track} track to add
             */
            addTrack: function (track) {
                var annotations = track.annotations;

                this.listenTo(annotations, "add", function (newAnnotation) {
                    this.addAnnotation(newAnnotation, track);
                });

                this.listenTo(annotations, "remove", function (annotation) {
                    var view = this.getViewFromAnnotation(annotation.id);
                    view.remove();
                    this.annotationViews.splice(view.index, 1);
                });

                this.listenTo(annotations, "change:start", function (annotation) {
                    this.insertView(
                        this.getViewFromAnnotation(annotation.get("id"))
                    );
                });

                annotations.each(function (annotation) {
                    this.addAnnotation(annotation, track, true);
                }, this);
            },

            /**
             * Add an annotation as view to the list
             * @alias module:views-list.List#addAnnotation
             * @param {Annotation} the annotation to add as view
             * @param {Track} track Annotation target
             * @param {Boolean} isPartofList Define if the annotation is added with a whole list
             */
            addAnnotation: function (annotation, track, isPartofList) {
                var view = new AnnotationView({ model: annotation });
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
                    this.$list.prepend(view.$el);
                } else {
                    this.annotationViews[index - 1].$el.after(view.$el);
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
             * @param {String} id The target annotation id
             * @return {ListAnnotation} The view representing the annotation
             */
            getViewFromAnnotation: function (id) {
                return _.find(this.annotationViews, function (view) {
                    return view.model.id === id;
                });
            },

            /**
             * Returns the index of the given view in the list
             * @alias module:views-list.List#getPosition
             * @param  {Object} view The target view
             * @return {Integer} The view index
             */
            getPosition: function (view) {
                return _.sortedIndex(
                    this.annotationViews,
                    view,
                    function (annotationView) {
                        return annotationView.model.get("start");
                    },
                    this
                );
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
             * @alias module:views-list.List#updateVisibility
             */
            updateVisibility: function () {
                _.each(this.annotationViews, function (annView) {
                    annView.$el.detach();
                });

                this.$list.empty();

                _.each(this.annotationViews, function (annView) {
                    var category = annView.model.category();
                    if (category && !category.get("visible")) return;
                    if (!category && !annotationTool.freeTextVisible) return;
                    this.$list.append(annView.$el);
                }, this);

                return this;
            },

            removeAnnotationViews: function () {
                _.invoke(this.annotationViews, "remove");
            },

            /**
             * Remove this view from the DOM and clean up all of its data and event handlers
             * @alias module:views-list.List#remove
             */
            remove: function () {
                this.removeAnnotationViews();
                Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        return List;
    });
