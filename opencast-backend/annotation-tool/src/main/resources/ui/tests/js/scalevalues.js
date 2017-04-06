require(['domReady',
         'jquery',
         'models/scalevalue',
         'collections/scalevalues',
         'access'],
                    
        function(domReady,$,ScaleValue,ScaleValues,ACCESS){
        
            domReady(function(){
                
                var scaleValue,scaleValues;

                module("Scale values",  {
                        setup: function() {
                            scaleValues = new ScaleValues([],{id: 123, collection:{}, url:function(){return 'test';}});
                            scaleValue = new ScaleValue({
                                name: "scaleValue 1",
                                value: 1,
                                order: 1    
                            });
                            scaleValues.add([{
                                name: "scaleValue 2",
                                value: 2,
                                order: 2    
                            },scaleValue]);
                        }
                });
                
                test("Add", 2, function() {
                    equal(scaleValues.size(),2,"Should have 2 elements");                 
                    scaleValues.add(new ScaleValue({
                                name: "scaleValue 3",
                                value: 3,
                                order: 3    
                    }));
                    equal(scaleValues.size(),3, "Should have 3 elements");
                });
                
                test("Get", function() {
                    var newScaleValue = scaleValues.get(scaleValue.get('id'));
                    equal(scaleValue.get('id'), newScaleValue.get('id'),"Scale value should have id "+scaleValue.get('id'));                 
                });
                
                test("Remove", function() {
                    scaleValues.remove(scaleValue)
                    equal(scaleValues.size(),1, "Should have 1 element");
                });
                
                  
            });
            
});