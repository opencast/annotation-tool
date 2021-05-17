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
 * A module representing the tracks selection modal
 * @module views-tracks-selection
 */
define(
    [
        "jquery",
        "underscore",
        "backbone",
        "sortable",
        "roles",
        "access",
        "templates/tracks-selection-modal"
    ],
    function (
        $,
        _,
        Backbone,
        Sortable,
        ROLES,
        ACCESS,
        TracksSelectionTmpl
    ) {
        "use strict";

        var selectAllCheckbox;
        var userCheckboxes;
        var trackCheckboxes;
        var checkboxGroupForUser;
        var checkboxGroupForTrack;

        function aggregateCheckboxes(source, target) {
            target.checked = true;
            target.indeterminate = false;
            _.each(source, function (checkbox) {
                if (!checkbox.checked) {
                    target.checked = false;
                }
                if (checkbox.checked || checkbox.indeterminate) {
                    target.indeterminate = true;
                }
            });
            if (target.checked) target.indeterminate = false;
        }

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-tracks-selection
         */
        var TracksSelectionView = Backbone.View.extend({

            tag: $("#tracks-selection"),

            /**
             * Template
             * @type {HandlebarsTemplate}
             */
            template: TracksSelectionTmpl,

            /**
             * Events to handle
             * @type {object}
             */
            events: {
                "click #cancel-selection": "cancel",
                "click #confirm-selection": "confirm",
                "change .track-checkbox": "selectTrack",
                "change .user-checkbox": "selectUser",
                "change #select-all": "selectAll",
                "change .list-group input, #select-all": "updateSelection",
                "focus .track-order-item": "selectOrderItem",
                "click #move-up": "moveUp",
                "click #move-down": "moveDown",
                "input #search-track": "search",
                "click #clear-search": "clear"
            },

            /**
             * Constructor
             */
            initialize: function () {
                _.bindAll(
                    this,
                    "show",
                    "hide",
                    "search"
                );

                this.tracks = annotationTool.getTracks();
            },

            /**
             * Display the modal with the given message as the given alert type
             * @param  {String} message The message to display
             * @param  {String | Object} type The name of the alert type or the type object itself, see {@link module:views-tracks-selection.Alert#TYPES}
             */
            show: function () {
                this.$el.empty();

                // Get all users owning public tracks together with those tracks themselves.
                // Note that `this.tracks` already only contains public tracks!
                var usersWithPublicTracks = this.tracks.chain()
                        .groupBy(function (track) { return track.get("created_by"); })
                        .map(function (tracks, created_by) {
                            return {
                                id: created_by,
                                nickname: tracks[0].get("created_by_nickname"),
                                tracks: _.map(tracks, _.compose(
                                    _.clone,
                                    _.property("attributes")
                                )),
                                visible: _.every(tracks, function (track) { return track.get("visible"); })
                            };
                        }).value();

                this.$el.append(this.template({
                    users: usersWithPublicTracks
                }));

                // Get a handle on all the necessary DOM elements that we need
                // for the event handlers and in the confirmation phase.
                selectAllCheckbox = this.$("#select-all")[0];
                checkboxGroupForUser = {};
                checkboxGroupForTrack = {};
                userCheckboxes = this.$(".user-checkbox");
                trackCheckboxes = this.$(".track-checkbox");
                _.each(userCheckboxes, function (userCheckbox) {
                    var userID = userCheckbox.value;
                    var trackCheckboxes = $(userCheckbox).closest(".user-track-group").find(".track-checkbox");
                    var checkboxGroup = {
                        userCheckbox: userCheckbox,
                        trackCheckboxes: trackCheckboxes
                    };
                    _.each(trackCheckboxes, function (trackCheckbox) {
                        var trackID = trackCheckbox.value;
                        checkboxGroupForTrack[trackID] = checkboxGroup;
                    });
                    checkboxGroupForUser[userID] = checkboxGroup;
                    aggregateCheckboxes(trackCheckboxes, userCheckbox);
                });
                aggregateCheckboxes(userCheckboxes, selectAllCheckbox);

                this.delegateEvents();

                this.trackSelection = this.$el.find("#track-selection");
                this.order = annotationTool.tracksOrder;
                this.renderSelection();

                this.$el.modal({ show: true, backdrop: false, keyboard: false });
            },

            /**
             * Hide the modal
             */
            hide: function () {
                this.$el.modal("hide");
            },

            /**
             * Clear the search field
             */
            clear: function () {
                this.$("#search-track").val("");
                this.search();
            },

            /**
             * Cancel the track selection
             */
            cancel: function () {
                this.hide();
            },

            /**
             * Confirm the track selection
             */
            confirm: function () {
                this.tracks.showTracks(
                    trackCheckboxes.filter(":checked").map(_.bind(function (index, checkbox) {
                        return this.tracks.get(checkbox.value);
                    }, this))
                );

                annotationTool.orderTracks(this.sortableTrackSelection.toArray());

                this.updateCategories();

                this.updateCategoriesForTheAllTab();

                this.hide();
            },

            /**
             * Displays Categories Tabs for currently visible tracks
             */
            updateCategories: function() {
                var categories = annotationTool.video.get("categories");

                _.each(this.tracks.getVisibleTracks(), function(visibleTrack) {
                    var trackUserId = visibleTrack.get("created_by");

                    // Create new category tab for user ids that or not ours or already present
                    if(trackUserId !== annotationTool.user.get("id") &&
                        !annotationTool.views.main.views.annotate.categoriesTabs.hasOwnProperty(trackUserId)) {
                        // Need to pass all categories here, else code ceases to work
                        annotationTool.views.main.views.annotate.addTab(categories, {
                            id        : trackUserId,
                            name      : visibleTrack.get("created_by_nickname"),
                            filter    : function (category) {
                                // Does the current user have permission to see the category?
                                return ((annotationTool.user.get("role") === ROLES.ADMINISTRATOR && (category.get("access") === ACCESS.PUBLIC
                                        || category.get("access") === ACCESS.SHARED_WITH_ADMIN))
                                || (annotationTool.user.get("role") === ROLES.USER && (category.get("access")) === ACCESS.PUBLIC))
                                // Is it from the mine category?
                                && category.get("settings").createdAsMine
                                // Was the category created by the user of the tab?
                                && category.get("created_by") === trackUserId;
                            },
                            roles     : [],
                            attributes: { access: ACCESS.PRIVATE },
                        });
                    }
                }, this);

                // Try to remove respective category tab of every non-visible track
                _.each(_.difference(this.tracks.models, this.tracks.getVisibleTracks()), function(notVisibleTrack) {
                    annotationTool.views.main.views.annotate.removeTab(notVisibleTrack.get("created_by"));
                }, this);
            },

            /**
             * Add/Remove views for createdAsMine categories in the all tab
             */
            updateCategoriesForTheAllTab: function() {
              var allTab = annotationTool.views.main.views.annotate.categoriesTabs["all"];

              var categories = annotationTool.video.get("categories");
              var t = this.tracks.getVisibleTracks();
              _.each(this.tracks.getVisibleTracks(), function(visibleTrack) {
                  var trackUserId = visibleTrack.get("created_by");

                  // Create new category tab for user ids that or not ours or already present
                  if(trackUserId !== annotationTool.user.get("id")) {
                      // Need to pass all categories here, else code ceases to work
                      annotationTool.views.main.views.annotate.categoriesTabs["all"].addCategories(categories, function(category) {
                        return ((annotationTool.user.get("role") === ROLES.ADMINISTRATOR && (category.get("access") === ACCESS.PUBLIC
                        || category.get("access") === ACCESS.SHARED_WITH_ADMIN))
                        || (annotationTool.user.get("role") === ROLES.USER && (category.get("access")) === ACCESS.PUBLIC))
                        // Is it from the mine category?
                        && category.get("settings").createdAsMine
                        // Was the category created by the user of the tab?
                        && category.get("created_by") === trackUserId
                        // Is the category already present?
                        && !annotationTool.views.main.views.annotate.categoriesTabs["all"].categoryViews.some(
                            function (e) {
                                return e.model.id === category.id;
                            }
                        );
                      });
                  }
              }, this);

              _.each(_.difference(this.tracks.models, this.tracks.getVisibleTracks()), function(notVisibleTrack) {
                _.each(annotationTool.views.main.views.annotate.categoriesTabs["all"].categories.models, function(category) {
                  if (category.get("created_by") === notVisibleTrack.get("created_by")
                      && category.get("settings").createdAsMine
                      && category.get("createy_by") !== annotationTool.user.get("id")) {
                    annotationTool.views.main.views.annotate.categoriesTabs["all"].removeOne(category);
                  }
                }, this);
              }, this);
            },

            /**
             * Mark the target track as selected
             */
            selectTrack: function (event) {
                var trackID = event.target.value;
                var checkboxGroup = checkboxGroupForTrack[trackID];
                aggregateCheckboxes(checkboxGroup.trackCheckboxes, checkboxGroup.userCheckbox);
                aggregateCheckboxes(userCheckboxes, selectAllCheckbox);
            },

            /**
             * Mark the target user as selected
             */
            selectUser: function (event) {
                var userID = event.target.value;
                checkboxGroupForUser[userID].trackCheckboxes.prop("checked", event.target.checked);
                aggregateCheckboxes(userCheckboxes, selectAllCheckbox);
            },

            /**
             * Mark all the users selected or unselected
             */
            selectAll: function (event) {
                _.each(checkboxGroupForUser, function (checkboxGroup) {
                    checkboxGroup.userCheckbox.indeterminate = false;
                    checkboxGroup.userCheckbox.checked = event.target.checked;
                    checkboxGroup.trackCheckboxes.prop("checked", event.target.checked);
                });
            },

            renderSelection: function () {
                this.trackSelection.append.apply(this.trackSelection,
                    trackCheckboxes.filter(":checked").map(_.bind(function (index, checkbox) {
                        var track = this.tracks.get(checkbox.value);
                        var listItem = $("<li></li>");
                        listItem.attr("tabindex", 0);
                        listItem.addClass("track-order-item");
                        listItem.toggleClass("selected", this.selected === track.id);
                        listItem.attr("data-id", track.id);
                        listItem.html(track.get("name") + " (" + track.get("created_by_nickname") + ")");
                        return listItem;
                    }, this))
                );
                this.sortableTrackSelection = new Sortable(this.trackSelection[0]);
                this.sortableTrackSelection.sort(this.order);
            },

            /**
             * Update the list of selected tracks based on the current values of the track checkboxes.
             */
            updateSelection: function () {
                this.order = _.sortBy(
                    this.tracks.chain()
                        .filter(function (track) {
                            return this.$el.find(".track-checkbox[value=\"" + track.id + "\"]").attr("checked");
                        }, this)
                        .map("id")
                        .value(),
                    /*
                    this.$el.find(".track-checkbox:checked").map(function (index, checkbox) {
                        return checkbox.value;
                    }),
                    */
                    function (trackId) {
                        return _.indexOf(this.order, trackId);
                    },
                    this
                );
                this.sortableTrackSelection.destroy();
                this.trackSelection.empty();
                this.renderSelection();
            },

            /**
             * Mark one of the order items as selected.
             * The selected item is the one manipulated by other ordering related functions.
             */
            selectOrderItem: function (event) {
                $("#track-selection .selected").toggleClass("selected");
                var selectedElement = $(event.target);
                this.selected = selectedElement.data("id");
                selectedElement.toggleClass("selected");
            },

            /**
             * Move the currently selected track up in the ordering.
             */
            moveUp: function () {
                if (!this.selected) return;

                var selectedPosition = _.indexOf(this.order, this.selected);
                if (selectedPosition === 0) return;

                this.order[selectedPosition] = this.order[selectedPosition - 1];
                this.order[selectedPosition - 1] = this.selected;

                this.sortableTrackSelection.sort(this.order);
            },

            /**
             * Move the currently selected track up in the ordering.
             */
            moveDown: function () {
                if (!this.selected) return;

                var selectedPosition = _.indexOf(this.order, this.selected);
                if (selectedPosition === this.order.length - 1) return;

                this.order[selectedPosition] = this.order[selectedPosition + 1];
                this.order[selectedPosition + 1] = this.selected;

                this.sortableTrackSelection.sort(this.order);
            },

            /**
             * Search for users with the given chars in the search input
             */
            search: function (event) {
                var text = "";

                if (!_.isUndefined(event)) {
                    text = event.target.value;
                }

                this.$(".list-group-item").hide();

                if (!_.isUndefined(text) && text !== "") {
                    this.$("#modal-track-selection").addClass("search-mode");
                    this.$(".list-group-item:contains(" + text.toUpperCase() + ")").show();
                } else {
                    this.$("#modal-track-selection").removeClass("search-mode");
                    this.$(".list-group-item").show();
                }
            }
        });

        return TracksSelectionView;
    }
);
