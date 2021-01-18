# Opencast Annotation Tool

The Opencast Annotation Tool (aka Annotating Academic Video by Entwine)
is a video annotation service that is suitable for research, teaching or learning.

The software is currently divided into two parts:

* The frontend component, containing the annotation webapp.
* The Opencast Backend modules, that need to be integrated into an Opencast installation.

## Release, Support and Distribution

Unlike for Opencast, the community surrounding the Opencast Annotation Tool is relatively small,
and the resources for its development and maintenance limited.
With that in mind it makes little sense
to try to support multiple versions of the tool simultaniously.
The situation also doesn't really warrant any formal and/or regular release cycle.

As a result, this project follows kind of a rolling release strategy:
We try our best to have the `master` branch on GitHub
contain a working version of the software
at any given point in time.
Every push to `master` thus constitutes a release,
versioned by an up-to-the-second timestamp
and the current git commit hash.
You can get to the source code of any particular such release
by checking out the corresponding tag in git,
or by downloading the corresponding tarball
from GitHubs [releases section](https://github.com/opencast/annotation-tool/releases).

In addition to the code,
our TravisCI setup publishes the resulting Maven artifacts
to our [GitHub hosted repository](https://github.com/opencast/annotation-tool/raw/m2)
on every release.

### Supported Opencast Versions

With the same motivation of a smaller community and fewer resources,
we decided to only support the currently supported Opencast versions, by default,
with a strong preference towards the newer versions.
This commitment might be further restricted at any point,
should the maintenance burde prove too high.
We also try our best to be compatible with Opencast `develop`,
seeing as how this is going to be our next "premium support" version
in at most six months time. 😉

## [Installation](documentation/opencast-installation.md)
The instruction on how to install the Annotation tool in Opencast [can be found here](documentation/opencast-installation.md).

For a quick local test you can use a [docker-based solution](documentation/docker-environment.md).

## [Building the Frontend](documentation/build-frontend.md)
Instructions on how to build the frontend webapp [can be found here](documentation/build-frontend.md).

_This is NOT needed to install the Annotation Tool in Opencast!_

## [Documentation](documentation/Home.md)
A general documentation including the REST endpoints, the architecture etc. [can be found here](documentation/Home.md).

## [News](documentation/News.md)
You can find the latest news about the annotation tool on [this page](documentation/News.md).

## Participants

### Initial Development
* [Entwine](www.entwinemedia.com)
* [SWITCH](switch.ch)
* [Claudio Beffa](beffa.ch)

### Current Development of this branch
* [virtUOS, Universität Osnabrück](http://www.virtuos.uni-osnabrueck.de)
* [ELAN e.V.](http://elan-ev.de)

### Contact
* Rüdiger Rolf, [rrolf@uni-osnabrueck.de](mailto://rrolf@uni-osnabrueck.de), Phone: +49 541 969 6511

## [DEMO](https://interactivevideo.virtuos.uos.de/)
A demo is available [here](https://interactivevideo.virtuos.uos.de/). You can upload videos there and test these in the annotation tool.

## License
[ECL 2.0](http://www.osedu.org/licenses/ECL-2.0)
