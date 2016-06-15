// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        "annotations-tool"              : "annotations-tool",
        "annotations-tool-configuration": "annotations-tool-configuration",
        "backbone"                      : "libs/backbone/backbone-min-0.9.9",
        "bootstrap"                     : "libs/bootstrap/bootstrap.min",
        "carousel"                      : "libs/bootstrap/carousel2.2",
        "domReady"                      : "libs/require/config/domReady",
        "handlebars"                    : "libs/handlebars-v1.3.0",
        "handlebarsHelpers"             : "handlebarsHelpers",
        "jquery.colorPicker"            : "libs/jquery.colorPicker.min",
        "jquery.FileReader"             : "libs/jquery.FileReader",
        "jquery.appear"                 : "libs/jquery.appear",
        "localstorage"                  : "libs/backbone/backbone.localStorage-1.0",
        "jquery"                        : "libs/jquery-1.7.2.min",
        "popover"                       : "libs/bootstrap/popover",
        "scrollspy"                     : "libs/bootstrap/scrollspy",
        "slider"                        : "libs/bootstrap/bootstrap-slider",
        "tab"                           : "libs/bootstrap/tab",
        "templates"                     : "../templates",
        "text"                          : "libs/require/config/text",
        "tooltip"                       : "libs/bootstrap/tooltip",
        "timeline"                      : "libs/timeline-min",
        "underscore"                    : "libs/underscore-min-1.4.3",
        "raf"                           : "libs/rAF"
    },
    waitSeconds: 10,

    shim: {
        "handlebarsHelpers": {
            deps: ["handlebars"],
            exports: "Handlebars"
        },

        "handlebars": {
            exports: "Handlebars"
        },

        "underscore": {
            exports: "_"
        },

        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },

        "localstorage": {
            deps: ["backbone"],
            exports: "Backbone"
        },

        "jquery.FileReader": {
            deps    : ["jquery"],
            exports : "jQuery.fn.fileReader"
        },

        "jquery.colorPicker": {
            deps: ["jquery"],
            exports: "jQuery.fn.colorPicker"
        },

        "jquery.appear": {
            deps: ["jquery"],
            exports: "jQuery.fn.appear"
        },

        "bootstrap": ["jquery"],
        "scrollspy": ["bootstrap"],
        "carousel" : ["bootstrap"],
        "tab"      : ["bootstrap"],
        "slider"   : ["jquery"]
    }
});

// Bootstrap function for main app
require(["domReady", "annotations-tool-configuration", "annotations-tool", "raf"],

function (domReady, config, app) {
    domReady(function () {
        app.start(config);
    });
});