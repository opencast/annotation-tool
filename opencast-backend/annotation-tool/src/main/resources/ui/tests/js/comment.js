require(['jquery',
         'models/comment',
         'access'],
                    
        function($,Comment, ACCESS){
                
            var annotation, comment;
            
            module("Comment",  {
                    setup: function() {
                        comment = new Comment({
                            text: "New comment"
                        })
                    }
            });
            
            test("Initial required parameters", 1, function(){
                try{
                    var unvalidComment = new Comment();
                }
                catch(error){
                    ok(true,"Error catched: "+error);
                };
            });
            
            test("Text", 2, function() {
                stop();
                comment.bind('error',function(model,error){
                        ok(true,"Can not be modified, error: " + error);
                        comment.unbind('error');
                        start();
                });
                comment.set({text:12});
                
                var text = "Any comment.";
                comment.set({text:text});
                equal(comment.get('text'), text, "Comment should have '"+text+"' as text.");
            });
            
            test("Access", function() {
                stop();
                comment.bind('error',function(model,error){
                        ok(true,"Can not be modified, error: " + error);
                        comment.unbind('error');
                        start();
                });
                comment.set({access:"Tata"});
                
                comment.set({access:ACCESS.PRIVATE});
                equal(comment.get('access'), ACCESS.PRIVATE, "Comment should have "+ACCESS.PRIVATE+" as access attribute.");
            });
                
});