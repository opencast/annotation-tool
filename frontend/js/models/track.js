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
 * A module representing the track model
 * @module models-track
 * @requires jQuery
 * @requires collections-annotations
 * @requires ACCESS
 * @requires backbone
 */
define(["jquery",
        "collections/annotations",
        "access",
        "backbone"],

    function ($, Annotations, ACCESS, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-track
         * @alias module:models-track.Track
         */
        var Track = Backbone.Model.extend(
            /** @lends module:models-track~Track.prototype */
            {

            /**
             * Default models value
             * @alias module:models-scalevalue.Scalevalue#defaults
             * @type {map}
             * @static
             */
            defaults: {
                access: ACCESS.PRIVATE
            },

            /**
             * Constructor
             * @alias module:models-track.Track#initialize
             * @param {Object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                _.bindAll(this,
                        "getAnnotation",
                        "fetchAnnotations");

                if (!attr || _.isUndefined(attr.name)) {
                    throw "'name' attribute is required";
                }

                // the tack is not visible at initialisation
                attr.visible = false;
                attr.annotationsLoaded = false;

                if (attr.annotations && _.isArray(attr.annotations)) {
                    this.set({annotations: new Annotations(attr.annotations, this)});
                } else {
                    this.set({annotations: new Annotations([], this)});
                }

                // If localStorage used, we have to save the video at each change on the children
                if (window.annotationsTool.localStorage) {
                    if (!attr.created_by) {
                        attr.created_by = annotationsTool.user.get("id");
                        attr.created_by_nickname = annotationsTool.user.get("nickname");
                    }
                }

                delete attr.annotations;


                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if ((attr.created_by && annotationsTool.user.get("id") === attr.created_by) || !attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                // Add backbone events to the model
                _.extend(this, Backbone.Events);

                this.set(attr);
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-track.Track#parse
             * @param  {Object} data Object literal containing the model attribute to parse.
             * @return {Object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at !== null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at !== null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at !== null ? Date.parse(attr.deleted_at): null;
                attr.settings = this.parseJSONString(attr.settings);

                if (annotationsTool.user.get("id") === attr.created_by) {
                    attr.isMine = true;
                } else {
                    attr.isMine = false;
                }

                if (attr.access === ACCESS.PUBLIC) {
                    attr.isPublic = true;
                } else {
                    attr.isPublic = false;
                }

                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if (data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-track.Track#validate
             * @param  {Object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var tmpCreated;

                if (attr.id) {
                    if (this.get("id") !== attr.id) {
                        this.id = attr.id;
                        this.attributes.id = attr.id;
                        this.setUrl();
                        this.attributes.ready = true;
                        this.trigger("ready", this);
                    }
                }

                if (attr.description && !_.isString(attr.description)) {
                    return "'description' attribute must be a string";
                }

                if (attr.settings && _.isUndefined(this.parseJSONString(attr.settings))) {
                    return "'settings' attribute must be a string or a JSON object";
                }

                if (attr.tags && _.isUndefined(this.parseJSONString(attr.tags))) {
                    return "'tags' attribute must be a string or a JSON object";
                }

                if (!_.isUndefined(attr.access)) {
                    if (!_.include(ACCESS, attr.access)) {
                        return "'access' attribute is not valid.";
                    } else if (this.attributes.access !== attr.access) {
                        if (attr.access === ACCESS.PUBLIC) {
                            this.attributes.isPublic = true;
                        } else {
                            this.attributes.isPublic = false;
                        }
                    }
                }

                if (attr.created_at) {
                    if ((tmpCreated = this.get("created_at")) && tmpCreated !== attr.created_at) {
                        return "'created_at' attribute can not be modified after initialization!";
                    } else if (!_.isNumber(attr.created_at)) {
                        return "'created_at' attribute must be a number!";
                    }
                }

                if (attr.updated_at && !_.isNumber(attr.updated_at)) {
                    return "'updated_at' attribute must be a number!";
                }

                if (attr.deleted_at && !_.isNumber(attr.deleted_at)) {
                    return "'deleted_at' attribute must be a number!";
                }
            },

            /**
             * Method to fetch the annotations
             * @alias module:models-track.Track#fetchAnnotations
             */
            fetchAnnotations: function (optSuccess) {
                var self = this,
                    annotations = this.get("annotations"),
                    success = function () {
                        if (!_.isUndefined(optSuccess)) {
                            optSuccess();
                        }

                        self.set("annotationsLoaded", true);
                    };
                
                if (!this.get("ready")) {
                    this.once("ready", this.fetchAnnotations);
                }

                if (annotations && (annotations.length) === 0) {
                    annotations.fetch({async: false,
                                       add: true,
                                       success: success});
                }
            },

            /**
             * Modify the current url for the tracks collection
             * @alias module:models-track.Track#setUrl
             */
            setUrl: function () {
                if (this.attributes.annotations) {
                    this.attributes.annotations.setUrl(this);
                }
            },

            /**
             * Set the access for the track and its annotations
             * @alias module:models-track.Track#setAccess
             * @param  {Integer} newAccess The new value of the access. See  {@link  module:access} 
             */
            setAccess: function (newAccess) {
                if (_.isUndefined(newAccess)) {
                    throw "The given access value must be valid access value!";
                }
                this.attributes.access = newAccess;
                this.attributes.annotations.updateAccess();
                this.trigger("change:access");
            },

            /**
             * Get the annotation with the given id
             * @alias module:models-track.Track#getAnnotation
             * @param  {Integer} annotationId The id from the wanted annotation
             * @return {Annotation}           The annotation with the given id
             */
            getAnnotation: function (annotationId) {
                return this.get("annotations").get(annotationId);
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-track.Track#toJSON
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function () {
                var json = Backbone.Model.prototype.toJSON.call(this);
                if (json.tags) {
                    json.tags = JSON.stringify(json.tags);
                }
                delete json.annotations;

                return json;
            },

            /**
             * Parse the given parameter to JSON if given as string
             * @alias module:models-track.Track#parseJSONString
             * @param  {string} parameter the parameter as string
             * @return {JSON} parameter as JSON object
             */
            parseJSONString: function (parameter) {
                if (parameter && _.isString(parameter)) {
                    try {
                        parameter = JSON.parse(parameter);
                    } catch (e) {
                        console.warn("Can not parse parameter '" + parameter + "': " + e);
                        return undefined;
                    }
                } else if (!_.isObject(parameter) || _.isFunction(parameter)) {
                    return undefined;
                }

                return parameter;
            }
        }, {
            FIELDS: {
                VISIBLE             : "visible",
                CREATED_BY          : "created_by",
                CREATED_BY_NICKNAME : "created_by_nickname"
            }
        });

        /**
         * @exports Track
         */
        return Track;
    }
);