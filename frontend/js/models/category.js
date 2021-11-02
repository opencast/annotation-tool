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
 * A module representing the category model
 * @module models-category
 */
define(
    [
        "util",
        "underscore",
        "collections/labels",
        "models/resource"
    ],
    function (
        util,
        _,
        Labels,
        Resource
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-category
         */
        var Category = Resource.extend({
            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /**
             * Default model values
             */
            defaults: function () {
                // TODO All `defaults` now need to do that, which sucks ...
                // TODO The `|| {}` stuff
                // TODO It sucks that we have defaults here and in `initialize`
                //   basically for `settings`
                return _.extend(util.result(Resource.prototype.defaults || {}).apply(this), {
                    visible: true,
                    labels: new Labels([], { category: this })
                });
            },

            sync: function (method, model, options) {

                // If the model is referencing another model, sync to the other model
                if (model.get("series_category_id")) {
                    model.set("id", model.get("series_category_id"));
                } else if (model.tmpSeriesCategoryId) {
                    model.set("id", model.tmpSeriesCategoryId);
                }

                return Resource.prototype.sync.call(this, method, model, options);
            },

            /**
             * Constructor
             */
            initialize: function () {

                _.bindAll(this, "toggleVisibility", "toExportJSON");

                Resource.prototype.initialize.apply(this, arguments);

                this.set("settings", _.extend({
                    hasScale: true,
                    // TODO Make this dynamic?
                    color: "#008080",
                    createdAsMine: !this.isPublic()
                }, this.get("settings")));
            },

            /**
             * (Re-)Fetch the labels once our ID changes.
             */
            fetchChildren: function () {
                this.attributes.labels.fetch({ async: false });
            },

            /**
             * Validate the attribute list passed to the model
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.apply(this, arguments);
                if (invalidResource) return invalidResource;

                // TODO Make a `blank` helper?
                // TODO Use `trim` instead?
                if (!attr.name || /^\s*$/.test(attr.name)) {
                    return "\"name\" must not be blank";
                }

                if (attr.description && !_.isString(attr.description)) {
                    return "\"description\" attribute must be a string";
                }

                return undefined;
            },

            /**
             * Show/hide the category in the UI
             */
            toggleVisibility: function () {
                this.set("visible", !this.get("visible"));
            },

            /**
             * Change category color
             * @param  {string} color the new color
             */
            setColor: function (color) {
                var settings = _.clone(this.get("settings"));
                settings.color = color;

                this.set("settings", settings);
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @param {Object} options The options to control the "JSONification" of this collection
             * @return {JSON} JSON representation of the instance
             */
            toJSON: function (options) {
                var json = Resource.prototype.toJSON.call(this, options);

                delete json.labels;

                if (this.attributes.scale) {
                    json.scale_id = this.attributes.scale.id;
                    delete json.scale;
                }

                return json;
            },

            /**
             * Prepare the model as JSON to export and return it
             * @param {boolean} withScales Define if the scale has to be included
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function (withScale) {
                var json = {
                    name: this.attributes.name,
                    labels: this.attributes.labels.map(function (label) {
                        return label.toExportJSON();
                    })
                };

                if (this.attributes.description) {
                    json.description = this.attributes.description;
                }

                if (this.attributes.scale_id) {
                    json.scale_id = this.attributes.scale_id;
                }

                if (this.attributes.settings) {
                    json.settings = this.attributes.settings;
                }

                if (!_.isUndefined(withScale) && withScale) {
                    if (this.attributes.scale_id) {
                        json.scale = annotationTool.video.get("scales").get(this.attributes.scale_id).toExportJSON();
                    } else if (this.attributes.scale) {
                        json.scale = annotationTool.video.get("scales").get(this.attributes.scale.get("id")).toExportJSON();
                    }
                }

                return json;
            }
        });
        return Category;
    }
);
