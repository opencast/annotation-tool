# Opencast Annotation Tool

The Opencast Annotation Tool (aka Annotating Academic Video by Entwine)
is a video annotation service that is suitable for research, teaching or learning.

The software consists of two parts:

* The frontend component, containing the annotation webapp.
* The Opencast Backend modules, that need to be integrated into an Opencast installation.

## Release, Support and Distribution

Unlike for Opencast, the community surrounding the Opencast Annotation Tool is relatively small,
and the resources for its development and maintenance limited.
With that in mind it makes little sense
to try to support multiple versions of the tool simultaneously.
The situation also doesn't really warrant any formal and/or regular release cycle.

As a result, this project follows kind of a rolling release strategy:
We try our best to have the `master` branch on GitHub
always contain a working version of the software.
Every push to `master` thus constitutes a release,
versioned by an up-to-the-second timestamp,
and the appropriate git commit hash.
You can get to the source code of any particular such release
by checking out the corresponding commit in git.

Our CI setup builds each such push
and publishes the resulting Maven artifacts
to our [GitHub hosted repository](https://github.com/opencast/annotation-tool/raw/m2).

### Supported Opencast Versions

With the same motivation of a smaller community and fewer resources,
we decided to only support the currently supported Opencast versions, by default,
with a strong preference towards the newer versions.
We reserve the right to further restrict this commitment at any point
should the maintenance burden prove too high.
We also try our best to be compatible with Opencast `develop`,
seeing as how this is going to be our next "premium support" version
in at most six months time. 😉

## [Installation](documentation/Installation.md)
The instructions on how to install the Annotation Tool in Opencast can be found [here](documentation/Installation.md)

## [Documentation](documentation/Home.md)
A general documentation including the REST endpoints, the architecture etc. can be found [here](documentation/Home.md).

## Communication
For discussion around the Opencast Annotation Tool the [mailing list](https://groups.google.com/a/opencast.org/g/oat) can be used. You can subscribe to the list via [Google Groups](https://groups.google.com/a/opencast.org/g/oat) or by sending a mail to oat+subscribe@opencast.org.

## Participants

### Initial Development
* Entwine (now [Extron](https://www.extron.com/))
* [SWITCH](https://www.switch.ch/)
* [Claudio Beffa](https://www.beffa.ch/)

### Current Development of this branch
* [virtUOS, Universität Osnabrück](https://www.virtuos.uni-osnabrueck.de)
* [ELAN e.V.](https://elan-ev.de)

### Contact
* Rüdiger Rolf, [rrolf@uni-osnabrueck.de](mailto:rrolf@uni-osnabrueck.de), Phone: +49 541 969 6511

## License
[ECL 2.0](https://opensource.org/licenses/ECL-2.0)
