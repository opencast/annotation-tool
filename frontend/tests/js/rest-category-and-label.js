define(['models/category',
         'models/video',
         'models/user',
         'collections/categories',
         'collections/videos',
         'collections/users',
         'backbone-annotations-sync',
         'underscore',
         'backbone'],
                    
        function(Category, Video, User, Categories, Videos, Users, AnnotationsSync){
            
                Backbone.sync = AnnotationsSync;
                
                var category, 
                    categories, 
                    videos, 
                    video, 
                    users, 
                    user, 
                    videoCategories, 
                    label, labels, 
                    videoLabels,
                    setupLoaded = false,
                    loadUser,
                    setup,
                    tags = {"tag":"test tag"},
                    userExtId;
                
                loadUser = function(){
                    users = new Users();
                    var userExtId = window.annotationTool.getUserExtId();
                    users.create({user_extid:userExtId,nickname:'pinguin', email: "test@dot.com"});
                    user = users.at(0);
                    window.annotationTool.user = user;
                    isUserLoaded = true;
                }
                
                setup = function(){
                    if(!setupLoaded){
                        loadUser();
                        
                        categories = new Categories([]);
                        categories.create({
                                name: "Test category",
                                description: "Category created for the tests",
                                tags: tags
                        });
                        category        = categories.at(0);
                        labels          = category.get("labels");

                        videos          = new Videos();                        
                        video           = videos.create({video_extid:'category'});

                        isVideoLoaded   = true;
                        videoCategories = video.get("categories");
                        setupLoaded     = true;
                    }
                }
                
                module("Category",{ setup : setup });

                test("Create a 'template' category",function(){
                    stop();
                    
                    AnnotationsSync('create',category,{
                        
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Saved successfully");
                            ok(category.id!== undefined,"Id has been set");
                            category.set(category.parse(data));
                            start();
                        }
                    });
                });
                
                test("Get a 'template' category",function(){
                    stop();
                    
                    AnnotationsSync('read',category,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    equal(data.name, category.get("name"), "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    ok(_.isEqual(data.tags, category.get("tags")), "Tags are correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });

                test("Add a category to a video",function(){
                    stop();
                    
                    var copy = videoCategories.addCopyFromTemplate(category);
                    
                    var data = copy.toJSON();
                                
                    ok(_.isObject(data), "Got category in json");
                    ok(data.id, "Id is "+data.id);
                    notEqual(data.id,category.id, "Id is different as template category");
                    equal(data.name, category.get("name"), "Name is correct");
                    equal(data.description, category.get("description"), "Description is correct");
                    ok(_.isEqual(JSON.parse(data.tags), category.get("tags")), "Tags are correct");
                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                    ok(data.created_at, "Created_at date is set");
                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                    ok(data.updated_at, "Updated_at date is set");
                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                    start();

                });
                
                test("Get a category from a video",function(){
                    stop();
                    
                    AnnotationsSync('read',videoCategories.at(0),{

                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    notEqual(data.id,category.id, "Id is different as template category");
                                    equal(data.name, category.get("name"), "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    ok(_.isEqual(data.tags, category.get("tags")), "Tags are correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    ok(data.updated_at, "Updated_at date is set");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });
                
                test("Update a 'template' category",function(){
                    stop();
                    
                    var newName = "The new category from a video";
                    category.set({name: newName});
                    
                    AnnotationsSync('update',category,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    equal(data.id,category.id, "Id is correct");
                                    equal(data.name, newName, "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    ok(_.isEqual(data.tags, category.get("tags")), "Tags are correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });
                
                test("Update a category from a video",function(){
                    stop();
                    
                    var newName = "The new category from a video";
                    videoCategories.at(0).set({name: newName});
                    
                    AnnotationsSync('update',videoCategories.at(0),{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    notEqual(data.id,category.id, "Id is different as template category");
                                    equal(data.name, newName, "Name is correct");
                                    equal(data.description, category.get("description"), "Description is correct");
                                    ok(_.isEqual(data.tags, category.get("tags")), "Tags are correct");
                                    equal(data.has_duration, category.get("has_duration"), "Duration is correct");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });
            
                
                test("Get all 'template' categories", function(){
                    stop();
                    AnnotationsSync('read',categories,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all categories successfully");
                                    ok(_.isArray(data.categories), "Got all categories");
                                    equal(data.categories.length, 1, "One categories are successfully returned");
                                    start();
                                }
                    });
                });
                
                test("Get all categories from video", function(){
                    stop();
                    AnnotationsSync('read',videoCategories,{
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(true, "Get all categories successfully");
                                    ok(_.isArray(data.categories), "Got all categories");
                                    equal(data.categories.length, 1, "One categories are successfully returned");
                                    start();
                                }
                    });
                });
                
                
                module("Labels",{ setup : setup });
                
                test("Create a 'template' label",function(){
                    
                    var categoryJSON = category.toJSON();
                    delete categoryJSON.labels;
                    
                    label = labels.create({
                        value: "Test label",
                        abbreviation: "TL",
                        category: categoryJSON
                    })
                    
                    ok(label.id!== undefined,"Id has been set");
                    ok(label.get("created_at"), "Created_at date is set");
                    equal(label.get("created_by_nickname"), user.get('nickname'), "Created_by_nickname date id is correct");
                    ok(label.get("updated_at"), "Updated_at date is set");
                    equal(label.get("updated_by_nickname"), user.get('nickname'), "Updated_by_nickname date is correct");
                });
                
                test("Get a 'template' label",function(){
                    stop();
                    
                    
                    AnnotationsSync('read',label,{
                        
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Saved successfully");
                            ok(label.id!== undefined,"Id has been set");
                            ok(_.isObject(data), "Got label in json");
                            equal(data.value, label.get("value"), "Value is correct");
                            equal(data.abbreviation, label.get("abbreviation"), "Abreviation is correct");
                            equal(data.category.id, label.get("category").id, "Category is correct");
                            ok(data.created_at, "Created_at date is set");
                            equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                            ok(data.updated_at, "Updated_at date is set");
                            equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname category is correct");
                            start();
                        }
                    });
                });
                
                test("Get all labels from a copied category",function(){
                    stop();
                    
                    var copyWithLabel = videoCategories.addCopyFromTemplate(category);
                    
                    AnnotationsSync('read',copyWithLabel.get("labels"),{
                        
                        error: function(error){
                            ok(false, error);
                            start();
                        },
                        
                        success: function(data){
                            ok(true, "Get all labels successfully");
                            ok(_.isArray(data.labels), "Got all label");
                            equal(data.labels.length, category.get("labels").length, "One label are successfully returned");
                            if (data.labels.length > 0) {
                                notEqual(data.labels[0].id,label.id, "Copied label has a different id");
                            }
                            start();
                        }
                    });
                });
                
                test("Update a 'template' label",function(){
                    stop();
                    
                    var newValue = "Super!";
                    label.set({value: newValue});
                            
                    AnnotationsSync('update',label,{
            
                                error: function(error){
                                    ok(false, error);
                                    start();
                                },
                                
                                success: function(data){
                                    ok(_.isObject(data), "Got category in json");
                                    ok(data.id, "Id is "+data.id);
                                    notEqual(data.id,category.id, "Id is different as template category");
                                    equal(data.value, newValue,"Value setted correctly");
                                    ok(data.created_at, "Created_at date is set");
                                    equal(data.created_by_nickname, user.get('nickname'), "Created_by_nickname is correct");
                                    equal(data.updated_by_nickname, user.get('nickname'), "Updated_by_nickname is correct");
                                    start();
                                }
                    });
                });
                

            
});
