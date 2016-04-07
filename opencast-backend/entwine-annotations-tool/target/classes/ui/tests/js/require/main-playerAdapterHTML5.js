/* Bootstrap script for require.js */

require(['config'], function () {
    require(['tests/playerAdapterHTML5'],
            function () {}
    );    
});
