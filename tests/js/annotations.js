require(['jquery',
         'models/annotation',
         'collections/annotations',
         'access'],
                    
        function($, Annotation, Annotations, ACCESS){
        
                
                var annotations, 
                    annotation,
                    add,
                    get;

                module("Annotations",  {
                        setup: function() {
                            var trackMockup = {
                                id: 123, 
                                collection:{}, 
                                url: function () {
                                    return 'test';
                                },
                                bind: function () {

                                },
                                get: function () {

                                }
                            }

                            annotations = new Annotations([], trackMockup);
                            annotation = new Annotation({start:5, id:12});
                            annotations.add([{start:4}, annotation]);
                        }
                });
                

                test("Add", 2, function() {
                    equal(annotations.size(),2,"Should have 2 elements");                 
                    annotations.add(new Annotation({start:11}));
                    equal(annotations.size(),3, "Should have 3 elements");
                });

            

                test("Get", function() {
                    var newAnnotation = annotations.get(annotation.get('id'));
                    equal(annotation.get('id'), newAnnotation.get('id'), "annotation should have id " + annotation.get('id'));                 
                });

                
                test("Remove", function() {
                    annotations.remove(annotation)
                    equal(annotations.size(),1, "Should have 1 element");
                });
            
});