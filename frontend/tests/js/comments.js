require(['jquery',
         'models/comment',
         'models/annotation',
         'collections/comments',
         'access'],
                    
        function($,Comment,Annotation,Comments,ACCESS){
        
            var comments,comment,annotation;
            
            module("Comments",  {
                    setup: function() {
                    	annotation = new Annotation({start:12});
                        comments = new Comments([],{id:123,collection:{},url:function(){return 'test';}});
                        comment = comments.create({text:"comment 1",annotation:annotation});
                        comments.add([{text:"comment 1",annotation:annotation}]);
                    }
            });
            
            test("Add", 2, function() {
                equal(comments.size(),2,"Should have 2 elements");                 
                comments.add([{text:"comment 2",annotation:annotation}]);
                equal(comments.size(),3, "Should have 3 elements");
            });
            
            test("Get", function() {
                var newComment = comments.get(comment.get('id'));
                equal(comment.get('id'), newComment.get('id'),"Comment should have id "+comment.get('id'));                 
            });
            
            test("Remove", function() {
                comments.remove(comment);
                equal(comments.size(),1, "Should have 1 element");
            });
            
});