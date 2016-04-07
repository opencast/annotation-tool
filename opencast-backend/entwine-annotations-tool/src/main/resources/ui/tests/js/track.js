require(['jquery',
         'models/track',
         'collections/tracks',
         'access'],
                    
        function($,Track,Tracks, ACCESS){
                
                var track = null;

                module("Track",  {
                        setup: function() {
                            var tracks = new Tracks([],{id:123,collection:{url:"test"},url: function(){ return "test";}});
                            track = tracks.create({name:'My test track'});
                        }
                });
                
                test("Initial required parameters", 1, function() {
                    try{
                        var unvalidTrack = new Track();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };

                });
                
                test("Description", function() {
                    stop();
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');
                            start();
                    });
                    track.set({description:12});
                    
                    var desc = "Simple track created for unit tests.";
                    track.set({description:desc});
                    equal(track.get('description'), desc, "Track  should have "+desc+" as description attribute.");

                });
                
                test("Settings", function() {
                    stop();
                    var newSettings = '{"color":"blue"}';
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');

                            track.bind('change',function(model,error){
                                equal(track.get('settings'), newSettings, "Track  should have "+newSettings+" as settings attribute.");
                                track.unbind('change');
                                start();
                            });
                            track.set({settings:newSettings});
                    });
                    track.set({settings:12});
                });
                
                test("Access", function() {
                    stop();
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            track.unbind('error');
                            start();
                    });
                    track.set({access:"Tata"});

                    track.set({access:ACCESS.PRIVATE});
                    equal(track.get('access'), ACCESS.PRIVATE, "track  should have "+ACCESS.PRIVATE+" as access attribute.");
                });

                test("Tags", function() {
                    stop();

                    var stringsTags = '{"tag1":1}',
                        jsonTags    = {tag1:1},
                        unvalidTags = "unvalid";
                    
                    
                    track.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);


                            track.bind('change',function(model,error){
                                equal(track.get('tags'), stringsTags, "Track should have "+stringsTags+" as description attribute.");
                                track.unbind('change');
                                start();
                            });
                            track.set({tags:stringsTags});
                            
                    });
                    track.set({tags:unvalidTags});                    
                });   
            
});