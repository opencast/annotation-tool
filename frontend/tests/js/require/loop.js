/* Bootstrap script for require.js */

require(['config'], function () {

    QUnit.config.reorder   = false;
    QUnit.config.autostart = false;
    QUnit.config.autorun   = false;

    require(['tests/annotation-tool-configuration',
             'tests/loop']);
});
