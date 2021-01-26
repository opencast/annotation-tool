/**
 *  Copyright 2017, ELAN e.V., Germany
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
 * A module representing a generic annotation tool resource.
 * @module models-resource
 */
define(["underscore", "backbone", "util", "access", "roles"], function (_, Backbone, util, ACCESS, ROLES) {
"use strict";

/**
 * @constructor
 * @see {@link http://www.backbonejs.org/#Model}
 * @augments module:Backbone.Model
 * @memberOf module:models-resource
 * @alias module:models-resource.Resource
 */
var Resource = Backbone.Model.extend({

    /**
     * Constructor
     * @alias module:models-resource.Resource#initialize
     * @param {object} attr Object literal containing the model initialion attributes.
     */
    initialize: function (attr) {
        var annotationTool = window.annotationTool || {};

        if (!attr) attr = {};
        if (annotationTool.localStorage) {
            if (annotationTool.user) {
                if (!attr.created_by) {
                    this.set("created_by", annotationTool.user.id);
                }
                if (!attr.created_by_nickname) {
                    this.set("created_by_nickname", annotationTool.user.get("nickname"));
                }
                if (!attr.created_by_email) {
                    this.set("created_by_email", annotationTool.user.get("email"));
                }
            }
            if (!attr.created_at) {
                this.set("created_at", new Date());
            }
            if (!attr.updated_at) {
                this.set("updated_at", new Date());
            }
        }

        function updateIsPublic(access) {
            this.set("isPublic", access === ACCESS.PUBLIC);
        }
        if (attr.access) updateIsPublic.call(this, attr.access);
        this.on("change:access", function (self, access) {
            updateIsPublic.call(self, access);
        });

        this.set("isMine", !attr.created_by || (annotationTool.user && attr.created_by === annotationTool.user.id));

        if (attr.tags) {
            this.set("tags", util.parseJSONString(attr.tags));
        }

        if (attr.settings) {
            this.set("settings", util.parseJSONString(attr.settings));
        }
    },

    /**
     * Validate the attribute list passed to the model
     * @alias module:models-resource.Resource#validate
     * @param {object} attr Object literal containing the model attribute to validate.
     * @return {string} If the validation failed, an error message will be returned.
     */
    validate: function (attr, callbacks) {
        var created = this.get("created_at");

        if (attr.id) {
            if (this.get("id") !== attr.id) {
                this.id = attr.id;
                this.attributes.id = attr.id;
                if (callbacks && callbacks.onIdChange) callbacks.onIdChange.call(this);
            }
        }

        if (attr.tags && _.isUndefined(util.parseJSONString(attr.tags))) {
            return "\"tags\" attribute must be a string or a JSON object";
        }

        if (attr.settings && (!_.isObject(attr.settings) && !_.isString(attr.settings))) {
            return "\"settings\" attribute must be a string or a JSON object";
        }

        if (!_.isUndefined(attr.access) && !_.include(ACCESS, attr.access)) {
            return "\"access\" attribute is not valid.";
        }

        if (attr.created_at) {
            if (!util.parseDate(attr.created_at)) {
                return "\"created_at\" attribute must represent a date!";
            } else if (created && !util.datesEqual(created, attr.created_at)) {
                return "\"created_at\" attribute can not be modified after initialization!";
            }
        }

        if (attr.updated_at && !util.parseDate(attr.updated_at)) {
            return "\"updated_at\" attribute must represent a date!";
        }

        if (attr.deleted_at && !util.parseDate(attr.deleted_at)) {
            return "\"deleted_at\" attribute must represent a date!";
        }

        return undefined;
    },

    /**
     * Parse the attribute list passed to the model
     * @alias module:models-resource.Resource#parse
     * @param {object} data Object literal containing the model attribute to parse.
     * @param {function} callback Callback function that parses and potentially modifies <tt>data</tt>
     *   It does not need to worry about whether a POJO or a Backbone model was passed
     *   and it does not have to return anything. It works directly on the passed hash
     * @return {object} The object literal with the list of parsed model attribute.
     */
    parse: function (data, callback) {
        var annotationTool = window.annotationTool || {};

        var attr = data.attributes || data;

        if (attr.created_at) {
            attr.created_at = util.parseDate(attr.created_at);
        }
        if (attr.updated_at) {
            attr.updated_at = util.parseDate(attr.updated_at);
        }
        if (attr.deleted_at) {
            attr.deleted_at = util.parseDate(attr.deleted_at);
        }

        if (attr.tags) {
            attr.tags = util.parseJSONString(attr.tags);
        }

        if (attr.settings) {
            attr.settings = util.parseJSONString(attr.settings);
        }

        if (annotationTool.user) {
            attr.isMine = annotationTool.user.id === attr.created_by;
        }

        if (callback) callback.call(this, attr);

        return data;
    },

    /**
     * Override the default toJSON function to ensure complete JSONing.
     * @alias module:models-resource.Resource#toJSON
     * @param {options} options Potential options influencing the JSONing process
     * @return {JSON} JSON representation of the instance
     */
    toJSON: function (options) {
        var json = Backbone.Model.prototype.toJSON.call(this, options);

        if (options && options.stringifySub) {
            if (json.tags) json.tags = JSON.stringify(json.tags);
            if (json.settings && _.isObject(json.settings)) json.settings = JSON.stringify(json.settings);
        }

        return json;
    },

    /**
     * Decide whether this resource can be deleted by the current user.
     * @see administratorCanEditPublicInstances
     * @alias module:models-resource.Resource#isEditable
     */
    isEditable: function () {
        return this.get("isMine") || (
            this.administratorCanEditPublicInstances
                // TODO We should check this as well, but it does not work with labels so well ...
                //   so for now we assume that this is only ever checked when the resource is public
                //   in the right sense, i.e. it can be seen at all.
                //&& this.get("isPublic")
                && annotationTool.user.get("role") === ROLES.ADMINISTRATOR
        );
    },

    /**
     * Can a user with the administrator role delete instances of this resource, when they are public?
     * @see module:roles
     * @type {boolean}
     */
    administratorCanEditPublicInstances: false
});

return Resource;

});
