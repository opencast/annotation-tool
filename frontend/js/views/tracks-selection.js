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
 * @requires jQuery
 * @requires underscore
 * @requires Backbone
 * @requires templates/tracks-selection-modal.tmpl
 * @requires ROLES
 * @requires hanldebars
 */
define(["jquery",
        "underscore",
        "backbone",
        "templates/tracks-selection-modal"],

    function ($, _, Backbone, TracksSelectionTmpl) {

        "use strict";

        var selectAllCheckbox;
        var userCheckboxes;
        var checkboxGroupForUser;
        var checkboxGroupForTrack;

        function aggregateCheckboxes(source, target) {
            var checked = _.filter(source, function (checkbox) { return checkbox.checked; });
            var difference = source.length - checked.length;
            target.checked = difference === 0;
            target.indeterminate = difference > 0 && checked.length !== 0;
        }

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-tracks-selection
         * @alias Alert
         */
        var TracksSelectionView = Backbone.View.extend({

            tag: $("#tracks-selection"),

            /**
             * Template
             * @alias module:views-tracks-selection.Alert#alertTemplate
             * @type {HandlebarsTemplate}
             */
            template: TracksSelectionTmpl,

            /**
             * Events to handle
             * @alias module:views-tracks-selection.Alert#events
             * @type {object}
             */
            events: {
                "click #cancel-selection"  : "cancel",
                "click #confirm-selection" : "confirm",
                "change .track-checkbox"   : "selectTrack",
                "change .user-checkbox"    : "selectUser",
                "change #select-all"       : "selectAll",
                "keyup #search-track"      : "search",
                "click button.search-only" : "clear"
            },

            /**
             * Constructor
             * @alias module:views-tracks-selection.Alert#initialize
             */
            initialize: function () {
                _.bindAll(this,
                          "show",
                          "hide",
                          "search");

                this.tracks = annotationsTool.getTracks();
            },

            /**
             * Display the modal with the given message as the given alert type
             * @alias module:views-tracks-selection.Alert#show
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
                                tracks: _.invoke(tracks, "toJSON"),
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
                userCheckboxes = this.$el.find(".user-checkbox");
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

                this.$el.modal({ show: true, backdrop: false, keyboard: false });
            },

            /**
             * Hide the modal
             * @alias module:views-tracks-selection.Alert#hide
             */
            hide: function () {
                this.$el.modal("hide");
            },

            /**
             * Clear the search field
             * @alias module:views-tracks-selection.Alert#clear
             */
            clear: function () {
                this.$el.find("#search-track").val("");
                this.search();
            },

            /**
             * Cancel the track selection
             * @alias module:views-tracks-selection.Alert#cancel
             */
            cancel: function () {
                this.hide();
            },

            /**
             * Confirm the track selection
             * @alias module:views-tracks-selection.Alert#confirm
             */
            confirm: function () {
                var selection = this.$el.find("ul li :checked"),
                    selectedIds = [];

                _.each(selection, function (el) {
                    selectedIds.push(el.value);
                }, this);

                this.tracks.showTracksByCreators(selectedIds);

                this.hide();
            },

            /**
             * Mark the target track as selected
             * @alias module:views-tracks-selection.Alert#selectTrack
             */
            selectTrack: function (event) {
                var trackID = event.target.value;
                var checkboxGroup = checkboxGroupForTrack[trackID];
                aggregateCheckboxes(checkboxGroup.trackCheckboxes, checkboxGroup.userCheckbox);
                aggregateCheckboxes(userCheckboxes, selectAllCheckbox);
            },

            /**
             * Mark the target user as selected
             * @alias module:views-tracks-selection.Alert#selectUser
             */
            selectUser: function (event) {
                var userID = event.target.value;
                checkboxGroupForUser[userID].trackCheckboxes.prop("checked", event.target.checked);
                aggregateCheckboxes(userCheckboxes, selectAllCheckbox);
            },

            /**
             * Mark all the users selected or unselected
             * @alias module:views-tracks-selection.Alert#selectAll
             */
            selectAll: function (event) {
                _.each(checkboxGroupForUser, function (checkboxGroup) {
                    checkboxGroup.userCheckbox.checked = event.target.checked;
                    checkboxGroup.trackCheckboxes.prop("checked", event.target.checked);
                });
            },

            /**
             * Search for users with the given chars in the search input
             * @alias module:views-tracks-selection.Alert#search
             */
            search: function (event) {
                var text = "";

                if (!_.isUndefined(event)) {
                    text = event.target.value;
                }

                this.$el.find(".list-group-item").hide();

                if (!_.isUndefined(text) && text !== "") {
                    this.$el.find("#modal-track-selection").addClass("search-mode");
                    this.$el.find(".list-group-item:contains(" + text.toUpperCase() + ")").show();
                } else {
                    this.$el.find("#modal-track-selection").removeClass("search-mode");
                    this.$el.find(".list-group-item").show();
                }
            }
        });

        return TracksSelectionView;
    }
);
