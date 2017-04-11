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
 * @requires Backbone
 * @requires templates/tracks-selection-modal.tmpl
 * @requires ROLES
 * @requires hanldebars
 */
define(["jquery",
        "backbone",
        "templates/tracks-selection-modal"],

    function ($, Backbone, TracksSelectionTmpl) {

        "use strict";

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
                "click #cancel-selection" : "cancel",
                "click #confirm-selection": "confirm",
                "click li"                : "select",
                "click span input"        : "selectAll",
                "keyup #search-track"     : "search",
                "click button.search-only": "clear"
            },

            /**
             * Constructor
             * @alias module:views-tracks-selection.Alert#initialize
             */
            initialize: function () {
                _.bindAll(this,
                          "show",
                          "hide",
                          "cancel",
                          "clear",
                          "confirm",
                          "search",
                          "select",
                          "selectAll");

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
                this.$el.append(this.template({
                    users: this.tracks.getAllCreators()
                }));
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
             * Mark the target user as selected
             * @alias module:views-tracks-selection.Alert#select
             */
            select: function (event) {
                var $el = $(event.target).find("input");

                $el.attr("checked", _.isUndefined($el.attr("checked")));
            },

            /**
             * Mark all the users selected or unselected
             * @alias module:views-tracks-selection.Alert#selectAll
             */
            selectAll: function (event) {
                var checked = !_.isUndefined($(event.target).attr("checked"));
                this.$el.find("ul li input").attr("checked", checked);
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
