require(["jquery",
         "views/loop",
         "models/loop",
         "collections/loops",
         "prototypes/player_adapter",
         "backbone-annotations-sync",
         "sinon"],

        function($, LoopView, Loop, Loops, PlayerAdapter, AnnotationSync, sinon){


                var loops,
                    loop,
                    loopView,
                    video,
                    initBaseElements = function () {
                        video = {
                            collection: {
                                url: "test"
                            },
                            url: function () {
                                return this.collection.url;
                            }
                        };

                        if (_.isUndefined(annotationsTool)) {
                            annotationsTool = {};
                        }

                        if (_.isUndefined(annotationsTool.localStorageOnlyModel)) {
                            annotationsTool.localStorageOnlyModel = [];
                        }
                    };

                module("Models",  {
                        setup: function() {
                            initBaseElements();

                            Backbone.sync = AnnotationSync;

                            loops = new Loops([], video);
                            loops.reset();
                            loop = loops.create({start: 1, end: 2});
                        }
                });

                test("Add", 3, function () {
                    equal(loops.size(), 1, "Should have 1 elements");
                    loops.add([{start: 1, end: 2}]);
                    equal(loops.size(), 2, "Should have 2 elements");
                    loops.create({}, {
                        error: function (model, error) {
                            ok(true, "Can not be create, error: " + error);
                            loops.unbind('error');
                        }
                    });
                });

                test("Get", function() {
                    var newLoop = loops.get(loop.get('id'));
                    newLoop.save();
                    equal(loop.get('id'), newLoop.get('id'),"Loop should have id " + loop.get('id'));
                });

                test("Update", function () {
                    var nbErrors = 0;

                    stop();
                    loop.bind('error', function (model,error){
                            ok(true, "Can not be modified, error: " + error);
                            nbErrors++;
                            if (nbErrors === 2 ) {
                                loop.unbind('error');
                            } else if (nbErrors === 1) {
                                start();
                            }
                    });
                    loop.set("start", 3);
                    loop.set("start", "Two seconds");
                });

                test("Parse", 3, function() {
                    loops.add(loops.parse([{start: 2, end: 3}, {start: 3, end: 4}]));
                    equal(loops.size(), 3, "The collection should have 3 elements, 2 added as array with the parse function");
                    loops.add(loops.parse({loops: [{start: 4, end: 5}, {start: 5, end: 6}]}));
                    equal(loops.size(), 5, "The collection should have 5 elements, 2 newly added in a data object with the parse function");
                    loops.add(loops.parse(0));
                    equal(loops.size(), 5, "The collection should have 5 elements, no new");
                });

                test("Remove", function() {
                    loop.destroy();
                    equal(loops.size(), 0, "The collection should be empty");
                });

                module("Views",  {
                        setup: function() {
                            initBaseElements();

                            var playerAdapter = {
                                    getDuration   : sinon.stub(),
                                    getCurrentTime: sinon.stub(),
                                    setCurrentTime: sinon.stub(),
                                    play: sinon.stub(),
                                    getStatus: sinon.stub()
                                },
                                timeline = {
                                    redraw         : sinon.stub(),
                                    addItem        : sinon.stub(),
                                    removeItem     : sinon.stub(),
                                    getFormatedDate: sinon.stub()
                                };

                            playerAdapter.getDuration.returns(10);
                            playerAdapter.getCurrentTime.returns(0);
                            playerAdapter.getStatus.returns(PlayerAdapter.STATUS.PLAYING);

                            _.extend(playerAdapter, Backbone.Events);

                            timeline.getFormatedDate.returns(new Date());

                            annotationsTool.playerAdapter = playerAdapter;
                            annotationsTool.video = video;
                            annotationsTool.views = {timeline: timeline};

                            $("body").append("<div style=\"display:none\"><div id=\"video-container\"></div></div>");

                            _.extend(annotationsTool.playerAdapter, $("#video-container"));

                            loopView = new LoopView();
                        },

                        teardown: function () {
                            loopView.reset();
                            delete annotationsTool.playerAdapter;
                            delete annotationsTool.timeline;
                        }
                });

                test("Initialise", 2, function () {
                    equal($("#loop").length, 1, "Loop UI has been added");
                    equal(loopView.isEnable, false, "The loop should be not activated after initialisation");
                });

                test("Create loops", function () {
                    loopView.toggle(true);
                    equal(loopView.isEnable, true, "The loop should be now activated");
                    equal(loopView.loops.length, 2, "Only two loops should be present as the loop length is 5 seconds and the video is 10 seconds length.");
                });

                test("Check loop position on timeupdate", function () {
                    var currentLoop = undefined,
                        setCurrentTimeCall = annotationsTool.playerAdapter.setCurrentTime.callCount;

                    annotationsTool.playerAdapter.getCurrentTime.returns(1);
                    $(annotationsTool.playerAdapter).trigger(PlayerAdapter.EVENTS.TIMEUPDATE);
                    currentLoop = loopView.currentLoop;
                    equal(currentLoop, undefined, "No loop should be active");

                    annotationsTool.playerAdapter.getCurrentTime.returns(0);
                    loopView.toggle(true);
                    annotationsTool.playerAdapter.getCurrentTime.returns(2);
                    $(annotationsTool.playerAdapter).trigger(PlayerAdapter.EVENTS.TIMEUPDATE);
                    notEqual(loopView.currentLoop, undefined, "One loop should be active");
                    notEqual(loopView.currentLoop, currentLoop, "The current loop should have changed");
                    currentLoop = loopView.currentLoop;

                    annotationsTool.playerAdapter.getCurrentTime.returns(9);
                    $(annotationsTool.playerAdapter).trigger(PlayerAdapter.EVENTS.TIMEUPDATE);
                    notEqual(loopView.currentLoop.cid, currentLoop.cid, "The current loop should have changed");
                    currentLoop = loopView.currentLoop;

                    annotationsTool.playerAdapter.getCurrentTime.returns(10);
                    $(annotationsTool.playerAdapter).trigger(PlayerAdapter.EVENTS.TIMEUPDATE);
                    notEqual(annotationsTool.playerAdapter.setCurrentTime.callCount, setCurrentTimeCall, "The current loop should have been repeated");
                    ok(annotationsTool.playerAdapter.play.calledOnce, "The video being at the end and the loop being repeated, the video should contine");
                    equal(loopView.currentLoop.cid, currentLoop.cid, "The current loop should still be the same");
                    currentLoop = loopView.currentLoop;

                    annotationsTool.playerAdapter.getCurrentTime.returns(2);
                    $(annotationsTool.playerAdapter).trigger(PlayerAdapter.EVENTS.TIMEUPDATE);
                    notEqual(loopView.currentLoop.cid, currentLoop.cid, "The current loop should have change");
                });

                QUnit.start();
});
