require(['jquery',
         'models/category',
         'collections/categories',
         'access'],
                    
        function($,Category,Categories,ACCESS){

            var categories,category = null;

            module("Categories",  {
                    setup: function() {
                        categories = new Categories([],{id:123,collection:{},url:function(){return 'test';}});
                        category = categories.create({name:"test category"});
                        categories.add([{name:"test1"}]);
                    }
            });
            
            test("Add", 2, function() {
                equal(categories.size(),2,"Should have 2 elements");                 
                categories.add([{name:"test2"}]);
                equal(categories.size(),3, "Should have 3 elements");
            });
            
            test("Get", function() {
                var newCategory = categories.get(category.get('id'));
                equal(category.get('id'), newCategory.get('id'),"Category should have id "+category.get('id'));                 
            });
            
            test("Remove", function() {
                categories.remove(category)
                equal(categories.size(),1, "Should have 1 element");
            });
            
            test("Copy", function() {
                var newCategory = categories.addCopyFromTemplate(category);
                notEqual(newCategory.get('id'), category.get('id'),"Copied category should have a different id as "+category.get('id'));    
            }); 
            
});