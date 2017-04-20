# Opencast Installation Instructions

## Installing the Annotation Tool

__Note:__ These are the installation instructions for the Opencast 2.3.0 branch or higher.

You should make sure that you intended Opencast version was build at least once on the machine you use to build the
Annotation tool, as this will create the needed dependency for Opencast modules in your local M2_REPO. This may change
in the future when Opencast packages might become available on the Nexus repository server.

In general you should follow the [installation from source](https://docs.opencast.org/r/2.3.x/admin/installation/)
instructions for Opencast.

If you want to use the annotation tool in your production system, you can copy over the JAR-files from
__<opencast_home>/deploy/opencast-annotation-*__ to the deploy dir of the other Opencast.

### Preparing the Build of Opencast with the Annotation Tool
Additional to the Opencast source code you will also need the source code for the Annotation Tool.
In this manual we use `<annotationtool-dir>` for the base dir of the Annotation Tool checkout and
`<opencast-dir>` as the directory where your Opencast build/binaries are.

#### Cloning the Annotation Tool Git repository

    git clone https://bitbucket.org/opencast-community/annotation-tool.git

### Building the Annotation Tool

    mvn clean install -DdeployTo=<opencast-dir> -Dopencast.version=<your Opencast version number>

This should build the frontend, include it into the Opencast modules and copies the JARs to your Opencast installation.

## Using the Tool

To use the Annotation Tool you need to open it with the event-ID:

    http://my.opencast.tld:8080/annotation-tool/index.html?id=<my-event-id>


