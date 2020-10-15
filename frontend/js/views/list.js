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
                _(this).extend(_(options).pick(
                    "playerAdapter",
                    "autoExpand"
                ));

                var tracks = annotationTool.video.get("tracks");

                this.listenTo(tracks, "visibility", this.setTrackList);
                this.listenTo(annotationTool, annotationTool.EVENTS.ANNOTATION_SELECTION, this.renderSelection);
                this.listenTo(annotationTool, annotationTool.EVENTS.ACTIVE_ANNOTATIONS, this.renderActive);

                this.listenTo(annotationTool.video.get("categories"), "change:visible", this.updateVisibility);
                this.listenTo(annotationTool, "togglefreetext", this.updateVisibility);

                this.$el.html(template());
                this.scrollableArea = this.$el.find("#content-list-scroll");
                this.$list = this.scrollableArea.find("#content-list");

                this.setTrackList(tracks.getVisibleTracks());

                this.renderSelection(annotationTool.getSelection());
                this.renderActive(annotationTool.getCurrentAnnotations());

                return this;
            },

            /**
             * Tracks bulk insertion
             * @alias module:views-list.List#setTrackList
             * @param {array} tracks Tracks to insert
             */
            setTrackList: function (tracks) {
                _.each(this.tracks, function (track) {
                    this.stopListening(track.annotations);
                }, this);
                this.tracks = tracks;
                this.removeAnnotationViews();
                _.each(tracks, this.addTrack, this);
                this.updateVisibility();
            },

            /**
             * Add one track
             * @alias module:views-list.List#addTrack
             * @param {Track} track to add
             */
            addTrack: function (track) {
                var annotations = track.annotations;

                this.listenTo(annotations, "add", function (newAnnotation) {
                    this.addAnnotation(newAnnotation);
                });

                this.listenTo(annotations, "remove", function (annotation) {
                    var index = this.getViewIndexFromAnnotation(annotation.id);
                    var view = this.annotationViews[index];
                    this.annotationViews.splice(index, 1);
                    view.remove();
                });

                this.listenTo(annotations, "change:start", function (annotation) {
                    var index = this.getViewIndexFromAnnotation(annotation.id);
                    var view = this.annotationViews[index];
                    this.annotationViews.splice(index, 1);
                    this.insertView(view);
                });

                annotations.each(function (annotation) {
                    this.addAnnotation(annotation, true);
                }, this);
            },

            /**
             * Add an annotation as view to the list
             * @alias module:views-list.List#addAnnotation
             * @param {Annotation} the annotation to add as view
             * @param {Boolean} isPartofList Define if the annotation is added with a whole list
             */
            addAnnotation: function (annotation, isPartofList) {
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

                    lastAddedAnnotationView = view;
                }
            },

            /**
             * Inserts the given views at the right index in the list
             * @alias module:views-list.List#insertView
             * @param  {Object} view The view to add
             */
            insertView: function (view) {
                var index = _.sortedIndex(
                    this.annotationViews,
                    view,
                    function (annotationView) {
                        return annotationView.model.get("start");
                    },
                    this
                );
                this.annotationViews.splice(index, 0, view);

                if (annotationTool.isVisible(view.model)) {
                    if (index === 0) {
                        this.$list.prepend(view.$el);
                    } else {
                        this.annotationViews[index - 1].$el.after(view.$el);
                    }
                }
            },

            /**
             * Update the annotation views to reflect the current selection
             * @alias module:views-list.List#renderSelection
             * @param {Annotation?} selection the currently selected annotation
             * @param {Annotation?} previousSelection the previously selected annotation
             * @param {any} hint a hint about where the event came from
             */
            renderSelection: function (selection, previousSelection, hint) {
                if (previousSelection) {
                    var oldView = this.getViewFromAnnotation(previousSelection.id);
                    // If the annotation got deleted, we probably already removed the view
                    if (oldView) {
                        oldView.$el.removeClass("selected");
                    }
                }
                if (selection) {
                    var newView = this.getViewFromAnnotation(selection.id).$el;
                    newView.addClass("selected");

                    if (hint !== "list") {
                        this.scrollIntoView(newView, newView);
                    }
                }
            },

            /**
             * Update the annotation views to reflect the currently active annotations
             * @alias module:views-list.List#renderActive
             * @param {Array<Annotation>} selection the currently active annotations
             * @param {Array<Annotation>} previousSelection the previously active annotations
             */
            renderActive: function (currentAnnotations, previousAnnotations) {
                var selection = annotationTool.getSelection();
                var refocusSelection = selection && this.autoExpand;
                if (refocusSelection) {
                    var selectionView = this.getViewFromAnnotation(selection.id).$el;
                    var selectionOffset = this.getOffset(selectionView);
                }

                _.each(previousAnnotations, function (annotation) {
                    var view = this.getViewFromAnnotation(annotation.id);
                    // The annotation might have been on a track that is now hidden,
                    // in which case we don't have a view for it anymore
                    if (!view) return;
                    view.$el.removeClass("active");
                    if (this.autoExpand) {
                        view.collapse(true);
                    }
                }, this);
                var firstView, lastView;
                _.each(currentAnnotations, function (annotation) {
                    var view = this.getViewFromAnnotation(annotation.id);

                    if (this.autoExpand) {
                        view.expand(true);
                    }

                    view = view.$el;

                    view.addClass("active");

                    if (!refocusSelection) {
                        if (!firstView || view.offset().top < firstView.offset().top) {
                            firstView = view;
                        }
                        if (!lastView || view.offset().top > lastView.offset().top) {
                            lastView = view;
                        }
                    }
                }, this);

                if (refocusSelection) {
                    this.scrollableArea.scrollTop(
                        this.getOffset(selectionView) -
                            selectionOffset +
                            this.scrollableArea.scrollTop()
                    );
                } else if (!selection && firstView) {
                    this.scrollIntoView(firstView, lastView);
                }
            },

            /**
             * Scroll the list in such a way that both <code>firstView</code>
             * and <code>lastView</code> are visible, and so that the area between them
             * is roughly centered within the view.
             * However, don't scroll past the top of <code>firstView</code>
             * while doing so
             * @alias module:views-list.List#scrollIntoView
             * @param {$} firstView the top-most view you want to see
             * @param {$} lastView the bottom-most view that should be visible
             */
            scrollIntoView: function (firstView, lastView) {
                this.scrollableArea.scrollTop(
                    this.getOffset(firstView) -
                        Math.max(
                            0,
                            this.scrollableArea.height() -
                                lastView.offset().top -
                                lastView.height() +
                                firstView.offset().top
                        ) / 2
                );
            },

            /**
             * @alias module:views-list.List#getOffset
             * @param {$} view an element inside the scrollable area
             * @return {Number} the offset of the given view within the scrollable area
             */
            getOffset: function (view) {
                return view.offset().top -
                    this.scrollableArea.offset().top +
                    this.scrollableArea.scrollTop();
            },

            /**
             * Get the view representing the given annotation
             * @alias module:views-list.List#getViewFromAnnotation
             * @param {String} id The target annotation id
             * @return {ListAnnotation} The view representing the annotation
             */
            getViewFromAnnotation: function (id) {
                return this.annotationViews[
                    this.getViewIndexFromAnnotation(id)
                ];
            },

            /**
             * Get the index of the view representing the given annotation
             * in the {@link annotationViews} list.
             * @alias module:views-list.List#getViewFromAnnotation
             * @param {String} id The target annotation id
             * @return {ListAnnotation} The view representing the annotation
             */
            getViewIndexFromAnnotation: function (id) {
                return _.findIndex(this.annotationViews, function (view) {
                    return view.model.id === id;
                });
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
             * Display the list
             * @alias module:views-list.List#updateVisibility
             */
            updateVisibility: function () {
                _.each(this.annotationViews, function (annView) {
                    annView.$el.detach();
                });

                this.$list.empty();

                _.each(this.annotationViews, function (annView) {
                    if (annotationTool.isVisible(annView.model)) {
                        this.$list.append(annView.$el);
                    }
                }, this);

                return this;
            },

            /**
             * Remove all the child annotation views
             * @alias module:views-list.List#removeAnnotationViews
             */
            removeAnnotationViews: function () {
                _.invoke(this.annotationViews, "remove");
                this.annotationViews = [];
            },


            /** @override */
            remove: function () {
                this.removeAnnotationViews();
                Backbone.View.prototype.remove.apply(this, arguments);
            }
        });

        return List;
    });
