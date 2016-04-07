/* Bootstrap script for require.js */

require(['config'], function () {

    QUnit.config.reorder   = false;
    QUnit.config.autostart = false;
    QUnit.config.autorun = false;

    require(['domReady',
            'tests/annotations-tool-configuration',
            'tests/user',
            'tests/video',
            'tests/track',
            'tests/annotation',
            'tests/category',
            'tests/label',
            'tests/scale',
            'tests/scalevalue',
            'tests/comment'],

            function (domReady) {
                domReady(QUnit.start);
            }
    );
});

