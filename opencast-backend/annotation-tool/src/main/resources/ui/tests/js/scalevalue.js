require(['jquery',
         'models/scalevalue',
         'access'],
                    
        function($,ScaleValue,ACCESS){
                
                var scaleValue;
                
                module("Scale value",  {
                        setup: function() {
                            scaleValue = new ScaleValue({
                                name: "Test scaleValue",
                                value: 1.6,
                                order: 2
                            });
                        }
                });
                
                test("Initial required parameters", 1, function(){
                    try{
                        var unvalidScaleValues = new ScaleValue();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };
                });
                
                test("Name", 1, function() {                    
                    var text = "Simple test name.";
                    scaleValue.set({name:text});
                    equal(scaleValue.get('name'), text, "scaleValue  should have "+text+" as name.");
                });
                
                test("value", 2, function() {
                    stop();
                    scaleValue.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            scaleValue.unbind('error');
                            start();
                    });
                    scaleValue.set({value:"test"});
                    
                    var value = 1;
                    scaleValue.set({value:value});
                    equal(scaleValue.get('value'), value, "scaleValue  should have "+value+" as value.");
                });
                
                test("order", 2, function() {
                    stop();
                    scaleValue.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            scaleValue.unbind('error');
                            start();
                    });
                    scaleValue.set({order:"test"});
                    
                    var value = 1;
                    scaleValue.set({order:value});
                    equal(scaleValue.get('order'), value, "scaleValue  should have "+value+" as order.");
                });
                
                
                test("Access", function() {
                    stop();
                    scaleValue.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            scaleValue.unbind('error');
                            start();
                    });
                    scaleValue.set({access:"Tata"});
                    
                    scaleValue.set({access:ACCESS.PRIVATE});
                    equal(scaleValue.get('access'), ACCESS.PRIVATE, "scaleValue  should have "+ACCESS.PRIVATE+" as access attribute.");
                });
            
});