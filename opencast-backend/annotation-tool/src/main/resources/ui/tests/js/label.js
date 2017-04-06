require(['jquery',
         'models/label',
         'models/category',
         'access'],
                    
        function($,Label,Category, ACCESS){
        
                
                var category, label;
                
                module("Label",  {
                        setup: function() {
                            category = new Category({name: "Test category"});
                            label = new Label({
                                value: "1",
                                abbreviation: 'one',
                                category: category
                            })
                        }
                });
                
                test("Initial required parameters", 1, function(){
                    try{
                        var unvalidLabel = new Label();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };
                });
                
                test("Value", 2, function() {
                    stop();
                    label.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            label.unbind('error');
                            start();
                    });
                    label.set({value:12});
                    
                    var text = "Basic value.";
                    label.set({value:text});
                    equal(label.get('value'), text, "Label  should have '"+text+"' as value.");
                });
                
                test("Abbreviation", 2, function() {
                    stop();
                    label.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            label.unbind('error');
                            start();
                    });
                    label.set({abbreviation:12});
                    
                    var text = "ABBR.";
                    label.set({abbreviation:text});
                    equal(label.get('abbreviation'), text, "Label  should have '"+text+"'as abbreviation.");
                });
                
                test("Description", 2, function() {
                    stop();
                    label.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            label.unbind('error');
                            start();
                    });
                    label.set({description:12});
                    
                    var text = "Simple description.";
                    label.set({description:text});
                    equal(label.get('description'), text, "Label  should have '"+text+"' as description.");
                });
                
                test("Settings", 2, function() {
                    stop();
                    label.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            label.unbind('error');
                            start();
                    });
                    label.set({settings:12});
                    
                    var text = "Simple settings.";
                    label.set({settings:text});
                    equal(label.get('settings'), text, "Label  should have '"+text+"' as settings.");
                });
                
                test("Category", 2, function() {
                    stop();
                    label.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            label.unbind('error');
                            start();
                    });
                    label.set({category:"wrong category"});
                    
                    label.set({category:category});
                    equal(label.get('category'), category, "Label  should have "+category.get("name")+" as category.");
                });
                
                test("Access", function() {
                    stop();
                    label.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            label.unbind('error');
                            start();
                    });
                    label.set({access:"Tata"});
                    
                    label.set({access:ACCESS.PRIVATE});
                    equal(label.get('access'), ACCESS.PRIVATE, "label  should have "+ACCESS.PRIVATE+" as access attribute.");
                });
            
});