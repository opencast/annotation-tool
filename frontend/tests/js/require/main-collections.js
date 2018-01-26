/* Bootstrap script for require.js */

require(['config'], function () {

    QUnit.config.reorder   = false;
    QUnit.config.autostart = false;
    QUnit.config.autorun = false;

    require(['domReady',
             'tests/annotation-tool-configuration',
             'tests/tracks',
             'tests/annotations',
             'tests/categories',
             'tests/labels',
             'tests/scales',
             'tests/scalevalues',
             'tests/comments'],
            function (domReady) {
                domReady(QUnit.start);
            }
    );
});
