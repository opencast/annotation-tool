/**
 * Bootstrap file for require.js
 */
require(["domReady",
         "jquery",
         "i18next",
         "i18next-xhr-backend",
         "jquery-i18next",
         "i18next-browser-language-detector",
         "annotations-tool-configuration"],

    function (domReady, $, i18next, i18nextXHRBackend, $i18next, LngDetector, config) {
        i18next
            .use(i18nextXHRBackend)
            .use(LngDetector)
            .init({
                backend: {
                    loadPath: "locales/{{lng}}/translation.json"
                },
                detection: {
                    caches: []
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