define(['domReady',
         'jquery',
         'models/user',
         'collections/users',
	     'models/video',
         'collections/videos',
         'models/scale',
         'collections/scales',
         'models/scalevalue',
         'collections/scalevalues',
         'backbone-annotations-sync',
         'underscore',
         'backbone'],
                    
        function(domReady, $, User, Users, Video, Videos, Scale, Scales, ScaleValue, ScaleValues, AnnotationsSync){
        
            domReady(function(){
                QUnit.config.autostart = false;
                Backbone.sync = AnnotationsSync;
                
                var videos, videos, users, user, scales, videoScales, scale, scale2, scaleValues, scaleValue, scaleValue2;
                var isVideoLoaded = false;
                var isUserLoaded = false;
                var isScaleLoaded = false;
                var isScaleValueLoaded = false;
                
                Backbone.sync = AnnotationsSync;
                
                var loadUser = function(){
                    users = new Users();
                    var userExtId = window.annotationTool.getUserExtId();
                    users.create({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"});
                    user = users.at(0);
                    window.annotationTool.user = user;
                    isUserLoaded = true;
                }
                
                var loadVideo = function(){
                    videos = new Videos();
                    videos.create({video_extid:'matterhorn1234'});
                    video = videos.at(0);
                    isVideoLoaded = true;
                };
                
                var loadScale = function(){
                    scales = new Scales([]);
                    videoScales = new Scales([],video);
                    scales.add({name:'quality',description:'the quality'});
                    scale = scales.at(0);
                    isScaleLoaded = true;
                };
                
                var loadScaleValue = function() {
                    scaleValues = new ScaleValues([], scale);
                    scaleValues.add({name:'schwach',value:0.5,order:1});
                    scaleValue = scaleValues.at(0);
                    isScaleValueLoaded = true;
                }
                
                /* SCALE tests */
                module("Scale", { setup : function(){
                        if(!isUserLoaded)loadUser();
                        if(!isVideoLoaded)loadVideo();
                        if(!isScaleLoaded)loadScale();
                    }
                });
                
                test("Save scale",function(){
                    stop();
                    AnnotationsSync('create',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(data.id!==undefined,"Id has been set");
                                    ok(_.isObject(data), "Got scale in json");
                                    equal(data.name, scale.get("name"), "Name is correct");
                                    equal(data.description, scale.get("description"), "Description is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    scale.set(scale.parse(data));
                                    start();
                                }
                    });
                })
                
                test("Save scale 2",function(){
                    stop();
                    scales.add({name: "Test2", description:'test scale2'});
                    scale2 = scales.at(1);
                    AnnotationsSync('update',scale2,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(data.id!==undefined,"Id has been set");
                                    ok(_.isObject(data), "Got scale in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scale2.get("name"), "Name is correct");
                                    equal(data.description, scale2.get("description"), "Description is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    scale2.set(scale2.parse(data));
                                    start();
                                }
                    });
                })
                
                test("Add scale 1 to a video",function(){
                    stop();
                    
                    var copy = videoScales.addCopyFromTemplate(scale);
                    
                    var data = copy.toJSON();
                                
                    ok(_.isObject(data), "Got category in json");
                    ok(data.id, "Id is "+data.id);
                    notEqual(data.id,scale.id, "Id is different as template scale");
                    ok(data.created_at, "Created_at date is set");
                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname category id is correct");
                    ok(data.updated_at, "Updated_at date is set");
                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname category is correct");
                    start();

                });
                
                test("Get scale",function(){
                    stop(); 
                    AnnotationsSync('read',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got scale in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scale.get("name"), "Name is correct");
                                    equal(data.description, scale.get("description"), "Description is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });
                
                test("Update scale",function(){
                    stop();
                    scale.set("name", "quantity");
                    AnnotationsSync('update',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale updated");
                                    equal("quantity", data.name, "Name is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                })
                
                test("Get all scales", function(){
                    stop();
                    AnnotationsSync('read',scales,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Got all scales!");
                                    ok(_.isArray(data.scales), "Got all scales");
                                    equal(data.scales.length, 2, "Two scales are successfully returned");
                                    start();
                                }
                    });
                })
                
                /* SCALE VALUE tests */
                module("ScaleValue", { setup : function(){
                        if(!isUserLoaded)loadUser();
                        if(!isVideoLoaded)loadVideo();
                        if(!isScaleLoaded)loadScale();
                        if(!isScaleValueLoaded)loadScaleValue();
                    }
                });
                
                test("Save scale value",function(){
                    stop();
                    
                    AnnotationsSync('create',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(data.id!==undefined,"Id has been set");
                                    ok(_.isObject(data), "Got scaleValue in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scaleValue.get("name"), "Name is correct");
                                    equal(data.value, scaleValue.get("value"), "Value is correct");
                                    equal(data.order, scaleValue.get("order"), "Order is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    scaleValue.set(scaleValue.parse(data));
                                    start();
                                }
                    });
                })
                
                test("Save scale value 2",function(){
                    stop();
                    scaleValues.add({name:'stark',value:1.5,order:2});
                    scaleValue2 = scaleValues.at(1);
                    AnnotationsSync('update',scaleValue2,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Saved successfully");
                                    ok(data.id!==undefined,"Id has been set");
                                    ok(_.isObject(data), "Got scaleValue in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scaleValue2.get("name"), "Name is correct");
                                    equal(data.value, scaleValue2.get("value"), "Value is correct");
                                    equal(data.order, scaleValue2.get("order"), "Order is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    scaleValue2.set(scaleValue2.parse(data));
                                    start();
                                }
                    });
                })
                
                test("Get scale value",function(){
                    stop();
                    AnnotationsSync('read',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got scaleValue in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, scaleValue.get("name"), "Name is correct");
                                    equal(data.value, scaleValue.get("value"), "Value is correct");
                                    equal(data.order, scaleValue.get("order"), "Order is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });
                
                test("Get all scale values from a copied scale",function(){
                    stop();
                    
                    var copyWithScaleValue = videoScales.addCopyFromTemplate(scale);
                    
                    AnnotationsSync('read',copyWithScaleValue.get("scaleValues"),{
                        
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Get all scale values successfully");
                            ok(_.isArray(data.scaleValues), "Got all label");
                            equal(data.scaleValues.length, 2, "Two scale values are successfully returned");
                            notEqual(data.scaleValues[0].id,scaleValue.id, "Copied scale value has a different id");
                            start();
                        }
                    });
                });
                
                test("Update scale value",function(){
                    stop();
                    scaleValue.set("name", "schwach");
                    AnnotationsSync('update',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Video updated");
                                    equal("schwach", data.name, "Name is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                })
                
                test("Get all scale values from a scale", function(){
                    stop();
                    AnnotationsSync('read',scaleValues,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all scale values successfully");
                                    ok(_.isArray(data.scaleValues), "Got all scale Values");
                                    equal(data.scaleValues.length, 2, "Two scale values are successfully returned");
                                    start();
                                }
                    });
                })
                
                /* DELETE tests */
                module("Deletion", {
                    setup: function(){
                        if(!isUserLoaded)loadUser();
                        if(!isVideoLoaded)loadVideo();
                        if(!isScaleLoaded)loadScale();
                        if(!isScaleValueLoaded)loadScaleValue();
                    }
                });
                
                test("Delete scale value",1,function(){
                    stop();
                    AnnotationsSync('delete',scaleValue,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale value deleted.");                                    
                                    start();
                                }
                    });
                })
                
                test("Delete scale value 2",1,function(){
                    stop();
                    AnnotationsSync('delete',scaleValue2,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale value 2 deleted.");                                    
                                    start();
                                }
                    });
                })
                
                test("Get deleted scale value",1,function(){
                    stop();
                    AnnotationsSync('read',scaleValue,{
                                error: function(error){
                                    ok(true, "Try to get scale value but should not exist: "+error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(false, "Got scale value");
                                    start();
                                }
                    });
                })
                
                test("Delete scale",1,function(){
                    stop();
                    AnnotationsSync('delete',scale,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale deleted.");                                    
                                    start();
                                }
                    });
                })
                
                test("Delete scale 2",1,function(){
                    stop();
                    AnnotationsSync('delete',scale2,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Scale 2 deleted.");                                    
                                    start();
                                }
                    });
                })
                
                test("Get deleted scale",1,function(){
                    stop();
                    AnnotationsSync('read',scale,{
                                error: function(error){
                                    ok(true, "Try to get scale but should not exist: "+error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(false, "Got scale");
                                    start();
                                }
                    });
                })
        })
});
