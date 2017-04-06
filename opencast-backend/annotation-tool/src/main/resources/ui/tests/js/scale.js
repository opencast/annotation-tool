require(['jquery',
         'models/scale',
         'access'],
                    
        function($,Scale,ACCESS){
                
                var scale;

                module("scale",  {
                        setup: function() {
                            scale = new Scale({name: "Test scale"});
                        }
                });
                
                test("Initial required parameters", 1, function(){
                    try{
                        var unvalidScale = new Scale();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };
                });
                
                test("Name", 1, function() {                    
                    var text = "Simple test name.";
                    scale.set({name:text});
                    equal(scale.get('name'), text, "Scale  should have "+text+" as name.");
                });
                
                test("Description", 2, function() {
                    stop();
                    scale.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            scale.unbind('error');
                            start();
                    });
                    scale.set({description:12});
                    
                    var text = "Simple text created for unit tests.";
                    scale.set({description:text});
                    equal(scale.get('description'), text, "Scale  should have "+text+" as describtion.");
                });
                
                test("Scale values", 1, function() {
                    var scaleValues = scale.get('scaleValues');
                    
                    equal(scaleValues.size(), 0, "Scale  should have 0 scale values.");
                });
                
                test("Access", function() {
                    stop();
                    scale.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            scale.unbind('error');
                            start();
                    });
                    scale.set({access:"Tata"});
                    
                    scale.set({access:ACCESS.PRIVATE});
                    equal(scale.get('access'), ACCESS.PRIVATE, "scale  should have "+ACCESS.PRIVATE+" as access attribute.");
                });
            
});