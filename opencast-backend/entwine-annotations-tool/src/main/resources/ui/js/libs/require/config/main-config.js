// RequireJS configuration for main app
require.config({
    baseUrl: "js",
    paths: {
        'timeline': 'libs/timeline-min.js',
        'scrollspy': 'libs/bootstrap/scrollspy',
        'backbone':'libs/backbone/backbone-0.9.9',
        'loader': 'libs/backbone/loader',
        'localstorage': 'libs/backbone/backbone.localStorage-1.0',
        'jquery': 'libs/jquery-1.7.2.min',
        'underscore': 'libs/underscore-min-1.4.3',
        'templates': '../templates',
        'order':'libs/require/config/order',
        'domReady':'libs/require/config/domReady',
        'text':'libs/require/config/text',
        "use": "libs/require/config/use.min"
    },
    waitSeconds: 10,
    
    use: {
       "underscore": {
         attach: "_"
       },

       "backbone": {
         deps: ["use!underscore", "jquery"],
         attach: function(_, $) {
           return Backbone;
         }
       },

       "localstorage": {
        deps: ["use!backbone"],
        attach: function(Backbone) {
            return Backbone;
        }
       }
    }
});

// Bootstrap function for main app
require(['order!domReady',
         'order!annotations-tool-configuration',
         'order!annotations-tool'],
              
        function (domReady,config,app) {
            domReady(function(){
                app.start();
            });
        }
);
    
