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
 * A module representing the loop modal
 * @module views-loop
 */
define([
    "util",
    "underscore",
    "jquery",
    "i18next",
    "player-adapter",
    "backbone",
    "templates/loop-control",
    "slider",
    "handlebarsHelpers"
], function (
    util,
    _,
    $,
    i18next,
    PlayerAdapter,
    Backbone,
    loopTemplate
) { "use strict";

var DEFAULT_LOOP_COUNT = 10;

var MINIMAL_LOOP = 5;

/**
 * @constructor
 * @see {@link http://www.backbonejs.org/#View}
 * @augments module:Backbone.View
 * @memberOf module:views-loop
 * @alias Loop
 */
var LoopView = Backbone.View.extend({
    /**
     * Constructor
     * @alias module:views-loop.Loop#constructor
     */
    constructor: function (options) {

        var playerAdapter = options.playerAdapter;
        var duration = playerAdapter.getDuration();
        var timeline = options.timeline;

        var enabled = false;
        var loopLength = Math.max(
            MINIMAL_LOOP,
            Math.floor(duration / DEFAULT_LOOP_COUNT)
        );
        var currentLoop = 0;

        var window;
        var lengthInput;
        var slider;
        var previousButton;
        var nextButton;

        /**
         * Constructor
         * @alias module:views-loop.Loop#initialize
         */
        this.initialize = function () {

            this.$el.html(loopTemplate({
                enabled: enabled,
                length: loopLength,
                atFirstLoop: currentLoop === 0,
                atLastLoop: currentLoop === numberOfLoops - 1
            }));
            window = this.$el.find("#loop");
            lengthInput = this.$el.find("#loop-length");
            previousButton = this.$el.find(".previous");
            nextButton = this.$el.find(".next");
            slider = this.$el.find("#slider");

            slider.slider({
                min: MINIMAL_LOOP,
                max: Math.floor(duration),
                step: 1,
                formater: function (value) {
                    return value + i18next.t("loop controller.seconds");
                }
            }).on("slideStop", function (event) {
                setLength(event.value);
            });
        };

        var numberOfLoops = calcNumberOfLoops();

        function setLength(newLength) {
            loopLength = newLength;
            numberOfLoops = calcNumberOfLoops();

            slider.slider("setValue", loopLength);
            lengthInput.val(loopLength);

            cleanupLoops();
            setupLoops();
        }

        function calcNumberOfLoops() {
            return Math.ceil(duration / loopLength);
        }

        function cleanupLoops() {
            timeline.items.remove(_.map(loops, "id"));
        }

        var loops;
        function setupLoops() {
            loops = Array(numberOfLoops);
            var start = 0;
            var end = loopLength;
            for (var loop = 0; loop < numberOfLoops; ++loop) {
                loops[loop] = {
                    id: "loop-" + loop,
                    start: util.dateFromSeconds(start),
                    end: util.dateFromSeconds(Math.min(end, duration)),
                    group: "loops",
                    type: "range",
                    selectable: false,
                    content: "",
                    className: "loop"
                };
                start += loopLength;
                end += loopLength;
            }
            timeline.items.add(loops);
            syncCurrentLoop();
        }

        function syncCurrentLoop() {
            currentLoop = findCurrentLoop();
            previousButton.prop("disabled", false);
            nextButton.prop("disabled", false);
            if (currentLoop === 0) {
                previousButton.prop("disabled", true);
            }
            if (currentLoop === numberOfLoops - 1) {
                nextButton.prop("disabled", true);
            }

            timeline.items.update({
                id: "loop-" + currentLoop,
                className: "loop current"
            });
        }

        function findCurrentLoop() {
            return Math.floor(playerAdapter.getCurrentTime() / loopLength);
        }

        var $playerAdapter = $(playerAdapter);
        $playerAdapter.on(PlayerAdapter.EVENTS.TIMEUPDATE + ".loop", function () {
            if (!enabled) return;
            var boundaries = loops[currentLoop];
            if (playerAdapter.getCurrentTime() >= util.secondsFromDate(boundaries.end)) {
                playerAdapter.setCurrentTime(util.secondsFromDate(boundaries.start));
            }
        });
        $playerAdapter.on(PlayerAdapter.EVENTS.ENDED + ".loop", function () {
            if (!enabled) return;
            playerAdapter.setCurrentTime(loops[currentLoop].start);
            playerAdapter.play();
        });
        $playerAdapter.on(PlayerAdapter.EVENTS.SEEKING + ".loop", function () {
            if (!enabled) return;
            resetCurrentLoop();
        });

        timeline.timeline.on("click", function (properties) {
            if ((
                properties.what !== "item"
            ) || (
                properties.group !== "loops"
            )) return;
            playerAdapter.setCurrentTime(util.secondsFromDate(
                timeline.items.get(properties.item).start
            ));
        });

        this.events = {
            "change #enable-loop": function () {
                toggle(!enabled);
            },
            // Note that we assume that these functions never get called
            // when the current loop is the first or last one.
            // This assumption is valid since we disable the corresponding buttons
            // in `setLoop` in these cases!
            "click .next": function () {
                jumpToLoop(currentLoop + 1);
            },
            "click .previous": function () {
                jumpToLoop(currentLoop - 1);
            },
            "change #loop-length": function (event) {
                var newLength = parseInt(event.target.value, 10);
                if (isNaN(newLength) || newLength <= 0 || newLength > duration) {
                    annotationTool.alertError(i18next.t("loop controller.invalid loop length"));
                    lengthInput.val(loopLength);
                    slider.slider("setValue", loopLength);
                    return;
                }
                setLength(newLength);
            },
            "change #constrain-annotations": function (event) {
                if (event.target.checked) {
                    annotationTool.annotationConstraints = currentLoopConstraints();
                } else {
                    delete annotationTool.annotationConstraints;
                }
            }
        };

        function toggle(on) {
            enabled = on;
            window.toggleClass("disabled", !on);
            timeline.groups.update({
                id: "loops",
                content: "Loops",
                className: "loop-group",
                order: -1,
                visible: on
            });
            if (on) {
                setupLoops();
            } else {
                cleanupLoops();
            }
        }

        function jumpToLoop(loop) {
            playerAdapter.setCurrentTime(util.secondsFromDate(
                loops[loop].start
            ));
        }

        function resetCurrentLoop() {
            timeline.items.update({
                id: "loop-" + currentLoop,
                className: "loop"
            });
            syncCurrentLoop();
            if (annotationTool.annotationConstraints) {
                annotationTool.annotationConstraints = currentLoopConstraints();
            }
        }

        function currentLoopConstraints() {
            var boundaries = loops[currentLoop];
            var start = util.secondsFromDate(boundaries.start);
            return {
                start: start,
                duration: util.secondsFromDate(boundaries.end) - start
            };
        }

        /**
         * Remove the loop controller from the screen
         * @alias module:views-loop.Loop#remove
         */
        this.remove = function () {
            $playerAdapter.off(".loop");
            timeline.$el.off(".loop");
            cleanupLoops();
            Backbone.View.prototype.remove.apply(this, arguments);
        };

        Backbone.View.apply(this, arguments);
    }
});
return LoopView;
});
