require(['jquery',
         'models/scale',
         'collections/scales',
         'access'],
                    
        function($,Scale,Scales,ACCESS){
                
                var scale,scales;
                
                module("Scales",  {
                        setup: function() {
                            scales = new Scales([],{id: 123, collection:{}, url:function(){return 'test';}});
                            scale = new Scale({name:"scale 1"});
                            scales.add([{name:"scale 2"},scale]);
                        }
                });
                
                test("Add", 2, function() {
                    equal(scales.size(),2,"Should have 2 elements");                 
                    scales.add(new Scale({name:"scale 3"}));
                    equal(scales.size(),3, "Should have 3 elements");
                });
                
                test("Get", function() {
                    var newScale = scales.get(scale.get('id'));
                    equal(scale.get('id'), newScale.get('id'),"Scale should have id "+scale.get('id'));                 
                });
                
                test("Remove", function() {
                    scales.remove(scale)
                    equal(scales.size(),1, "Should have 1 element");
                });
                
                test("Copy", function() {
                    var newScale = scales.addCopyFromTemplate(scale);
                    notEqual(scale.get('id'), newScale.get('id'),"Copied scale should have a different id as "+scale.get('id'));    
                }); 
            
});