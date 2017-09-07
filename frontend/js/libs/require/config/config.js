// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        "annotations-tool": "annotations-tool",
        "annotations-tool-configuration": "annotations-tool-configuration",
        "backbone": "libs/backbone/backbone-0.9.9",
        "bootstrap": "libs/bootstrap/bootstrap.min",
        "carousel": "libs/bootstrap/carousel2.2",
        "domReady": "libs/require/config/domReady",
        "handlebars": "libs/handlebars-v1.3.0",
        "handlebarsHelpers": "handlebarsHelpers",
        "jquery.colorPicker": "libs/jquery.colorPicker.min",
        "jquery.FileReader": "libs/jquery.FileReader",
        "jquery.appear": "libs/jquery.appear",
        "localstorage": "libs/backbone/backbone.localStorage-1.0",
        "jquery": "libs/jquery-1.7.2",
        "popover": "libs/bootstrap/popover",
        "scrollspy": "libs/bootstrap/scrollspy",
        "slider": "libs/bootstrap/bootstrap-slider",
        "tab": "libs/bootstrap/tab",
        "templates": "../templates",
        "text": "libs/require/config/text",
        "tooltip": "libs/bootstrap/tooltip",
        "timeline": "libs/timeline-min",
        "underscore": "libs/underscore-min",
        "raf": "libs/rAF",
        "email-addresses": "libs/email-addresses.min",
        "mousetrap": "libs/mousetrap.min",
        "i18next": "libs/i18next.min",
        "i18next-xhr-backend": "libs/i18nextXHRBackend.min",
        "i18next-browser-language-detector": "libs/i18nextBrowserLanguageDetector.min",
        "jquery-i18next": "libs/jquery-i18next.min",
        "moment": "libs/moment-with-locales",
        "mediaelementplayer": "libs/mediaelement/mediaelement-and-player.min",
        "mediaelement/lang": "libs/mediaelement/lang",
        "sortable": "libs/Sortable.min"
    },
    waitSeconds: 10,

    shim: {
        "handlebarsHelpers": ["handlebars"],

        "handlebars": {
            exports: "Handlebars"
        },

        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },

        "localstorage": ["backbone"],

        "jquery.FileReader": ["jquery"],

        "jquery.colorPicker": ["jquery"],

        "jquery.appear": ["jquery"],

        "bootstrap": ["jquery"],
        "scrollspy": ["bootstrap"],
        "carousel": ["bootstrap"],
        "tab": ["bootstrap"],
        "slider": ["jquery"],

        "email-addresses": {
            exports: "emailAddresses"
        },

        "timeline": {
            exports: "links"
        },

        "mediaelementplayer": {
            exports: "mejs",
            deps: ["jquery"]
        }
    }
});
