/**
 * Bootstrap file for require.js
 */
require(["domReady",
         "jquery",
         "i18next",
         "i18next-xhr-backend",
         "jquery-i18next",
         "i18next-browser-language-detector",
         "moment",
         "annotations-tool-configuration"],

    function (domReady, $, i18next, i18nextXHRBackend, $i18next, LngDetector, moment, config) {
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
                moment.locale(i18next.language);
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