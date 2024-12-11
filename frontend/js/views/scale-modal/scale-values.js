/**
 *  Copyright 2021, elan e.V., Germany
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

define([
    "backbone",
    "views/scale-modal/scale-value",
    "templates/scale-modal/scale-values"
], function (
    Backbone,
    ScaleValueView,
    template
) {
    "use strict";

    var ScaleValuesView = Backbone.View.extend({
        initialize: function (options) {
            this.collection = options.collection;

            this.$el.html(this.template());

            this.collection.each(function (scaleValue) {
                this.$el.find("tbody").append(
                    createScaleValueView.call(this, scaleValue).el
                );
            }, this);
        },

        template: template
    });

    function createScaleValueView(scaleValue) {
        var scaleValueView = new ScaleValueView({ model: scaleValue });

        this.listenTo(scaleValueView, "add", function () {
            var index = this.collection.indexOf(scaleValue);

            this.collection.add({}, { at: index + 1 });
            scaleValueView.$el.after(
                createScaleValueView.call(this, this.collection.at(
                    index + 1
                )).el
            );
        });

        this.listenTo(scaleValueView, "remove", function () {
            if (this.collection.length > 1) {
                this.collection.remove(scaleValue.cid);
                scaleValueView.remove();
            } else {
                scaleValue.unset("name");
                scaleValue.unset("value");
                scaleValueView.render();
            }
        });

        this.listenTo(scaleValueView, "move-up", function () {
            var $scaleValueView = scaleValueView.$el;
            $scaleValueView.insertBefore($scaleValueView.prev());

            var index = this.collection.indexOf(scaleValue);
            this.collection.remove(scaleValue.cid);
            this.collection.add(scaleValue, { at: index - 1 });
        });

        this.listenTo(scaleValueView, "move-down", function () {
            var $scaleValueView = scaleValueView.$el;
            $scaleValueView.insertAfter($scaleValueView.next());

            var index = this.collection.indexOf(scaleValue);
            this.collection.remove(scaleValue.cid);
            this.collection.add(scaleValue, { at: index + 1 });
        });

        return scaleValueView;
    }

    return ScaleValuesView;
});
