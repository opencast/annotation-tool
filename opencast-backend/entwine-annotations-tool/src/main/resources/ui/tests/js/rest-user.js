define(['domReady',
         'jquery',
	     'models/user',
         'collections/users',
         'backbone-annotations-sync',
         'underscore',
         'backbone'],
                    
        function(domReady, $, User, Users, AnnotationsSync){

                Backbone.sync = AnnotationsSync;
                
                var user, 
                    users,
                    userExtId;
                
                users = new Users();
                userExtId = window.annotationsTool.getUserExtId();
                user = new User({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"});
                users.add(user);
                
                module("User");

                test("Save user",function(){    
                    stop();
                    AnnotationsSync('update',user,{
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Saved successfully");
                            ok(_.isObject(data), "Got user in json");
                            ok(data.id, "Id is "+data.id);
                            equal(data.user_extid, user.get("user_extid"), "Extid is correct");
                            equal(data.nickname, user.get("nickname"), "Nickname is correct");
                            equal(data.email, user.get("email"), "Email is correct");
                            ok(data.created_at, "Created_at date is set");
                            equal(data.created_by, data.id, "Created_by user id is correct");
                            ok(data.updated_at, "Updated_at date is set");
                            equal(data.updated_by, data.id, "Updated_by user is correct");
                            equal(data.deleted_at, null, "Deleted_at date is correct");
                            equal(data.deleted_by, null, "Deleted_by user is correct");
                            user.set(data);
                            window.annotationsTool.user = user;
                            start();
                        }
                    });
                })
                
                test("Get user",function(){
                    stop();
                    
                    AnnotationsSync('read',user,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got user in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.user_extid, user.get("user_extid"), "Extid is correct");
                                    equal(data.nickname, user.get("nickname"), "Nickname is correct");
                                    equal(data.email, user.get("email"), "Email is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by, data.id, "Created_by user id is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by, data.id, "Updated_by user is correct");
                                    equal(data.deleted_at, null, "Deleted_at date is wrong");
                                    equal(data.deleted_by, null, "Deleted_by user is wrong");
                                    start();
                                }
                    });
                });
            
});