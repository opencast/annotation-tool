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
 * A module representing an annotations collection
 * @module collections-annotations
 * @requires jQuery
 * @requires underscore
 * @requires models-annotation
 * @requires backbone
 */
define(["jquery",
        "underscore",
        "models/annotation",
        "backbone",
        "access"],

    function ($, _, Annotation, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-annotations
         * @alias module:collections-annotations.Annotations
         */
        var Annotations = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-annotations.Annotations#initialize
             */
            model: Annotation,

            /**
             * constructor
             * @alias module:collections-annotations.Annotations#initialize
             */
            initialize: function (models, track) {
                _.bindAll(this, "updateAccess", "setAccess");

                /**
                 * Access value for all the annotations in the collection
                 * @alias module:collections-annotations.Annotations#access
                 * @type {integer}
                 */
                this.access = undefined;

                if (!_.isUndefined(track)) {
                    this.track = track;
                    track.bind("change:access", this.updateAccess, this);
                    this.updateAccess(track);
                }

                if (!_.isUndefined(models) && _.isArray(models) && models.length > 0 && !(models[0] instanceof Annotation)) {
                    _.each(models, function (annotation) {
                        this.create(annotation);
                    }, this);
                }
            },

            /**
             * Get the url for this collection
             * @alias module:collections-annotations.Annotations#url
             * @return {String} The url of this collection
             */
            url: function () {
                return _.result(this.track, "url") + "/annotations";
            },

            /**
             * Listener on track acess changes, keep the annotations access value up to date.
             * @alias module:collections-annotations.Annotations#updateAccess
             * @param  {object} [track] The track containing the annotations
             */
            updateAccess: function (track) {
                var newAccess = (_.isUndefined(track)) ? this.track.get("access") : track.get("access");
                if (this.access !== newAccess) {
                    this.access = newAccess;
                    this.each(this.setAccess, this);
                }
            },

            /**
             * Set access for the model
             * @alias module:collections-annotations.Annotations#setAccess
             * @param {model} model The model to update
             */
            setAccess: function (model) {
                if (!_.isUndefined(model.attributes)) {
                    model.set({ access: this.access }, { silent: true });
                } else {
                    model.access = this.access;
                }
            },

            /**
             * Parse the given data
             * @alias module:collections-annotations.Annotations#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the annotations
             */
            parse: function (data) {
                if (data.annotations && _.isArray(data.annotations)) {
                    _.each(data.annotations, this.setAccess, this);
                    return data.annotations;
                } else if (_.isArray(data)) {
                    _.each(data, this.setAccess, this);
                    return data;
                } else {
                    return null;
                }
            }
        });

        return Annotations;
    }
);
