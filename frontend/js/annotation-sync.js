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
 * The synchronization  module for the annotation tool
 * @module annotation-sync
 * @requires underscore
 * @requires backbone
 * @requires localstorage
 */
define(["underscore", "backbone", "localstorage"], function (_, Backbone) {
    "use strict";

    /**
     * Synchronize models with an annotation tool backend
     * @alias module:annotation-sync.annotationSync
     */
    var annotationSync = function (method, model, options) {
        if (annotationsTool.localStorage) {
            return Backbone.localSync.call(this, method, model, options);
        }

        options = _.extend({
            headers: {},
            processData: true
        }, options);

        if (model.localStorageOnly) {
            return Backbone.localSync.call(this, method, model, options);
        }

        options.data = options.attrs || model.toJSON(options);

        if (annotationsTool.user) {
            options.headers["X-ANNOTATIONS-USER-ID"] = annotationsTool.user.id;
        }
        var authToken = _.result(annotationsTool, 'getUserAuthToken');
        if (authToken) {
            options.headers["X-ANNOTATIONS-USER-AUTH-TOKEN"] = authToken;
        }

        if (model.noPOST && method === "create") {
            method = "update";
        }

        return Backbone.ajaxSync.call(this, method, model, options);
    };

    return annotationSync;
});