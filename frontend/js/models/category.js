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
        "collections/labels",
        "models/resource"
    ],
    function (
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

            /** @override */
            keepDeleted: true,

            /**
             * Default model values
             */
            defaults: function () {
                return _.extend(Resource.prototype.defaults, {
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
             *
             * @return {JSON} JSON representation of the model for export
             */
            toExportJSON: function () {
                var json = {
                    name: this.attributes.name,
                    labels: this.attributes.labels
                        .filter(function (label) {
                            return !label.get("deleted_at");
                        })
                        .map(function (label) {
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

                return json;
            }
        });
        return Category;
    }
);
