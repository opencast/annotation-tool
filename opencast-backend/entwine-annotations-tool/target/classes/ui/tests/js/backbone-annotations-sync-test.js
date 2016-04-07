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
                    if(!_.isUndefined(window.annotationsTool) && !_.isUndefined(window.annotationsTool.user))
                         xhr.setRequestHeader(self.config.headerParams.userId, annotationsTool.user.id);
               
                    // Only for sprint 2
                    // xhr.setRequestHeader(self.config.headerParams.token, token); 
               };
               
               this.removeId = function(){
                    
               }
                
               /**
                * Method to send a GET request to the given url with the given resource
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
                              success: function(data, textStatus, XMLHttpRequest){
                                   resource.set(resource.parse(data));
                                   resource.toCreate = false;
                                   if(resource.setUrl)
                                        resource.setUrl();
                                   options.success(data, textStatus, XMLHttpRequest);
                              },
                              
                              error: self.setError
                    });
               }
               
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
                              success: function(data, textStatus, XMLHttpRequest){
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
                              success: function(data, textStatus, XMLHttpRequest){
                                   options.success(data, textStatus, XMLHttpRequest);
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
                              success: function(data, textStatus, XMLHttpRequest){
                                   resource.set(resource.parse(data));
                                   resource.toCreate = false;
                                   if(resource.setUrl)
                                        resource.setUrl();
                                   options.success(data, textStatus, XMLHttpRequest);
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
                              success: function(data, textStatus, XMLHttpRequest){
                                   if(XMLHttpRequest.status == 204)
                                        options.success(resource); 
                                   else
                                        options.error("Waiting for status code 204 but got: "+XMLHttpRequest.status);
                              },
                              error: self.setError
                    });
               };
               
                    
               switch(method){
                         // If model has been created and is not a model with only PUT method supported, POST method is used
                        case "create":
                        case "update":
                                        (model.toCreate && !model.noPOST) ? create(model) : update(model); break;
                        
                        // If model.id exist, it is a model, otherwise a collection so we retrieve all its items
                        case "read":    model.id != undefined ? find(model) : findAll(model); break;
                        
                        case "delete":  destroy(model); break;
               }

                
             
             };
             

             return AnnotationsSync;

});