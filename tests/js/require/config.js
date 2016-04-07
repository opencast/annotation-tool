// RequireJS configuration for tests
require.config({
    baseUrl: "./../js",
    paths: {
        "annotations-tool"               : "annotations-tool-configuration",
        "annotations-tool-main"          : "annotations-tool",
        "annotations-tool-configuration" : "../tests/js/annotations-tool-configuration",
        "backbone"                       : "libs/backbone/backbone-0.9.9",
        "bootstrap"                      : "libs/bootstrap/bootstrap.min",
        "carousel"                       : "libs/bootstrap/carousel2.2",
        "domReady"                       : "libs/require/config/domReady",
        "handlebars"                     : "libs/handlebars-v1.1.2",
        "handlebarsHelpers"              : "handlebarsHelpers",
        "jquery.colorPicker"             : "libs/jquery.colorPicker.min",
        "jquery.FileReader"              : "libs/jquery.FileReader",
        "jquery.appear"                 : "libs/jquery.appear",
        "localstorage"                   : "libs/backbone/backbone.localStorage-1.0",
        "jquery"                         : "libs/jquery-1.7.2.min",
        "popover"                       : "libs/bootstrap/popover",
        "scrollspy"                      : "libs/bootstrap/scrollspy",
        "sinon"                          : "libs/tests/sinon-1.7.3",
        "slider"                         : "libs/bootstrap/bootstrap-slider",
        "tab"                            : "libs/bootstrap/tab",
        "tests"                          : "../tests/js",
        "templates"                      : "../templates",
        "text"                           : "libs/require/config/text",
        "tooltip"                        : "libs/bootstrap/tooltip",
        "timeline"                       : "libs/timeline-min",
        "underscore"                     : "libs/underscore-min-1.4.3"
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

        "sinon": {
            exports: "sinon"
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
