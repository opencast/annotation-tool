require(['jquery',
         'models/track',
         'collections/tracks',
         'access'],
                    
        function($,Track,Tracks,ACCESS){
                
                var tracks,track = null;
                
                module("Tracks",  {
                        setup: function() {
                            tracks = new Tracks([],{id:123,collection:{},url:function(){return 'test';}});
                            track = tracks.create({name:"test track"});
                            tracks.add([{name:"test1"}]);
                        }
                });
                
                test("Add", 2, function() {
                    equal(tracks.size(),2,"Should have 2 elements");                 
                    tracks.add([{name:"test2"}]);
                    equal(tracks.size(),3, "Should have 3 elements");
                });
                
                test("Get", function() {
                    var newTrack = tracks.get(track.get('id'));
                    equal(track.get('id'), newTrack.get('id'),"Track should have id "+track.get('id'));                 
                });
                
                test("Remove", function() {
                    tracks.remove(track)
                    equal(tracks.size(),1, "Should have 1 element");
                });
            
});