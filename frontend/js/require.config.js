// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        "annotation-tool": "annotation-tool",
        "annotation-tool-configuration": "annotation-tool-configuration",
        "backbone": "libs/backbone/backbone-0.9.9",
        "bootstrap": "libs/bootstrap/bootstrap.min",
        "chroma": "libs/chroma.min",
        "domReady": "libs/require/domReady",
        "handlebars": "libs/handlebars",
        "handlebarsHelpers": "handlebarsHelpers",
        "jquery.colorPicker": "libs/jquery.colorPicker.min",
        "jquery.appear": "libs/jquery.appear",
        "localstorage": "libs/backbone/backbone.localStorage-1.1.16",
        "jquery": "libs/jquery-1.8.0",
        "slider": "libs/bootstrap/bootstrap-slider",
        "templates": "../templates",
        "text": "libs/require/text",
        "underscore": "libs/underscore-min",
        "email-addresses": "libs/email-addresses.min",
        "mousetrap": "libs/mousetrap.min",
        "i18next": "libs/i18next.min",
        "i18next-xhr-backend": "libs/i18nextXHRBackend.min",
        "i18next-browser-language-detector": "libs/i18nextBrowserLanguageDetector.min",
        "jquery-i18next": "libs/jquery-i18next.min",
        "moment": "libs/moment-with-locales",
        "hls": "libs/mediaelement/renderers/hls",
        "mediaelementplayer": "libs/mediaelement/mediaelement-and-player",
        "mediaelement/lang": "libs/mediaelement/lang",
        "sortable": "libs/Sortable.min",
        "goldenlayout": "libs/goldenlayout",
        "xlsx": "libs/xlsx.full.min",
        "vis-timeline": "libs/vis-timeline/vis-timeline-graph2d.min",
        "papaparse": "libs/papaparse.min",
        "filesaver": "libs/FileSaver.min",
    },
    waitSeconds: 10,

    shim: {
        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },

        "jquery.colorPicker": ["jquery"],
        "jquery.appear": ["jquery"],

        "bootstrap": ["jquery"],
        "slider": ["bootstrap"],

        "email-addresses": {
            exports: "emailAddresses"
        },

        "mediaelementplayer": {
            exports: "mejs"
        }
    }
});
