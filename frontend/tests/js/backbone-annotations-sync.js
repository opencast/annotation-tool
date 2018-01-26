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

define(["jquery",
        "underscore",
        "backbone"],
       
       function($){
          
            /**
             * Synchronisation module for the annotations tool
             *
             * Has to be used to add persistence with the annotations model and the REST API
             */
            var AnnotationsSync = function(method, model, options){
             
               var self = this;

               if (_.contains(annotationTool.localStorageOnlyModel ,model.TYPE)) {
                  return Backbone.localSync(method, model, options);
               }
               
               // Sync module configuration
               this.config = {
                    headerParams: {
                         userId: "X-ANNOTATIONS-USER-ID",
                         token: "X-ANNOTATIONS-USER-AUTH-TOKEN"
                    }
               };
               
               /**
                * Get the URI for the given resource
                *
                * @param {Model, Collection} model model or collection to 
                */
               this.getURI = function(resource, withId){
                    
                    // If the resource has an id, it means that it's a model
                    if(resource.collection !== undefined){
                         if(withId && resource.id !== undefined)
                              return resource.url();
                         else
                              return resource.collection.url;
                    }
                    else{
                         return _.isFunction(resource.url)?resource.url():resource.url;
                    }
               }
               
               /**
                * Errors callback for jQuery Ajax method. 
                */
               this.setError = function(XMLHttpRequest, textStatus, errorThrown){
                                  console.warn("Error during "+method+" of resource, "+XMLHttpRequest.status+", "+textStatus);
                                  options.error(textStatus+", "+errorThrown);
               }
               
               /**
                * Callback related to "beforeSend" from the jQuery Ajax method.
                * Set the HTTP hedaer before to send the request
                */
               this.setHeaderParams = function(xhr) {
                    // Use request user id
                    if(annotationTool.user)
                         xhr.setRequestHeader(self.config.headerParams.userId, annotationTool.user.id);
                    
                    // Set user token in request header if a token is given
                    var token;
                    if(annotationTool.getUserAuthToken && !_.isUndefined(token = annotationTool.getUserAuthToken()))
                      xhr.setRequestHeader(self.config.headerParams.token, token); 
               };
               
               this.removeId = function(){
                    
               }
                
               /**
                * Method to send a POST request to the given url with the given resource
                *
                * @param {Model, Collection} resource
                */
               var create = function(resource){
                    $.ajax({
                              crossDomain: true,
                              type: "POST",
                              async: false,
                              url: self.getURI(resource, false),
                              dataType: "json",
                              data: JSON.parse(JSON.stringify(resource)),
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, xmlHttpRequest){

                                   resource.toCreate = false;
                                   resource.set(data);

                                   if(resource.setUrl)
                                        resource.setUrl();

                                   if(resource.collection && options.wait)
                                      resource.collection.add(resource);

                                   options.success(data, textStatus, xmlHttpRequest);
                              },
                              
                              error: self.setError
                    });
               }
               
               
               /**
                * Method to send a POST request to the given url with the given resource for copy
                *
                * @param {Model, Collection} resource
                */
               var copy = function(resource){
                    $.ajax({
                              crossDomain: true,
                              type: "POST",
                              async: false,
                              url: self.getURI(resource, false)+resource.get("copyUrl"),
                              dataType: "json",
                              data: JSON.parse(JSON.stringify(resource)),
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, xmlHttpRequest){
                                   resource.toCreate = false;
                                   resource.unset("copyUrl");
                                   
                                   if(resource.setUrl)
                                        resource.setUrl();

                                    if(resource.collection)
                                      resource.collection.add(resource);
                                   
                                   options.success(data, textStatus, xmlHttpRequest);
                              },
                              
                              error: self.setError
                    });
               };
               
               /**
                * Find the given resource 
                *
                * @param {Model, Collection} resource
                */
               var find = function(resource){
                    $.ajax({
                              crossDomain: true,
                              type: "GET",
                              url: self.getURI(resource, true),
                              dataType: "json",
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, xmlHttpRequest){
                                   options.success(data);
                              },
                              
                              error: self.setError
                    });
               };
               
               /**
                * Find all resource from collection
                *
                * @param {Model, Collection} resource
                */
               var findAll = function(resource){
                    $.ajax({
                              crossDomain: true,
                              type: "GET",
                              url: self.getURI(resource, false),
                              dataType: "json",
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, xmlHttpRequest){



                                   options.success(data, textStatus, xmlHttpRequest);
                              },
                              
                              error: self.setError
                    });
               };
               
               /**
                * Method to send a PUT request to the given url with the given resource
                *
                * @param {Model, Collection} resource
                */
               var update = function(resource){
                    $.ajax({
                              crossDomain: true,
                              async: false,
                              type: "PUT",
                              url: self.getURI(resource, (!resource.toCreate && !resource.noPOST)),
                              data: JSON.parse(JSON.stringify(resource)),
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, xmlHttpRequest){
                                   resource.toCreate = false;
                                   if(resource.setUrl)
                                        resource.setUrl();
                                   options.success(data, textStatus, xmlHttpRequest);
                              },
                              
                              error: self.setError
                    });
               };
               
               
               /**
                * Delete a resource
                *
                * @param {Model, Collection} resource
                */
               var destroy = function(resource){
                    $.ajax({
                              crossDomain: true,
                              type: "DELETE",
                              url: self.getURI(resource, true),
                              dataType: "json",
                              beforeSend: self.setHeaderParams,
                              success: function(data, textStatus, xmlHttpRequest){
                                   if(xmlHttpRequest.status == 204)
                                        options.success(resource); 
                                   else
                                        options.error("Waiting for status code 204 but got: "+xmlHttpRequest.status);
                              },
                              error: self.setError
                    });
               };
               
                    
               switch(method){
                         // If model has been created and is not a model with only PUT method supported, POST method is used
                        case "create":
                        case "update":  if(model.toCreate && !model.noPOST){
                                             if(model.get("copyUrl"))  // If it is a 'template' copy
                                                  copy(model);
                                             else
                                                  create(model); // Otherwise simply create
                                        }
                                        else{
                                             update(model);
                                        }
                                        break;

                        
                        // If model.id exist, it is a model, otherwise a collection so we retrieve all its items
                        case "read":    model.id != undefined ? find(model) : findAll(model); break;
                        
                        case "delete":  destroy(model); break;
               }

                
             
             };
             

             return AnnotationsSync;

});
