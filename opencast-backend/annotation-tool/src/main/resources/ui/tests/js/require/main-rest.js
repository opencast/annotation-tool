/* Bootstrap script for require.js */
// RequireJS configuration for main app
define(["config"], function () {
    require(["jquery",
             "annotations-tool-configuration"
             //... add other test file here, files have to be in directory tests/js
             ],

            
            function($){
                    QUnit.config.reorder   = false;
                    QUnit.config.autostart = false;
                    QUnit.config.autorun = false;

                    QUnit.config.urlConfig.push({
                      id: "reset",
                      label: "Reset database",
                      tooltip: "Reset database before running the test."
                    });

                    require(["domReady",
                             "tests/rest-user",
                             "tests/rest-video-and-track",
                             "tests/rest-category-and-label",
                             "tests/rest-scale-and-scalevalue",
                             "tests/rest-comments"
                             ], 

                             function (domReady) {
                                domReady(function(){
                                  $("button").click(function() {

                                  $.ajax({
                                        type: "DELETE",
                                        async: false,
                                        url: window.annotationsTool.restEndpointsUrl + "/reset",
                                        success: function () {
                                          QUnit.start.call();
                                        }
                                  });

                                });
                                
                             });

                    });
            }
    );

});

