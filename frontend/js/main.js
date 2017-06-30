/**
 * Bootstrap file for require.js
 */
require(["domReady",
         "jquery",
         "i18next",
         "i18next-xhr-backend",
         "jquery-i18next",
         "annotations-tool-configuration"],

    function (domReady, $, i18next, i18nextXHRBackend, $i18next, config) {
        i18next.use(i18nextXHRBackend)
            .init({
                lng: "en",
                backend: {
                    loadPath: "locales/{{lng}}/translation.json"
                }
            }, function () {
                $i18next.init(i18next, $, { parseDefaultValueFromContent: false });
                domReady(function(){
                    $('[data-i18n]').localize();
                    require(["annotations-tool"], function (app) {
                        app.start(config);
                    });
                });
            });
    }
);