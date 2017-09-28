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

## Configuration of Opencast

### Adding ACL Actions

The Annotation Tool uses [custom ACL actions](https://docs.opencast.org/develop/admin/configuration/acl/#additional-acl-actions)
to control access to its videos. These actions are `annotate` and `annotate-admin` and they need to be installed
in your Opencast setup via a list provider. A template for this is provided with the source tree under
`/opencast-backend/etc/listproviders/acl.additional.actions.properties`.
To install it, please follow the instructions in the link above, or if you already have an ACL action list provider,
just append the following snippet to it:

```
# Allow users to simply use the annotation tool with a video,
# i.e. to create their own annotations, tracks, categories, etc.
Annotate=annotate
# Allow users to manage the annotation tool environment for a video.
# Also gives them access to other people's annotations.
Manage\ annotations=annotate-admin
```

Users are only allowed to access the annotation tool if the have the action `annotate` or `annotate-admin` set for this recording.

### Adding Distribution to Annotation Tool to the Workflow

Although the Annotation Tool can access a recording when it shows up in the Opencast search service, the Annotation Tool can also be added to the list of publications for an event. 

Within the `etc/workflows/ng-partial-publish` you need to add this operation to the `<operations>` section. It is recommended to add it after the "publish-engage" operation.

     <operation
        id="publish-configure"
          exception-handler-workflow="ng-partial-error"
          description="Publish to preview publication channel">
          <configurations>
            <configuration key="source-tags">preview</configuration>
            <configuration key="channel-id">annotation</configuration>
            <configuration key="url-pattern">http://localhost:8080/annotations-tool/index.html?id=${event_id}</configuration>
          </configurations>
        </operation>

You can add this operation also to every other workflow definition that should distribute videos to the Annotation Tool.

Additionally you must set the label for the annotation publication channel. Add to the file `etc/listproviders/publication.channel.labels.properties` the following line:

    annotation=Annotation Tool


## Using the Tool

To use the Annotation Tool you need to open it with the event-ID:

    http://my.opencast.tld:8080/annotation-tool/index.html?id=<my-event-id>

For a user to access a video using the annotation tool, they (or any role they inhabit) have to have at least one
of these ACL actions `annotate` or `annotate-admin` enabled on the video in question.

Also note that the annotation tool currently does not work with the fast testing workflow, that Opencast provides.
