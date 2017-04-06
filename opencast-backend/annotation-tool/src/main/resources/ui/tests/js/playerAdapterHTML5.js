require(['domReady',
         'jquery',
         'player_adapter_HTML5',
         'prototypes/player_adapter'],
        
    function(domReady, $, PlayerAdapterImpl, PlayerAdapter){
    
        domReady(function(){
            
            QUnit.config.reorder = false;
            QUnit.config.autostart = false;
            
            var playerAdapter = new PlayerAdapterImpl($('video')[0]);
            playerAdapter.load();
            
            var allStatus = PlayerAdapter.STATUS;
            var allEvents = PlayerAdapter.EVENTS;
            var expectedDuration = 52.208;
            
            /**
             * Start tests
             */
            
            module("HTML5 Adapter");
             
            
            test("Initial status", function() {
                var status = playerAdapter.getStatus();
                equal((status == allStatus.INITIALIZING || status == allStatus.LOADING || status == allStatus.PAUSED) , true, "Player status should be LOADING or PAUSED.");
            });
             
            
            test("Play", function() {
                    stop();
                    
                    $(playerAdapter).one(allEvents.PLAY,function(){
                        ok(true,"EVENT: Received PLAY event.");
                        var status = playerAdapter.getStatus();
                        equal(status,allStatus.PLAYING,"STATUS: Player status should be PLAYING.");
                        start();
                    });
                    
                    playerAdapter.play();
            });                           

            
            
            test("Pause", function() {
                    stop();
                    
                    playerAdapter.play();
                    
                    $(playerAdapter).one(allEvents.PAUSE,function(){
                        ok(true,"EVENT: Received PAUSE event.");
                        var status = playerAdapter.getStatus();
                        equal(status,allStatus.PAUSED,"STATUS: Player status should be PLAUSED.");
                        start();
                    });
                    
                    playerAdapter.pause();
            });
            
            
            test("CurrentTime", function() {
                    stop();
                    playerAdapter.pause();
                    
                    var newTime = 12.5;
                    var oldTime = playerAdapter.getCurrentTime();
                    
                    if(oldTime != 0)
                        playerAdapter.setCurrentTime(0);
                            
                    
                    $(playerAdapter).one(allEvents.TIMEUPDATE,function(){
                        ok(true,"EVENT: Received TIMEUPDATE event.");
                        var time = playerAdapter.getCurrentTime();
                        equal(newTime,time,"CURRENT TIME: Player current time should be "+newTime+".");
                        start();
                    });
                    
                    playerAdapter.setCurrentTime(newTime);
            });
            
            test("Duration", function() {
                    playerAdapter.pause();
                    ok(Math.abs(playerAdapter.getDuration()-expectedDuration)<0.05,"Duration should be "+expectedDuration);
            });
            
            
            test("Ended", 2, function() {
                    stop();
                    
                    playerAdapter.setCurrentTime(expectedDuration-1.3);
                    
                    $(playerAdapter).one(allEvents.ENDED,function(){
                        ok(true,"EVENT: Received ENDED event.");
                        var status = playerAdapter.getStatus();
                        equal(status,allStatus.ENDED,"STATUS: Player status should be ENDED.");
                        start();
                    });
                    
                    playerAdapter.play();
            });
            
            QUnit.start();
        });
    });