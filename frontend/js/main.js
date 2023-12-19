/**
 * Bootstrap file for require.js
 */
require(
    [
        "domReady",
        "jquery",
        "i18next",
        "i18next-http-backend",
        "jquery-i18next",
        "i18next-browser-language-detector",
        "moment",
        "mediaelementplayer",
        "configuration",
        "integration",
        // Include all the bootstrap stuff since it is kind of hopeless
        // to include only what you need when you need it, all of this
        // operating on the global scope and all.
        "bootstrap"
    ],
    function (
        domReady,
        $,
        i18next,
        i18nextHTTPBackend,
        $i18next,
        LngDetector,
        moment,
        mejs,
        configuration,
        integration
    ) {
        "use strict";

        i18next
            .use(i18nextHTTPBackend)
            .use(LngDetector)
            .init({
                fallbackLng: "en",
                backend: {
                    loadPath: "locales/{{lng}}/translation.json"
                },
                detection: {
                    caches: []
                },
                interpolation: {
                    format: function (value, format, lng) {
                        if (format.startsWith("lookup:")) {
                            var key = format.split(":")[1].replace("_", value);
                            return i18next.t(key);
                        }
                        return value;
                    }
                }
            }, function () {
                moment.locale(i18next.language);
                $i18next.init(i18next, $, {
                    useOptionsAttr: true,
                    parseDefaultValueFromContent: false
                });

                var mediaelementLanguage;
                function start() {
                    mejs.i18n.language(mediaelementLanguage);
                    domReady(function () {
                        $("[data-i18n]").localize();
                        require(["annotation-tool"], function (app) {
                            app.start(configuration, integration);
                        });
                    });
                }

                // Before we actually run the above startup code,
                // which implictly initializes a `MediaElementPlayer` on the page,
                // we need to load the localization files for that library,
                // that correspond to our detected language.

                // This is going to be a bit awkward, so bear with me.
                // There is no built in way to query the availability of a language
                // or the path to its translation files in the library,
                // so we have to guess a bit.
                // I make no claim that this is in any way a robust and/or sophisticated algorithm!

                // `i18next` and `mediaelement` both use IETF language tags to identify languages.
                // However, the latter library uses lower case only.
                // So our first guess will be to just use the lowercases detected language tag.
                mediaelementLanguage = i18next.language.toLowerCase();
                (function guess() {
                    require(
                        ["mediaelement/lang/" + mediaelementLanguage],
                        start,
                        // If that worked, we can jsut start the app.
                        function () {
                            // If this fails, we strip a subtag from the last guess and try again.
                            var subtagStart = mediaelementLanguage.lastIndexOf("-");
                            if (subtagStart >= 0) {
                                mediaelementLanguage = mediaelementLanguage.slice(0, subtagStart);
                                guess();
                            } else {
                                // This of course only works if there is still a subtag to strip.
                                // If not, we just start the app anyway.
                                // The player will then fallback to English.
                                start();
                            }
                        }
                    );
                })();
            });
    }
);
