require(['jquery',
         'underscore',
         'models/video',
         'collections/videos'],
                    
        function($, _, Video, Videos){
                
                var video, videos;

                
                module("Video",  {
                        setup: function() {
                            videos = new Videos();
                            video = videos.create({video_extid:'matterhorn123'});
                        }
                });
                
                
                test("Video_extid", function() {
                    var newExtid = "matterhorn1234";
                    video.set({video_extid:newExtid});
                    equal(video.get('video_extid'), newExtid, "video  should have "+newExtid+" as video_extid attribute.");

                });

                test("Tags", function() {
                    stop();

                    var stringsTags = '{"tag1":1}',
                        jsonTags    = {tag1:1},
                        unvalidTags = "unvalid";
                    
                    
                    video.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);


                            video.bind('change',function(model,error){
                                equal(video.get('tags'), stringsTags, "Video should have "+stringsTags+" as description attribute.");
                                video.unbind('change');
                                start();
                            });
                            video.set({tags:stringsTags});
                            
                    });
                    video.set({tags:unvalidTags});                    
                });
            
});