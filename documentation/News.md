###14.06.2016
Updated to an Opencast 2.2 compatible backend

Moved Opencast 1.6 compatible version to a separate branch.

###07.06.2016
Moved this annotation tool to the Opencast community repository. Added Opencast compatible backend files.

###27.1.2015
The performance of the tool have been highly improved during the last months. The points requiring better response time have been focused: The start time of the tool and the annotation creation. The first one has been reduced by two and now the creation of an annotation takes 7x less time.
The following parts have been touch to reach these results:
* For the start-time:
  * The fetching of the tracks have been improved to only load the strict necessary.
  * Not all the public tracks are displayed by default. You can change it through the timeline or the main menu.
* For the annotation creation:
  * The list items have been simplified to have less DOM elements and listeners. Templates have been created for each state of the item (collapsed, expanded, edition and comment).

The main menu of the tool has also been expanded to allow hiding the list and annotate boxes. The loop function can also be disabled through it.

All these improvements have been merged to the develop branch. There are still some issues related to it but we hope to fix them before the end of the week.

###7.3.2014
The tool has been further optimised in relation with the tickets [#394](https://github.com/entwinemedia/annotations/issues/394) and [#393](https://github.com/entwinemedia/annotations/issues/393). The following optimisation have been implemented
* New possible behaviour for the timeline during playback: Time-range half-static, keeps no more the playhead in the middle but moves when the playhead is no more in visible range. For more information about how it works, pleaser read [this comment on ticket #394](https://github.com/entwinemedia/annotations/issues/394#issuecomment-37014487).
* Lazy-loading for annotations comments to avoid to reduce the number of GET request on launch time and therefore improve the tool start time.  

###3.2.2014
Related to the tickets [#394](https://github.com/entwinemedia/annotations/issues/394), [#392](https://github.com/entwinemedia/annotations/issues/392), the tool has been optimised with the following modifications:
* Limit the annotations to draw on the timeline to the annotations 
  * in the visible tracks.
  * in the current timerange.
* Optimise the filters (reduce the number of loops).
* Off-screen rendering for the list.
* Limit the redraw frequency for the timeline.

For load testing, the method `tracksToImport` can now be implemented in the [configuration file](https://github.com/entwinemedia/annotations/blob/develop/js/annotation-tool-configuration.js) to load a large set of tracks. See the [load test configuration file](https://github.com/entwinemedia/annotations/blob/develop/tests/js/annotation-tool-configuration-loading.js) as example.

###12.11.2013
Some tests have been done with the updates from the 4th november and they resulted with the following work:

* [#307](https://github.com/entwinemedia/annotations/issues/#307) - Moving annotations between public/private tracks and changing track visibility status in timeline did not always update the list view. This is now fixed.
* [#309](https://github.com/entwinemedia/annotations/issues/#309) - Track overlay is now always displayed, also when we move quickly on the track title.
* [#378](https://github.com/entwinemedia/annotations/issues/#378) -Change the target for some tooltips to bigger elements (boxes instead of just text part).
* [#382](https://github.com/entwinemedia/annotations/issues/#382) - Automatically select new track.
* [#383](https://github.com/entwinemedia/annotations/issues/#383) - Switching Public/Private visibility on track was relative slow due to synchronisation of all annotations. Now just the track is synchronised with the backend for this operation.

###05.11.2013
Some design related issues have been fixed:
* [#280](https://github.com/entwinemedia/annotations/issues/#280) - Fix responsive design issue that was happening during tab switching.
* [#275](https://github.com/entwinemedia/annotations/issues/#275) - Change eye icon for the track visibility status (public/private).

###04.11.2013
Small update with the fixes for the following bugs:
* [#271](https://github.com/entwinemedia/annotations/issues/#271) - Small modifications done on the print design. The labels captions are no more split and the color.
* [#280](https://github.com/entwinemedia/annotations/issues/#280) - Add responsive design for the categories edit-modus.
* [#307](https://github.com/entwinemedia/annotations/issues/#307) - Filter "Only public tracks" works again on both list and timeline.
* [#309](https://github.com/entwinemedia/annotations/issues/#309) - Overlays on track title do not stay displayed wenn video is playing.
* [#310](https://github.com/entwinemedia/annotations/issues/#310) - Track edition updates now correctly the public/private status.
* [#371](https://github.com/entwinemedia/annotations/issues/#371) -  The tool works again in Internet Explorer. 

###10.10.2013
The following bugs have been fixed this week:

* [#368](https://github.com/entwinemedia/annotations/issues/#368) - The loops representation on the timeline are now removed again when the loop function is switched off. An issue related to the representation of the first loop (it was missing) on the timeline has also been fixed.
* [#309](https://github.com/entwinemedia/annotations/issues/#309) - The last update disabled the track mouseover informations box in certain cases. 
* [#367](https://github.com/entwinemedia/annotations/issues/#367) - Annotations are now more deleted when they are move to other tracks like it happens sometime with the previous version.

###03.10.2013
An important refactoring has been done in term of annotations selection. The goal was to centralise all the annotation selection logic in the annotations tool itself and remove the part present in the timeline. Therefore we could remove a number of useless events that were triggered before.

The current version is also affected by bug related to the localStorage library: https://github.com/entwinemedia/annotations/issues/367. It results with corrupted annotations when you move annotations between tracks. Even it does not happen every time, this is quite easy to reproduce it. 

* [#313](https://github.com/entwinemedia/annotations/issues/313) - Moving an annotation on timeline does not unselect it anymore. 
* [#275](https://github.com/entwinemedia/annotations/issues/275) - Labels "public"/"private" have been added to the "eye" icon on the tracks for more better usability.
* [#315](https://github.com/entwinemedia/annotations/issues/315) - Add modal to confirm comment deletion.
* [#268](https://github.com/entwinemedia/annotations/issues/268) - Clicking on speech bubble with comments sum open expand annotation.
* [#331](https://github.com/entwinemedia/annotations/issues/331) - Use available space for text input field in edit mode.
* [#280](https://github.com/entwinemedia/annotations/issues/280) - There are now less categories pro tab and therefore their div are larger.
* [#271](https://github.com/entwinemedia/annotations/issues/271) - The print design has been redesigned.

###20.09.2013
This updated comes with the fixes for the following tickets:

* [#309](https://github.com/entwinemedia/annotations/issues/309) - A mouseover the track title will now display the full title of track, its description and its owner.
* [#307](https://github.com/entwinemedia/annotations/issues/307) - The "Only public tracks" filter works again on both views (list and timeline).
* [#310](https://github.com/entwinemedia/annotations/issues/310) - The name and description of a track can be edited by double-clicking on it.
* [#285](https://github.com/entwinemedia/annotations/issues/285) - The timeline header is now always visible, even after scrolling down. 
* [#312](https://github.com/entwinemedia/annotations/issues/312) - The video title, owner and date can be added for print usage.
* [#301](https://github.com/entwinemedia/annotations/issues/301) - The annotation author is now visible in the print version.
* [#282](https://github.com/entwinemedia/annotations/issues/282) - Correct/Change some annotation highlighting behaviours on the timeline:
Annotation can be unselected through a simple click.<br/>
  - A default length can be set to highlight the annotation without duration more than some milliseconds. It can be define in the configuration file.
  - A new annotation only stay highlighted for its duration. Does not need a click on it to unselect anymore.
  - To unselect an annotation, just click on it in the timeline. No more double click required.
* [#328](https://github.com/entwinemedia/annotations/issues/328) - The current video time is now displayed in the timeline header.
* [#313](https://github.com/entwinemedia/annotations/issues/313) - Ensure that all visual blocks (timeline, list, ...) have the same title style.
* [#329](https://github.com/entwinemedia/annotations/issues/329) - The label tooltips show the label name instead of the label abbreviation.
* [#330](https://github.com/entwinemedia/annotations/issues/330) - Limit the label abbreviations to 3 characters.
* [#290](https://github.com/entwinemedia/annotations/issues/290) - Change the export/import terms for categories to upload/download and update the icons.
