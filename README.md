# Annotating Academic Video

### [News] (documentation/News.md)
You can find the latest news about the annotations tool on [this page] (documentation/News.md).

### Project description
The Annotating Academic Video (AAV) project is a video annotation service that is suitable for research, teaching or learning.  Architected as a stand-alone service, AAV can be integrated with most video players, video management systems, learning management systems, and lecture capture systems.

### Architecture overview
The AAV tool is composed of a javascript web application communicating with REST endpoints for persistence resources and a player adapter. This one is the interface between the javascript annotations tool and the used player.
This architecture aims to make the tool integrable in any video system.

<img src="http://entwinemedia.github.com/annotations/AnnotationTool.png" />

#### Player adapter
Any kind of web video player can be used with the annotations tool as long as it has its own player adapter and implements all the methods from the player adapter API. The annotations tool will communicate with the player through the player adapter.

[Player adapter API](documentation/Player-adapter-API.md)

#### Web application
This is the core of the tool. It retrieves the annotations from the backend and allows one to create/edit annotations and synchronise them back. It communicates with the player and gets all types of events from it. It facilitates the synchronisation between the playhead, the timeline and the annotations table. The tool communicates with the backend through Rest Endpoints to get the existing annotations and persists the new or modified one.
Most of the files in this repository are part of the web app.

[Javascript application API](http://entwinemedia.github.com/annotations/docs/index.html)

#### API / Backend
The tool is made to work with any kind of lecture capture system or video system. It requires the implementation of this API and the related Rest Endpoint.
Jump to the part below about Existing system integration to see some examples.

[Rest API](documentation/Rest-API.md)

## Technology dependancies
All the dependancies below are related to the web application.

* MVC Framework: [Backbone.js](backbonejs.com)
* DOM manipulation library: [JQuery](jquery.com)
* Layout framework & widgets: [Twitter Bootstrap 2.0](http://twitter.github.com/bootstrap/)
* Templates: [Handlebars](http://handlebarsjs.com/)
* Timeline: [CHAP Links Library](http://almende.github.com/chap-links-library/)
* Module Loader: [RequireJS](http://requirejs.org/)
* Dynamic stylesheet language: [LESS](http://lesscss.org/)
* Color-picker: [Really Simple Color](http://www.laktek.com/2008/10/27/really-simple-color-picker-in-jquery/)
* Polyfill:
* * [FileReader](https://github.com/Jahdrien/FileReader)
* * [FileSaver](https://github.com/eligrey/FileSaver.js)

## Participants

### Development
* [Entwine](www.entwinemedia.com)
* [Switch](switch.ch)
* [Claudio Beffa](beffa.ch)

### Design
Pädagogische Hochschule Zürich, PHZH|Digital Learning / E-Learning

### Institutions
These represent the original institutions that have started this project.

| Universtity | Institution/School/Research group |
| ------ | -----: |
| ETH Zurich (ETH) | ITS-Multimedia Services; LET – Lehrentwicklung und - technologie|
| SWITCH |NetServices|
|Universität Bern, UniBE|Supportstelle für ICT-gestützte Lehre der Universität Bern|
|Pädagogische Hochschule Zürich, PHZH|Digital Learning / E-Learning|
|Université de Lausanne - UniL|Faculté de Biologie et Médecine (FBM); Réseau interfacultaire enseignement et technologies (Riset); Service de communication et d'audiovisuel (Unicom)|
|Pädagogische Hochschule Thurgau, PHTG|eLearning|
|Université de Fribourg - Universität Freiburg, UniFr|Lehrerinnen- und Lehrerbildung LDS I und LDS II der Universität Freiburg|


### Existing system integration
Actually the tool has been integrated in two video lecture system:

* [Opencast](opencast-backend), implemented by Entwine
* Switchcast, implemented by Switch

## [Documentation](documentation/Home.md)
All the documentation is present on the [wiki](documentation/Home.md).

## [DEMO](http://entwinemedia.github.com/annotations/)
A demo is available [here](http://entwinemedia.github.com/annotations/). It works with localStorage and no real backend communication. Therefore all the functionalities related to rights management / authorisations are not working on this version.

## License
[ECL 2.0](http://www.osedu.org/licenses/ECL-2.0)
