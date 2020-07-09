/**
 *  Copyright 2020, ELAN e.V., Germany
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
define([
    "underscore",
    "jquery",
    "i18next",
    "backbone",
    "templates/annotation-timestamp",
    "handlebarsHelpers"
], function(_, $, i18next, Backbone, template) {
    "use strict";

    return Backbone.View.extend({
        className: "questionnaire-timestamps",

        events: {
            "click i.toggle-edit": "onClickToggleEdit",

            "click .timestamp-save": "onClickSave",
            "click .timestamp-cancel": "onClickCancel",

            "keyup .start-value": "onChangeStart",
            "focusout .start-value": "onChangeStart",

            "keyup .end-value": "onChangeEnd",
            "focusout .end-value": "onChangeEnd",
        },

        initialize: function(options) {
            this.listenTo(this.model, "change:start", this.render);
            this.listenTo(this.model, "change:duration", this.render);
            this.editMode = null;
        },

        render: function() {
            var annotation;
            annotation = this.model.toJSON();
            annotation.end = annotation.start + annotation.duration;

            this.$el.html(template({
                annotation: annotation,
                editMode: this.editMode,
                endTime: annotation && (annotation.start + annotation.duration),
                startTime: annotation && annotation.start
            }));

            return this;
        },

        /**
         * Save the end time
         * @alias module:views-questionnaire.Questionnaire#onChangeEnd
         * @param  {event} event Event object
         */
        onChangeEnd: function(event) {
            var $target = $(event.currentTarget);
            var value = $target.val();
            var $controlGroup = $target.closest(".control-group");
            var $error = $controlGroup.find(".error-msg");

            $error.html("");
            $controlGroup.removeClass("error");

            if (!validateTimestamp(value)) {
                $controlGroup.addClass("error");
                return;
            }

            var newEnd = convertTimestamp(value);
            var start = this.model.get("start");
            if (annotationTool.playerAdapter.getDuration() < newEnd || start > newEnd) {
                $controlGroup.addClass("error");
                $error.html(i18next.t("validation errors.out of bounds"));
                return;
            }

            console.log("setting", { duration: Math.round(newEnd - start) });
            this.model.set({ duration: Math.round(newEnd - start) }, {silent: true});
            console.log("onChangeEnd", this.model.get("start"), this.model.get("duration"));
        },

        /**
         * Save the start time
         * @alias module:views-questionnaire.Questionnaire#onChangeStart
         * @param  {event} event Event object
         */
        onChangeStart: function(event) {
            var $target = $(event.currentTarget);
            var value = $target.val();
            var $controlGroup = $target.closest(".control-group");
            var $error = $controlGroup.find(".error-msg");

            $error.html("");
            $controlGroup.removeClass("error");

            if (!validateTimestamp(value)) {
                $controlGroup.addClass("error");
                return;
            }

            var newStart = convertTimestamp(value);
            var start = this.model.get("start");
            var duration = this.model.get("duration");
            var end = start + duration;
            if (duration > 0 && end < newStart) {
                $controlGroup.addClass("error");
                $error.html(i18next.t("validation errors.start after end"));
                return;
            }
            this.model.set({
                start: newStart,
                duration: duration ? Math.round(end - newStart) : 0
            }, {silent: true});
        },
        onClickCancel: function () {
            this.editMode = null;
            this.render();
        },
        onClickSave: function (event) {
            var $target = $(event.currentTarget);
            this.model.save();
            this.onClickCancel();
        },
        onClickToggleEdit: function (event) {
            var $target = $(event.currentTarget);
            this.editMode = $target.data().editmode;
            this.render();
        }
    });

    function validateTimestamp(timestamp) {
        return timestamp.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/);
    }

    function convertTimestamp(timestamp) {
        var tokens = timestamp.split(":");
        var seconds;
        if (tokens.length === 3) {
            seconds = parseInt(tokens[0], 10) * 3600 + parseInt(tokens[1], 10) * 60 + parseInt(tokens[2], 10);
        } else if (tokens.length === 2) {
            seconds = parseInt(tokens[0], 10) * 60 + parseInt(tokens[1], 10);
        } else {
            seconds = parseInt(tokens[0], 10);
        }

        return seconds;
    }
});
