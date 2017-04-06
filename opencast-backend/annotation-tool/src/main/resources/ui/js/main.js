/**
 * Bootstrap file for the require.js optimization
 */
require(["domReady",
         "annotations-tool-configuration",
         "annotations-tool"],

        function (domReady, config, app) {
            domReady(function(){
                app.start(config);
            });
        }
);