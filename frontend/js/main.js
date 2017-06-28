/**
 * Bootstrap file for require.js
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