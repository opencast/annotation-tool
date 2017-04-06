require(['jquery',
	     'models/user'],
                    
        function($,User){
        
                
                var user = null;
                
                module("User",  {
                        setup: function() {
                            user = new User({user_extid:'testid',nickname:'pinguin'});
                        }
                });
                
                test("Initial required parameters", 1, function() {
                    try{
                        var wrongUser = new User({nickname:'pinguin'});
                    }
                    catch(error){
                        ok(true,"Error catched "+error);
                    };

                });
                
                
                test("Email", function() {
                    stop();
                    var validEmail = "www@dot.com";
                    user.bind('error',function(model,error){
                            ok(true,"Wrong email not accepted, error: " + error);
                            user.unbind('error');
                            start();
                    });
                    user.set({email:"blabla"});
                    
                    user.set({email:validEmail});
                    
                    equal(validEmail, user.get("email") , "User should have "+validEmail+" as email address.");
                });
                
                test("Nickname", function() {
                    var newNickname = "mario";

                    user.set({nickname:newNickname});
                    
                    equal(newNickname, user.get("nickname") , "User should have "+newNickname+" as nickname.");
                });
            
});