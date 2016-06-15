define(['jquery',
         'models/category',
         'access'],
                    
        function($,Category,ACCESS){
        
                var category;
                
                module("Category",  {
                        setup: function() {
                            category = new Category({name: "Test name"});
                        }
                });
                
                test("Initial required parameters", 1, function(){
                    try{
                        var unvalidCategory = new Category();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };
                });
                
                test("Name", 1, function() {                    
                    var text = "Simple test name.";
                    category.set({name:text});
                    equal(category.get('name'), text, "Category  should have "+text+" as name.");
                });
                
                test("Description", 2, function() {
                    stop();
                    category.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            category.unbind('error');
                            start();
                    });
                    category.set({description:12});
                    
                    var text = "Simple text created for unit tests.";
                    category.set({description:text});
                    equal(category.get('description'), text, "Category  should have "+text+" as describtion.");
                });
                
                test("Settings", 2, function() {
                    stop();
                    category.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            category.unbind('error');
                            start();
                    });
                    category.set({settings:12});
                    
                    var text = "Simple settings.";
                    category.set({settings:text});
                    equal(category.get('settings'), text, "Label  should have '"+text+"' as settings.");
                });
                
                test("Labels", 1, function() {
                    var labels = category.get('labels');
                    
                    equal(labels.size(), 0, "Category  should have 0 labels");
                });
                
                test("Access", function() {
                    stop();
                    category.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            category.unbind('error');
                            start();
                    });
                    category.set({access:"Tata"});
                    
                    category.set({access:ACCESS.PRIVATE});
                    equal(category.get('access'), ACCESS.PRIVATE, "Category  should have "+ACCESS.PRIVATE+" as access attribute.");
                });

                test("Tags", function() {
                    stop();

                    var stringsTags = '{"tag1":1}',
                        jsonTags    = {tag1:1},
                        unvalidTags = "unvalid";
                    
                    
                    category.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);


                            category.bind('change',function(model,error){
                                equal(category.get('tags'), stringsTags, "Category should have "+stringsTags+" as description attribute.");
                                category.unbind('change');
                                start();
                            });
                            category.set({tags:stringsTags});
                            
                    });
                    category.set({tags:unvalidTags});                    
                });
            
});