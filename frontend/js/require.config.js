// TODO Somehow enable `strict`-mode here

// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        "backbone": "../node_modules/backbone/backbone-min",
        "bootstrap": "../node_modules/bootstrap/docs/assets/js/bootstrap.min",
        "slider": "../node_modules/bootstrap-slider/dist/bootstrap-slider.min",
        "chroma": "../node_modules/chroma-js/chroma.min",
        "domReady": "../node_modules/requirejs-domready/domReady",
        "handlebars": "../node_modules/handlebars/dist/handlebars.min",
        "jquery": "../node_modules/jquery/tmp/jquery",
        "jquery.colorPicker": "../node_modules/really-simple-colorpicker/js/jquery.colorPicker.min",
        "templates": "../templates",
        "underscore": "../node_modules/underscore/underscore-min",
        "mousetrap": "../node_modules/mousetrap/mousetrap.min",
        "i18next": "../node_modules/i18next/i18next.min",
        "i18next-http-backend": "../node_modules/i18next-http-backend/i18nextHttpBackend.min",
        "i18next-browser-language-detector": "../node_modules/i18next-browser-languagedetector/i18nextBrowserLanguageDetector.min",
        "jquery-i18next": "../node_modules/jquery-i18next/jquery-i18next.min",
        "moment": "../node_modules/moment/min/moment-with-locales.min",
        "hls": "../node_modules/hls.js/dist/hls.min",
        "mediaelementplayer": "../node_modules/mediaelement/build/mediaelement-and-player.min",
        "mediaelement/lang": "../node_modules/mediaelement/build/lang",
        "sortable": "../node_modules/sortablejs/Sortable.min",
        "goldenlayout": "../node_modules/golden-layout/dist/goldenlayout.min",
        "xlsx": "../node_modules/xlsx/dist/xlsx.full.min",
        "vis-timeline": "../node_modules/vis-timeline/dist/vis-timeline-graph2d.min",
        "papaparse": "../node_modules/papaparse/papaparse.min",
        "filesaver": "../node_modules/file-saver/dist/FileSaver.min"
    },

    shim: {
        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },

        "jquery.colorPicker": ["jquery"],

        "bootstrap": ["jquery"],
        "slider": ["bootstrap"],

        "mediaelementplayer": {
            exports: "mejs"
        }
    }
});
