define(['jquery',
         'models/annotation',
         'access'],
                    
        function($, Annotation, ACCESS){
    
                
                var annotation = null;

                
                module("Annotation",  {
                        setup: function() {
                            annotation = new Annotation({start:12});
                        }
                });
                
                test("Initial required parameters", 1, function() {
                    try{
                        var unvalidAnnotation = new Annotation();
                    }
                    catch(error){
                        ok(true,"Error catched: "+error);
                    };

                });
                
                test("Text", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({text:12});
                    
                    var text = "Simple text created for unit tests.";
                    annotation.set({text:text});
                    equal(annotation.get('text'), text, "annotation  should have "+text+" as text attribute.");

                });
                
                test("Start", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({start:"Tata"});
                    
                    var newStart = 12;
                    annotation.set({start:newStart});
                    equal(annotation.get('start'), newStart, "annotation  should have "+newStart+" as start attribute.");
                });
                
                test("Duration", 3, function() {
                    stop();
                    var nbError=0;
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error); 
                            if(nbError++ > 0)
                                annotation.unbind('error');
                            start();
                    });
                    annotation.set({duration:"Tata"});
                    annotation.set({duration:-12});
                    
                    var newDuration = 12;
                    annotation.set({duration:newDuration});
                    equal(annotation.get('duration'), newDuration, "annotation  should have "+newDuration+" as duration attribute.");
                });
                
                test("Access", function() {
                    stop();
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);
                            annotation.unbind('error');
                            start();
                    });
                    annotation.set({access:"Tata"});

                    annotation.set({access:ACCESS.PRIVATE});
                    equal(annotation.get('access'), ACCESS.PRIVATE, "annotation  should have "+ACCESS.PRIVATE+" as access attribute.");
                });

                test("Tags", function() {
                    stop();

                    var stringsTags = '{"tag1":1}',
                        jsonTags    = {tag1:1},
                        unvalidTags = "unvalid";
                    
                    
                    annotation.bind('error',function(model,error){
                            ok(true,"Can not be modified, error: " + error);


                            annotation.bind('change',function(model,error){
                                equal(annotation.get('tags'), stringsTags, "Annotation should have "+stringsTags+" as description attribute.");
                                annotation.unbind('change');
                                start();
                            });
                            annotation.set({tags:stringsTags});
                            
                    });
                    annotation.set({tags:unvalidTags});                    
                });

            
});