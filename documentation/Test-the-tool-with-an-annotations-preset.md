In the [tests folder](https://github.com/entwinemedia/annotations/tree/t/ANNOT-83/tests) from the new feature branch ANNOT-83, a test page with a configurable preset of annotations to load is available. 

To use it, first the tests folder should access through a web server. You can use the [Grunt](http://gruntjs.com/) task `dev` (by entering 'grunt dev' at the root of the project) to start a small webserver in the project folder accessible then at `http://localhost:9001`. The loading test page is then available at `http://localhost:9001/tests/loading.html`.

If you need to install Grunt, follow [the starting tutorial](http://gruntjs.com/getting-started).

The set of track is loaded only the first time following the [`tracksToImport`](https://github.com/entwinemedia/annotations/blob/t/ANNOT-83/tests/js/annotation-tool-configuration-loading.js#L141) function define in the [configuration file](https://github.com/entwinemedia/annotations/blob/t/ANNOT-83/tests/js/annotation-tool-configuration-loading.js) for the test page. To reset the tracks, use the url parameter `?reset=true`. You can edit this function to get the number of tracks and annotations that you want. The function has to return the track and annotations in the following format:

        [
            // Array containing the generated tracks
            {
                annotationsLoaded : true,
                description       : "Track dynamically generated for load tests",
                id                : "testtrack0",
                name              : "Track 0",
                visible           : false,
                access            : 1,
                annotations       : [
                    // Array with all the annotations from this track
                    {
                        duration: 892,
                        id: 0,
                        start: 583,
                        text: "Annotation 0 on track 0"
                    },
                    // Add more annotation here
                ]
            },
            // Add more track here
        ]

A test page for the story ANNOT-83 is available at http://entwinemedia.github.io/annotations/ANNOT-83/tests/loading.html
