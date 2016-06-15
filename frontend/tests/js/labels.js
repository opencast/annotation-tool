require(['jquery',
         'models/label',
         'models/category',
         'collections/labels',
         'access'],
                    
        function($,Label,Category,Labels,ACCESS){

                
                var labels,label,category;
                
                module("Labels",  {
                        setup: function() {
                            category = new Category({name: "Test category"});
                            labels = new Labels([],{id:123,collection:{},url:function(){return 'test';}});
                            label = labels.create({value:"label 1",abbreviation:"lbl1",category:category});
                            labels.add([{value:"label 1",abbreviation:"lbl1",category:category}]);
                        }
                });
                
                test("Add", 2, function() {
                    equal(labels.size(),2,"Should have 2 elements");                 
                    labels.add([{value:"label 2",abbreviation:"lbl2",category:category}]);
                    equal(labels.size(),3, "Should have 3 elements");
                });
                
                test("Get", function() {
                    var newLabel = labels.get(label.get('id'));
                    equal(label.get('id'), newLabel.get('id'),"Label should have id "+label.get('id'));                 
                });
                
                test("Remove", function() {
                    labels.remove(label)
                    equal(labels.size(),1, "Should have 1 element");
                });
            
});