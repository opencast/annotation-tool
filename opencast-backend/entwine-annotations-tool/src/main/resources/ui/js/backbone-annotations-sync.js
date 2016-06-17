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
 * The synchronisation module for the annotations tool
 * @module backbone-annotations-sync
 * @requires jQuery
 * @requires backbone
 */
define(["jquery",
        "backbone"],

       function ($) {

            "use strict";

            /**
             * Synchronisation module for the annotations tool
             * Has to be used to add persistence with the annotations model and the REST API
             * @constructor
             * @alias module:backbone-annotations-sync.AnnotationsSync
             */
            var AnnotationsSync = function (method, model, options) {

                var self = this,
                    create,
                    update,
                    find,
                    copy,
                    findAll,
                    destroy;

                // Check if the model is limited to persistence on localStorage
                if (_.contains(annotationsTool.localStorageOnlyModel, model.TYPE)) {
                    return Backbone.localSync(method, model, options);
                }


                // Enable cross-domain for jquery ajax query
                $.support.cors = true;

                // Sync module configuration
                this.config = {
                    headerParams: {
                        userId: "X-ANNOTATIONS-USER-ID",
                        token : "X-ANNOTATIONS-USER-AUTH-TOKEN"
                    }
                };

                /**
                 * Get the URI for the given resource
                 * @param {Model | Collection} model model or collection from which the URI has to be generated
                 * @param {boolean} withId Define if the id has to be included in the URI
                 */
                this.getURI = function (resource, withId) {
                    var tempUrl = "";

                    // If the resource has an id, it means that it's a model
                    if (typeof resource.collection !== "undefined") {
                        if (withId && (typeof resource.id !== "undefined")) {
                            tempUrl = resource.url();
                        } else {
                            tempUrl = resource.collection.url;
                        }
                    } else {
                        tempUrl = _.isFunction(resource.url) ? resource.url() : resource.url;
                    }

                    if (_.isUndefined(options.paging)) {
                        return tempUrl;
                    } else {
                        return tempUrl + options.paging;
                    }
                };

                /**
                 * Errors callback for jQuery Ajax method.
                 */
                this.setError = function (XMLHttpRequest, textStatus, errorThrown) {
                    //console.warn("Error during " + method + " of resource, " + XMLHttpRequest.status + ", " + textStatus);
                    if (!_.isUndefined(options.error)) {
                        options.error(textStatus + ", " + errorThrown);
                    }
                };

                /**
                 * Callback related to "beforeSend" from the jQuery Ajax method.
                 * Set the HTTP hedaer before to send the request
                 */
                this.setHeaderParams = function (xhr) {
                    // Use request user id
                    if (annotationsTool.user) {
                        xhr.setRequestHeader(self.config.headerParams.userId, annotationsTool.user.id);
                    }

                    // Set user token in request header if a token is given
                    var token;
                    if (annotationsTool.getUserAuthToken && !_.isUndefined(token = annotationsTool.getUserAuthToken())) {
                        xhr.setRequestHeader(self.config.headerParams.token, token);
                    }
                };

                /**
                 * Method to send a POST request to the given url with the given resource
                 * @method
                 * @alias module:backbone-annotations-sync.AnnotationsSync#create
                 * @param {Model | Collection} resource The resource to persist
                 */
                create = function (resource) {
                    $.ajax(_.extend(_.clone(options), {
                        crossDomain: true,
                        type       : "POST",
                        async      : false,
                        url        : self.getURI(resource, false),
                        dataType   : "json",
                        data       : resource.toJSON(true),
                        beforeSend : self.setHeaderParams,
                        success: function (data, textStatus, xmlHttpRequest) {
                            resource.toCreate = false;
                            resource.set(data);

                            if (resource.setUrl) {
                                resource.setUrl();
                            }

                            if (resource.collection && options.wait) {
                                resource.collection.add(resource);
                            }

                            options.success(data, textStatus, xmlHttpRequest);
                        },
                        error: self.setError
                    }));
                };

                /**
                 * Method to send a POST request to the given url with the given resource for copy
                 * @inner
                 * @alias module:backbone-annotations-sync.AnnotationsSync#copy
                 * @param {Model | Collection} resource The resource to copy
                 */
                copy = function (resource) {
                    $.ajax(_.extend(_.clone(options), {
                        crossDomain: true,
                        type       : "POST",
                        async      : false,
                        url        : self.getURI(resource, false) + resource.get("copyUrl"),
                        dataType   : "json",
                        data       : resource.toJSON(true),
                        beforeSend : self.setHeaderParams,
                        success: function (data, textStatus, xmlHttpRequest) {
                            resource.toCreate = false;
                            resource.unset("copyUrl");

                            if (resource.setUrl) {
                                resource.setUrl();
                            }

                            if (resource.collection) {
                                resource.collection.add(resource);
                            }

                            options.success(data, textStatus, xmlHttpRequest);
                        },
                        error: self.setError
                    }));
                };

                /**
                 * Find the given resource
                 * @inner
                 * @alias module:backbone-annotations-sync.AnnotationsSync#find
                 * @param {Model} resource The model to find
                 */
                find = function (resource) {
                    $.ajax(_.extend(_.clone(options), {
                        crossDomain: true,
                        type       : "GET",
                        url        : self.getURI(resource, true),
                        dataType   : "json",
                        beforeSend : self.setHeaderParams,
                        success: function (data) {
                            options.success(data);
                        },
                        error: self.setError
                    }));
                };

                /**
                 * Find all resource from collection
                 * @inner
                 * @alias module:backbone-annotations-sync.AnnotationsSync#findAll
                 * @param {Collection} resource The collection to find
                 */
                findAll = function (resource) {
                    $.ajax(_.extend(_.clone(options), {
                        crossDomain: true,
                        type       : "GET",
                        url        : self.getURI(resource, false),
                        dataType   : "json",
                        beforeSend : self.setHeaderParams,
                        success    : function (data, textStatus, xmlHttpRequest) {
                            options.success(data, textStatus, xmlHttpRequest);
                        },
                        error: self.setError
                    }));
                };

                /**
                 * Method to send a PUT request to the given url with the given resource
                 * @inner
                 * @alias module:backbone-annotations-sync.AnnotationsSync#update
                 * @param {Model | Collection} resource The resource to update
                 */
                update = function (resource) {
                    $.ajax(_.extend(_.clone(options), {
                        crossDomain: true,
                        async      : false,
                        type       : "PUT",
                        url        : self.getURI(resource, (!resource.toCreate && !resource.noPOST)),
                        data       : resource.toJSON(true),
                        beforeSend : self.setHeaderParams,
                        success    : function (data, textStatus, xmlHttpRequest) {
                            resource.toCreate = false;
                            if (resource.setUrl) {
                                resource.setUrl();
                            }
                            options.success(data, textStatus, xmlHttpRequest);
                        },
                        error: self.setError
                    }));
                };

                /**
                 * Delete a resource
                 * @inner
                 * @alias module:backbone-annotations-sync.AnnotationsSync#destroy
                 * @param {Model | Collection} resource The resource to delete
                 */
                destroy = function (resource) {
                    $.ajax(_.extend(_.clone(options), {
                        crossDomain: true,
                        type       : "DELETE",
                        url        : self.getURI(resource, true),
                        dataType   : "json",
                        beforeSend : self.setHeaderParams,
                        success    : function (data, textStatus, xmlHttpRequest) {
                            if (xmlHttpRequest.status === 204) {
                                options.success(resource);
                            } else {
                                options.error("Waiting for status code 204 but got: " + xmlHttpRequest.status);
                            }
                        },
                        error: self.setError
                    }));
                };

                switch (method) {
                 // If model has been created and is not a model with only PUT method supported, POST method is used
                case "create":
                case "update":
                    if (model.toCreate && !model.noPOST) {
                        if (model.get("copyUrl")) { // If it is a 'template' copy
                            copy(model);
                        } else {
                            create(model); // Otherwise simply create
                        }
                    } else {
                        update(model);
                    }
                    break;
                // If model.id exist, it is a model, otherwise a collection so we retrieve all its items
                case "read":
                    if (model.id !== undefined) {
                        find(model);
                    } else {
                        findAll(model);
                    }
                    break;
                case "delete":
                    destroy(model);
                    break;
                }
            };
            return AnnotationsSync;
        }
);