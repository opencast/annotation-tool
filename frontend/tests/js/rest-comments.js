require(['domReady',
         'jquery',
         'require',
         'models/comment',
         'models/annotation',
         'models/track',
         'models/video',
         'models/user',
         'collections/comments',
         'collections/annotations',
         'collections/videos',
         'collections/tracks',
         'collections/users',
         'backbone-annotations-sync',
         'underscore',
         'backbone'],
                    
        function(domReady, $, require, Comment, Annotation, Track, Video, User, Comments, Annotations, Videos, Tracks, Users, AnnotationsSync){
            
            domReady(function(){
                QUnit.config.autostart = false;
                Backbone.sync = AnnotationsSync;
                
                var comments,
                	comment,
                	annotations, 
                    annotation, 
                    videos, 
                    video,
                    tracks,
                    track,
                    users, 
                    user,
                    isVideoLoaded = false,
                    isTrackLoaded = false,
                    isAnnotationLoaded = false,
                    isUserLoaded = false,
                	isCommentLoaded = false,
                    tags1 = '{"tag":"test tag"}',
                    tags2 = '{"tag":"test tag 2"}';
                
                var loadUser = function(){
                    users = new Users();
                    var userExtId = window.annotationTool.getUserExtId();
                    user = users.create({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"});
                    window.annotationTool.user = user;
                    isUserLoaded = true;
                }
                
                var loadVideo = function(callback){
                    if(isVideoLoaded) {
                        if(callback)
                            callback();
                        return;
                    }

                    videos = new Videos();
                    video = videos.create({video_extid:'matterhorn123456', tags: tags1});
                    isVideoLoaded = true;
                    if(callback)
                        callback();
                };
            
	            var loadTrack = function(callback){      
                    loadVideo(function () {
                        if(isTrackLoaded) {
                            if(callback)
                                callback();
                            return;
                        }

                        tracks = new Tracks([], video);
                        track = tracks.create({name: "Test", description:'test track', tags: tags1});
                        isTrackLoaded = true;
                        if(callback)
                            callback();
                    });
	            };
	            
	            var loadAnnotation = function(callback){   
                    loadTrack(function () {    
                        if (isAnnotationLoaded) {
                            if(callback)
                                callback();
                            return;
                        }            
                        annotations = track.get("annotations");
                        annotation = annotations.create({text: "Test", start: 12.0, tags: tags1});
                        isAnnotationLoaded = true;
                        if(callback)
                            callback();
                    });
	            };
	            
	            var loadComment = function(){
	            	loadAnnotation(function () {
	            		if (isCommentLoaded) {
	            			return;
	            		}
	            		comments = annotation.get("comments");
	            		comments.add({text: "New comment", tags: tags1});
	            		comment = comments.at(0);
	            		isCommentLoaded = true;
	            	});
	            };
                
                module("Comments", { setup : function(){
                		if(!isUserLoaded)loadUser();
	    				loadComment();
                	} 
                });
                
                test("Save comment",function(){
                    stop();
                
                    AnnotationsSync('create',comment,{
	                    error: function(error){
	                        ok(false, error);
	                        start();
	                    },
	                    
	                    success: function(data){
	                        ok(true, "Saved successfully");
	                        ok(comment.get('id')!==undefined,"Id has been set");
	                        ok(_.isObject(data), "Got comment in json");
	                        ok(data.id, "Id is "+data.id);
	                        equal(data.text, comment.get("text"), "Text is correct");
	                        ok(_.isEqual(data.tags, comment.get("tags")), "Tags are correct");
	                        ok(data.created_at, "Created_at date is set");
	                        equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
	                        ok(data.updated_at, "Updated_at date is set");
	                        equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
	                        equal(data.deleted_at, null, "Deleted_at date is correct");
	                        equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
	                        comment.set(comment.parse(data));
	                        start();
	                    }
                    });
                })
                
	            test("Get a comment",function(){
	                stop();
	                
	                AnnotationsSync('read',comment,{
	                    error: function(error){
	                        ok(false, error);
	                        start();
	                    },
	                    
	                    success: function(data){
	                        ok(_.isObject(data), "Got comment in json");
	                        ok(data.id, "Id is "+data.id);
	                        equal(data.text, comment.get("text"), "Text is correct");
	                        ok(_.isEqual(data.tags, comment.get("tags")), "Tags are correct");
	                        ok(data.created_at, "Created_at date is set");
	                        equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
	                        ok(data.updated_at, "Updated_at date is set");
	                        equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
	                        equal(data.deleted_at, null, "Deleted_at date is correct");
	                        equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
	                        start();
	                    }
	                });
	            })
	            
	            
                test("Update a comment",function(){
	                stop();
	                
	                comment.set("text", "Comment 2");
	                comment.set("tags", JSON.parse(tags2));
	                
	                AnnotationsSync('update',comment,{
	                	
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Updated comment");
                            ok(_.isObject(data), "Got comment in json");
                            ok(_.isEqual(data.tags, JSON.parse(tags2)), "Tags are correct");
                            ok(data.id, "Id is "+data.id);
                            equal(data.text, "Comment 2","Text setted correctly");
                            ok(data.created_at, "Created_at date is set");
                            equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                            ok(data.updated_at, "Updated_at date is correct");
                            equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                            equal(data.deleted_at, null, "Deleted_at date is correct");
                            equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
                            comment.set(comment.parse(data));
                            start();
                        }
	                });
	            })
	            
                test("Get all comments from an annotation",function(){
                    stop();
                    
                    AnnotationsSync('read', comments,{
                        
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Get all comments successfully");
                            ok(_.isArray(data.comments), "Got all comments");
                            equal(data.comments.length, 1, "One comment are successfully returned");
                            start();
                        }
                    });
                });
                
                test("Delete a comment",1,function() {
                	stop();
                	
                    AnnotationsSync('delete',comment,{
                    	
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Comment deleted.");
                            start();
                        }
                    });
                });
                
            });
            
});
