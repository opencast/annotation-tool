// Tests configuration for require.js
require.config({
    baseUrl: "../js",
    paths: {
        'root': 'libs',
        'backbone':'libs/backbone/backbone-min',
        'loader': 'libs/backbone/loader',
        'localstorage': 'libs/backbone/backbone.localStorage',
        'jquery': 'libs/jquery-1.7.2',
        'interfaces': 'interfaces',
        'order':'libs/require/order',
        'underscore': 'libs/underscore-min',
	    'tests': '../tests/js',
        'order':'libs/require/order',
	    'domReady':'libs/require/config/domReady'
    },
    waitSeconds: 30
});

 


