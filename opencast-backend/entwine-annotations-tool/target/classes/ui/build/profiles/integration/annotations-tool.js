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

define(['jquery',
        'underscore',
        'views/main',
        'text!templates/delete-modal.tmpl',
        'text!templates/delete-warning-content.tmpl',
        'libs/handlebars'],
       
        function($, _, MainView, DeleteModalTmpl, DeleteContentTmpl) {
            
            var self = this;
            
            /**
             * Type of target that can be deleted using the delete warning modal
             *
             * Each type object must contain these elements
             *
             * {
             *   name: "Name of the type", // String
             *   getContent: function(target){ // Function
             *       return "Content of the target element"
             *   },
             *   destroy: function(target){ // Function
             *       // Delete the target
             *   }
             * }
             */
            deleteTargetTypes = {
                
                ANNOTATION: {
                    name: "annotation",
                    getContent: function(target){
                        return target.get("text");
                    },
                    destroy: function(target,callback){

                        target.destroy({
                            
                            success: function(){
                                if(annotationsTool.localStorage){

                                    annotationsTool.video.get("tracks").each(function(value,index){
                                        if(value.get("annotations").get(target.id)){
                                            value.get("annotations").remove(target)
                                            value.save({wait:true})
                                            return false;
                                        }
                                    });

                                    annotationsTool.video.save();
                                }
                                
                                if(callback)
                                    callback();
                            },
                            
                            error: function(error){
                                console.warn("Cannot delete annotation: "+error);
                            }
                        });
                            
                    }
                },

                LABEL: {
                    name: "label",
                    getContent: function(target){
                        return target.get("value");
                    },
                    destroy: function(target,callback){

                        target.destroy({
                            
                            success: function(){
                                if(annotationsTool.localStorage){
                                    if(target.collection)
                                      target.collection.remove(target);

                                    annotationsTool.video.save();
                                }
                                
                                if(callback)
                                    callback();
                            },
                            
                            error: function(error){
                                console.warn("Cannot delete label: "+error);
                            }
                        });
                            
                    }
                },
                
                TRACK: {
                    name: "track",
                    getContent: function(target){
                        return target.get("name");
                    },
                    destroy: function(track,callback){
                            var annotations = track.get("annotations");
            
                            /**
                             * Recursive function to delete synchronously all annotations
                             */
                            var destroyAnnotation = function(){
                              // End state, no more annotation
                              if(annotations.length == 0)
                                return;
                              
                              var annotation = annotations.at(0);
                              annotation.destroy({
                                error: function(){
                                  throw "Cannot delete annotation!";
                                },
                                success: function(){
                                  annotations.remove(annotation);
                                  destroyAnnotation();
                                }
                              });
                            };
                            
                            // Call the recursive function 
                            destroyAnnotation();
                            
                            track.destroy({
                                success: function(){
                                    if(annotationsTool.localStorage)
                                        annotationsTool.video.save();
                                
                                    if(callback)
                                        callback();
                                },
                            
                                error: function(error){
                                    console.warn("Cannot delete track: "+error);
                                }
                            })
                    }
                },

                CATEGORY: {
                    name: "category",
                    getContent: function(target){
                        return target.get("name");
                    },
                    destroy: function(category,callback){
                            var labels = category.get("labels");
            
                            /**
                             * Recursive function to delete synchronously all labels
                             */
                            var destroyLabels = function(){
                              // End state, no more label
                              if(labels.length == 0)
                                return;
                              
                              var label = labels.at(0);
                              label.destroy({
                                error: function(){
                                  throw "Cannot delete label!";
                                },
                                success: function(){
                                  labels.remove(label);
                                  destroyLabels();
                                }
                              });
                            };
                            
                            // Call the recursive function 
                            destroyLabels();
                            
                            category.destroy({
                                success: function(){
                                    if(annotationsTool.localStorage)
                                        annotationsTool.video.save();
                                
                                    if(callback)
                                        callback();
                                },
                            
                                error: function(error){
                                    console.warn("Cannot delete category: "+error);
                                }
                            })
                    }
                }
            };
            
            self.deleteModalTmpl = Handlebars.compile(DeleteModalTmpl);
            self.deleteContentTmpl = Handlebars.compile(DeleteContentTmpl);
            
            /**
             * Function to init the delete warning modal
             */
            self.initDeleteModal = function(){
                    annotationsTool.deleteOperation = {};
                    annotationsTool.deleteOperation.targetTypes = deleteTargetTypes;
                
                    $('#dialogs').append(deleteModalTmpl({type:"annotation"}));
                    self.deleteModal = $('#modal-delete').modal({show: true, backdrop: false, keyboard: true });
                    self.deleteModal.modal("toggle");
                    self.deleteModalHeader  = self.deleteModal.find(".modal-header h3");
                    self.deleteModalContent = self.deleteModal.find(".modal-body");
            };
            
            /**
             * Function to load the video file
             *
             * This part is specific to each integration of the annotation tool
             */
            self.loadVideo = function(){
               var duration = 0;
               
               // Supported video formats
               var videoTypes = ["video/webm","video/ogg","video/mp4"];
               //var videoTypesForFallBack = ["video/x-flv"];
               var videoTypesForFallBack = [];
               var trackType = ["presenter/delivery","presentation/delivery"];
               var mediaPackageId = decodeURI((RegExp('id=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
               
               // Get the mediapackage and fill the player element with the videos
               $.ajax({
                   url: '/search/episode.json',
                   async: false,
                   data: 'id=' + mediaPackageId,
                   dataType: 'json',
                   success: function (data) {
                       var mediapackage = data["search-results"].result.mediapackage;
                       var videos = {};
                       var videosFallback = {};
                       
                       var nbNormalVideos = 0;
                       var nbFallbackVideos = {};
                       
                       var cleanId = function(id){
                               return id.replace('/','_');
                       };
                       
                       $.each(videoTypesForFallBack,function(idx,mimetype){
                               videosFallback[mimetype] = {};
                               nbFallbackVideos[mimetype] = 0;
                       })
                       
                       $.each(trackType,function(index,type){
                               videos[type] = new Array();
                               $.each(videoTypesForFallBack,function(idx,mimetype){
                                       videosFallback[mimetype][type]=new Array();
                               })
                       });
                       
                       var tracks = mediapackage.media.track;
                       if(!$.isArray(tracks)) {
                               tracks = new Array();
                               tracks.push(mediapackage.media.track);
                       }
                       $.each(tracks, function(index, track) {
                               var selectedVideos = null;
                               
                               // If type not supported, go to next track
                               if($.inArray(track.mimetype,videoTypes)!=-1){
                                       selectedVideos = videos;
                                       nbNormalVideos++;
                               }
                               else if($.inArray(track.mimetype,videoTypesForFallBack)!=-1){
                                       selectedVideos = videosFallback[track.mimetype];
                                       nbFallbackVideos[track.mimetype]++;
                               }
                               else{
                                       return;
                               }
                               
                               $.each(trackType,function(index,type){
                                       if(track.type == type){
                                               selectedVideos[type].push(track);
                                               return false;
                                       }
                               });
                       });
                       
                       var selectedVideos = {};
                       
                       if(nbNormalVideos==0){
                               $.each(videoTypesForFallBack,function(idx,mimetype){
                                       if(nbFallbackVideos[mimetype] > 0){
                                               selectedVideos = videosFallback[mimetype];
                                               return false;
                                       }
                               }) 
                       }
                       else{
                               selectedVideos= videos;
                       }
                       
                       $.each(selectedVideos,function(index,type){
                               if(type.length != 0){
                                       var videoSrc = "";
                                       $.each(type,function(idx,track){
                                               if(duration == 0)
                                                       duration = track.duration;
                                               videoSrc += '<source src="' + track.url + '" type="' + track.mimetype + '"></source>';
                                       });
                                       if(videoSrc != ""){
                                               $('video').append(videoSrc);
                                               $('video').attr('id',mediaPackageId);
                                       }
                               }
                       });
                    }
               });
            }
            
            
            return {            
                
                start: function() {
                        self.initDeleteModal();
                        self.loadVideo();  
                    
                        var playerAdapter = annotationsTool.playerAdapter;
                        
                        /**
                         * Function to delete element with warning
                         *
                         * @param {Object} target Element to be delete
                         * @param {TargetsType} type Type of the target to be deleted
                         */
                        annotationsTool.deleteOperation.start = function(target,type,callback){
                            // Change modal title
                            self.deleteModalHeader.text('Delete '+type.name);
                            
                            // Change warning content
                            self.deleteModalContent.html(self.deleteContentTmpl({
                               type: type.name,
                               content: type.getContent(target)
                            }));
                            
                            // Listener for delete confirmation
                            self.deleteModal.find('#confirm-delete').one('click',function(){
                                type.destroy(target,callback);
                                self.deleteModal.modal("toggle");
                            });

                            var confirmWithEnter = function(e){                                
                                if(e.keyCode == 13){
                                    type.destroy(target,callback);
                                    self.deleteModal.modal("toggle");
                                }
                            }

                            // Add possiblity to confirm with return key
                            $(window).bind('keypress',confirmWithEnter);
                            
                            // Unbind the listeners when the modal is hidden
                            self.deleteModal.one("hide",function(){
                                $('#confirm-delete').unbind('click');
                                $(window).unbind('keypress',confirmWithEnter);
                            });
                            
                            // Show the modal
                            self.deleteModal.modal("show");
                        };
                        
                        var mainView = new MainView(playerAdapter);
                }
            };
        }
);