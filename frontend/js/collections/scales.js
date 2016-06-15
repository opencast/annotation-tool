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
 * A module representing a scales collection
 * @module collections-scales
 * @requires jQuery
 * @requires models-scale
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/scale",
        "backbone",
        "localstorage"],

    function ($, Scale, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-scales
         * @alias module:collections-scales.Scales
         */
        var Scales = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-scales.Scales#initialize
             */
            model: Scale,

            /**
             * Localstorage container for the collection
             * @alias module:collections-scales.Scales#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Scales"),

            /**
             * constructor
             * @alias module:collections-scales.Scales#initialize
             */
            initialize: function (models, video) {
                _.bindAll(this, "setUrl", "addCopyFromTemplate", "toExportJSON");
                this.setUrl(video);
            },

            /**
             * Parse the given data
             * @alias module:collections-scales.Scales#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the scales
             */
            parse: function (data) {
                if (data.scales && _.isArray(data.scales)) {
                    return data.scales;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            /**
             * Define the url from the collection with the given video
             * @alias module:collections-scales.Scales#setUrl
             * @param {Video} Video containing the scales
             */
            setUrl: function (video) {
                if (!video || !video.collection) { // If a template
                    this.url = window.annotationsTool.restEndpointsUrl + "/scales";
                    this.isTemplate = true;
                } else {  // If not a template, we add video url
                    this.url = video.url() + "/scales";
                    this.isTemplate = false;

                    if (annotationsTool.localStorage) {
                        this.localStorage = new Backbone.LocalStorage(this.url);
                    }
                }

                this.each(function (scale) {
                    scale.setUrl();
                });
            },

            /**
             * Get the collection as array with the model in JSON, ready to be exported
             * @alias module:collections-scales.Scales#toExportJSON
             * @return {array} Array of json models
             */
            toExportJSON: function () {
                var scalesForExport = [];

                this.each(function (scale) {
                    scalesForExport.push(scale.toExportJSON());
                });

                return scalesForExport;
            },

            /**
             * Add a copy from the given template to this collection
             * @alias module:collections-scales.Scales#addCopyFromTemplate
             * @param {Scale} element template to copy
             * @return {Scale} A copy of the given scale
             */
            addCopyFromTemplate: function (element) {
                // Test if the given scale is really a template
                if (!this.isTemplate && !_.isArray(element) && element.id) {
                    // Copy the element and remove useless parameters
                    var copyJSON = element.toJSON();
                    delete copyJSON.id;
                    delete copyJSON.created_at;
                    delete copyJSON.created_by;
                    delete copyJSON.updated_at;
                    delete copyJSON.updated_by;
                    delete copyJSON.deleted_by;
                    delete copyJSON.deleted_at;
                    delete copyJSON.labels;

                    // add the copy url parameter for the backend
                    copyJSON.copyUrl = "?scale_id=" + element.id;
                    return this.create(copyJSON);
                }
                return null;
            }
        });
        return Scales;
    }
);