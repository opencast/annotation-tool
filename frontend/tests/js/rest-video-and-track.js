define(['domReady',
         'jquery',
         'models/user',
         'collections/users',
	     'models/video',
         'collections/videos',
         'models/track',
         'collections/tracks',
         'models/annotation',
         'collections/annotations',
         'backbone-annotations-sync',
         'underscore',
         'backbone'],
                    
        function(domReady, $, User, Users, Video, Videos, Track, Tracks, Annotatoin, Annotations, AnnotationsSync){
        
            Backbone.sync = AnnotationsSync;
            
            var videos, 
                videos, 
                track, 
                track2, 
                tracks, 
                annotation, 
                annotation2, 
                annotations, 
                users, 
                user,
                isVideoLoaded = false,
                isTrackLoaded = false,
                tags1 = {"tag":"test tag 1"},
                tags2 = {"tag":"test tag 2"},
                isAnnotationLoaded = false,
                isUserLoaded = false;

            
            Backbone.sync = AnnotationsSync;
            
            var loadUser = function(){
                users = new Users();
                var userExtId = window.annotationTool.getUserExtId();
                users.create({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"});
                user = users.at(0);
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
                    videos.add({video_extid:'matterhorn123', tags: tags1});
                    video = videos.at(0);
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
                        tracks.add({name: "Test", description:'test track', tags: tags1});
                        track = tracks.at(0);
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
                        annotations.add({text: "Test", start: 12.0, tags: tags1});
                        annotation = annotations.at(0);
                        isAnnotationLoaded = true;
                        if(callback)
                            callback();
                    });
            };
            
            /* VIDEO tests */
            module("Video", { setup : function(){
                    if(!isUserLoaded)loadUser();
                    loadVideo();   
                }
            });
            

            test("Save video",function(){
                stop();
                
                AnnotationsSync('update',video,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Saved successfully");
                                ok(_.isObject(data), "Got video in json");
                                ok(data.id, "Id is "+data.id);
                                equal(data.video_extid, video.get("video_extid"), "Extid is correct");
                                ok(_.isEqual(data.tags, video.get("tags")), "Tags are correct");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(data.updated_at, "Updated_at date is set");
                                equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");     
                                equal(data.deleted_at, null, "Deleted_at date is correct");
                                equal(data.deleted_by_nickname, null, "Deleted_by_nickname user is correct");
                                video.set(video.parse(data));
                                start();
                            }
                });
            });

            test("Get video",function(){
                stop();
                
                AnnotationsSync('read',video,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(_.isObject(data), "Got video in json");
                                ok(data.id, "Id is "+data.id);
                                equal(data.video_extid, video.get("video_extid"), "Extid is correct");
                                ok(_.isEqual(data.tags, video.get("tags")), "Tags are correct");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(data.updated_at, "Updated_at date is set");
                                equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                equal(data.deleted_at, null, "Deleted_at date is correct");
                                equal(data.deleted_by_nickname, null, "Deleted_by_nickname user is correct");
                                start();
                            }
                });

            });

            
            
            
            test("Update video",function(){
                stop();
                video.set("tags", tags2);
                AnnotationsSync('update',video,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Video updated");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(_.isEqual(data.tags, video.get("tags")), "Tags are correct");
                                ok(data.updated_at, "Updated_at date is correct");
                                equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                video.set(video.parse(data));
                                start();
                            }
                });

            });
        
            /* TRACK tests */
            module("Track", {
                setup: function(){
                    if(!isUserLoaded)loadUser();
                    loadTrack();
                }
            });
                    
            test("Save track",function(){
                stop();
            
                AnnotationsSync('create', track,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Saved successfully");
                                ok(track.get('id')!==undefined,"Id has been set");
                                ok(_.isObject(data), "Got track in json");
                                ok(data.id, "Id is "+data.id);
                                equal(data.name, track.get("name"), "Name is correct");
                                equal(data.description, track.get("description"), "Description is correct");
                                equal(data.settings, track.get("settings"), "Settings are correct");
                                ok(_.isEqual(data.tags, track.get("tags")), "Tags are correct");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(data.updated_at, "Updated_at date is set");
                                equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                equal(data.deleted_at, null, "Deleted_at date is correct");
                                equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
                                track.set(track.parse(data));
                                start();
                            }
                });

            })
            
            test("Get track",function(){
                stop();
                
                AnnotationsSync('read',track,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(_.isObject(data), "Got track in json");
                                ok(data.id, "Id is "+data.id);
                                equal(data.name, track.get("name"), "Name is correct");
                                equal(data.description, track.get("description"), "Description is correct");
                                equal(data.settings, track.get("settings"), "Settings are correct");
                                ok(_.isEqual(data.tags, track.get("tags")), "Tags are correct");
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
            
            test("Update track",function(){
                stop();
                track.set("name", "new name");
                track.set("tags", tags2);
                AnnotationsSync('update',track,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Track updated");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(_.isEqual(data.tags, track.get("tags")), "Tags are correct");
                                ok(data.updated_at, "Updated_at date is correct");
                                equal(data.updated_by_nickname, user.get('nickname'), "updated_by_nickname is correct");
                                equal(data.deleted_at, null, "Deleted_at date is correct");
                                equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
                                track.set(track.parse(data));
                                start();
                            }
                });
            })
            
            test("Get all tracks from video", function(){
                stop();
            
                AnnotationsSync('read',tracks,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Get all track successfully");
                                
                                ok(_.isArray(data.tracks), "Got all tracks");
                                equal(data.tracks.length, 1, "One track is successfully returned");
                                start();
                            }
                });
            })
            
            test("Save track 2",function(){
                stop();
            
                tracks.add({name: "Test2", description:'test track2'});
                track2 = tracks.at(1);
                AnnotationsSync('create',track2,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Saved successfully");
                                
                                ok(track2.get('id')!==undefined,"Id has been set");
                                track2.set(track2.parse(data));
                                start();
                            }
                });
            })
            
            test("Get all tracks from video", function(){
                stop();
            
                AnnotationsSync('read',tracks,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Get all track successfully");
                                
                                ok(_.isArray(data.tracks), "Got all tracks");
                                equal(data.tracks.length, 2, "Two tracks are successfully returned");
                                start();
                            }
                });
            })
            
             /* ANNOTATION tests */
            module("Annotation", {
                setup: function(){
                    if(!isUserLoaded)loadUser();
                    loadAnnotation();
                }
            });
                    
            test("Save annotations",function(){
                stop();
            
                AnnotationsSync('create',annotation,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Saved successfully");
                                ok(annotation.get('id')!==undefined,"Id has been set");
                                ok(_.isObject(data), "Got annotation in json");
                                ok(data.id, "Id is "+data.id);
                                equal(data.text, annotation.get("text"), "Text is correct");
                                equal(data.start, annotation.get("start"), "Start is correct");
                                ok(_.isEqual(data.tags, annotation.get("tags")), "Tags are correct");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(data.updated_at, "Updated_at date is set");
                                equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                equal(data.deleted_at, null, "Deleted_at date is correct");
                                equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
                                annotation.set(annotation.parse(data));
                                start();
                            }
                });
            })
            
            test("Get annotation",function(){
                stop();
                
                AnnotationsSync('read',annotation,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(_.isObject(data), "Got annotation in json");
                                ok(data.id, "Id is "+data.id);
                                equal(data.text, annotation.get("text"), "Text is correct");
                                equal(data.start, annotation.get("start"), "Start is correct");
                                ok(_.isEqual(data.tags, annotation.get("tags")), "Tags are correct");
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
            
            test("Update annotation",function(){
                stop();
                annotation.set("text", "Test2");
                annotation.set("tags",tags2);
                AnnotationsSync('update',annotation,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Updated annotation");
                                ok(_.isEqual(data.tags, annotation.get("tags")), "Tags are correct");
                                ok(data.created_at, "Created_at date is set");
                                equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                ok(data.updated_at, "Updated_at date is correct");
                                equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                equal(data.deleted_at, null, "Deleted_at date is correct");
                                equal(data.deleted_by_nickname, null, "Deleted_by_nickname is correct");
                                annotation.set(annotation.parse(data));
                                start();
                            }
                });
            })
            
            test("Get all annotations from track", function(){
                stop();
            
                AnnotationsSync('read',annotations,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Get all annotations successfully");
                                ok(_.isArray(data.annotations), "Got all annotations");
                                equal(data.annotations.length, 1, "One annotation is successfully returned");
                                start();
                            }
                });
            })
            
            test("Save annotation 2",function(){
                stop();
            
                annotations.add({text: "Test2", start: 14.0});
                annotation2 = annotations.at(1);
                AnnotationsSync('create',annotation2,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Saved successfully");
                                ok(annotation2.get('id')!==undefined,"Id has been set");
                                annotation2.set(annotation2.parse(data));
                                start();
                            }
                });
            })
            
            test("Get all annotations from track", function(){
                stop();
            
                AnnotationsSync('read',annotations,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Get all annotations successfully");
                                ok(_.isArray(data.annotations), "Got all annotations");
                                equal(data.annotations.length, 2, "Two annotations are successfully returned");
                                start();
                            }
                });
            })
            
            /* DELETE tests */
            module("Deletion", {
                setup: function(){
                    if(!isUserLoaded)loadUser();
                    loadVideo();
                    loadTrack();
                    loadAnnotation();
                }
            });
            
            test("Delete annotation",1,function(){
                stop();
                AnnotationsSync('delete',annotation,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Annotation deleted.");                                    
                                start();
                            }
                });
            })
            
            test("Delete annotation 2",1,function(){
                stop();
                AnnotationsSync('delete',annotation2,{
                            error: function(error){
                                ok(false, error);
                                start();
                            },
                            
                            success: function(data){
                                ok(true, "Annotation 2 deleted.");
                                start();
                            }
                });
            })
            
            test("Get deleted annotation",1,function(){
                stop();
                AnnotationsSync('read',annotation,{
                            error: function(error){
                                ok(true, "Try to get annotation but should not exist: "+error);
                                start();
                            },
                            
                            success: function(data){
                                ok(false, "Got annotation");
                                start();
                            }
                });
            })
            
            test("Delete track",1,function(){
                stop();
                
                AnnotationsSync('delete',track,{
                    error: function(error){
                        ok(false, error);
                        start();
                    },
                    
                    success: function(data){
                        ok(true, "Track deleted.");
                        start();
                    }
                });
                
            })
            
            test("Delete track 2",1,function(){
                stop();
                
                AnnotationsSync('delete',track2,{
                    error: function(error){
                        ok(false, error);
                        start();
                    },
                    
                    success: function(data){
                        ok(true, "Track 2 deleted.");
                        start();
                    }
                });
                
            })
            
            test("Get deleted track",1,function(){
                stop();
                AnnotationsSync('read',track,{
                    error: function(error){
                        ok(true, "Try to get track but should not exist: "+error);
                        start();
                    },
                    
                    success: function(data){
                        ok(false, "Got track");
                        start();
                    }
                });
            })
            
            test("Delete video",1,function(){
                stop();
                
                AnnotationsSync('delete',video,{
                    error: function(error){
                        ok(false, error);
                        start();
                    },
                    
                    success: function(data){
                        ok(true, "Video deleted.");
                        isVideoLoaded = false;
                        start();
                    }
                });
                
            })
            
            test("Get deleted video",1,function(){
                stop();
                AnnotationsSync('read',video,{
                    error: function(error){
                        ok(true, "Try to get video but should not exist: "+error);
                        start();
                    },
                    
                    success: function(data){
                        ok(false, "Got video");
                        start();
                    }
                });
            })
                
});
