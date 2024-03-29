# Installation Instructions

## Prerequisites

We assume throughout this document that you already have a running Opencast instance.
If you need help setting that up please consult the [official documentation](https://docs.opencast.org/develop/admin/#installation/).

## Installing the Annotation Tool

There are multiple ways to install this tool. Here are some possibilities:

### From Source

#### Prerequisites

Make sure that you have OpenJDK 11 and Maven installed.
You will also need a `git` client.

#### Cloning the Annotation Tool Git repository

For example using the following command:

    git clone https://github.com/opencast/annotation-tool.git

### Building the Annotation Tool

Now just run

    mvn clean install -DdeployTo=<opencast-deploy-dir>

where `<opencast-deploy-dir>` is the [Karaf hot deployment folder](https://karaf.apache.org/manual/latest/#_deployers)
of your Opencast installation. (This is usually something like `/usr/share/opencast/deploy`
if using the official packages.

If you built the tool before and are now getting errors during the frontend build,
you might want to try to remove the NodeJS artifacts downloaded during the process:

```
rm -rf frontend/node*
```

### As a Karaf Feature

As an alternative, the Annotation Tool is also packaged as a Karaf feature
under the name `opencast-annotation-tool` and the Maven coordinates

    org.opencast.annotation:karaf-feature:${version}:xml:features

where `${version}` is to be replaced by the version of the annotation tool.

You can conveniently install it using the following Karaf shell commands:

    feature:repo-add mvn:org.opencast.annotation/karaf-feature/${version}/xml/features
    feature:install opencast-annotation-tool

Unfortunately this will only install the tool for the current session; it will not survive an Opencast restart.
To install it permanently into your system, open up `etc/org.apache.karaf.features.cfg` in your Opencast directory
and make the following modifications:

Add the feature repository already mentioned above to the list aptly named `featureRepositories`.
For example if it looks like this:

    featuresRepositories = \
        mvn:org.opencastproject.assemblies/opencast-karaf-features/4.1/xml/features, \
        mvn:org.apache.karaf.features/enterprise/4.0.9/xml/features, \
        mvn:org.apache.cxf.karaf/apache-cxf/3.1.12/xml/features, \
        mvn:org.apache.karaf.features/framework/4.0.9/xml/features, \
        mvn:org.apache.karaf.features/standard/4.0.9/xml/features, \
        mvn:org.ops4j.pax.web/pax-web-features/4.3.0/xml/features

change it to this (the change is in the last two lines):

    featuresRepositories = \
        mvn:org.opencastproject.assemblies/opencast-karaf-features/4.1/xml/features, \
        mvn:org.apache.karaf.features/enterprise/4.0.9/xml/features, \
        mvn:org.apache.cxf.karaf/apache-cxf/3.1.12/xml/features, \
        mvn:org.apache.karaf.features/framework/4.0.9/xml/features, \
        mvn:org.apache.karaf.features/standard/4.0.9/xml/features, \
        mvn:org.ops4j.pax.web/pax-web-features/4.3.0/xml/features, \
        mvn:org.opencast.annotate/karaf-feature/${version}/xml/features

Note that the version numbers appearing in your configuration file
will probably differ from those in this example snippet!

This enables you to say `feature:install opencast-annotation-tool` at the Karaf console
without the `repo-add` step mentioned above. To start the Annotation Tool automatically,
add `opencast-annotation-tool` to the list `featuresBoot` in the same configuration file
mentioned above in the same fashion to how you added the repository.

Note that for this to work, you need to have built the Annotation Tool at least once,
so that the corresponding Maven artifacts can be found by Karaf, since they are currently not
in any remote repository!

## Configuring Opencast

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

Within the `etc/workflows/partial-publish.xml` you need to add this operation to the `<operations>` section. It is recommended to add it after the "publish-engage" operation.

```
<operation
  id="publish-configure"
  exception-handler-workflow="partial-error"
  description="Publish to annotation publication channel">
  <configurations>
    <configuration key="source-tags">engage-download</configuration>
    <configuration key="channel-id">annotation</configuration>
    <configuration key="url-pattern">http://localhost:8080/annotation-tool/index.html?id=${event_id}</configuration>
  </configurations>
</operation>
```

You can also add this operation to every other workflow definition that should distribute videos to the Annotation Tool.

Additionally you must set the label for the annotation publication channel. Add the following line to the file `etc/listproviders/publication.channels.properties`:

```
annotation={"label":"Annotation Tool", "icon":"img/engage_2x.png", "order":6}
```

### Security Configuration

In order to be able to access the tool,
you need to make some additions to your Spring Security configuration.
In a single-tenant setup,
this can be found at `<opencast-etc>/security/mh_default_org.xml`.
If you have a multi-tenant setup,
you probably know where this configuration needs to go
better than I do. :wink:

What you need is something to the effect of the following two lines:

    <sec:intercept-url pattern="/annotation-tool/**" access="ROLE_ANONYMOUS" />
    <sec:intercept-url pattern="/extended-annotations/**" access="ROLE_ANONYMOUS" />

Note that this grants **everyone** access to every resource
under the paths `/annotation-tool` and `/extended-annotations`.
If you don't do anything out of the ordinary this should be fine,
since all of the Annotation Tool endpoints that need to
handle their own authentication.

If you start from the default configuration file,
these lines should go somewhere in the section titled

    <!-- ################ -->
    <!-- # URL SECURITY # -->
    <!-- ################ -->

but before the wildcard rule

    <sec:intercept-url pattern="/**" access="ROLE_ADMIN, ROLE_COURSE_ADMIN" />

---

Note that the rules

    <sec:intercept-url pattern="/annotation/**" method="GET" access="ROLE_ANONYMOUS" />
    <sec:intercept-url pattern="/annotation/**" method="PUT" access="ROLE_ANONYMOUS" />

have **nothing** to do with the Opencast Annotation Tool whatsoever!

## Using the Tool

To use the Annotation Tool you need to open it with the event-ID:

    http://my.opencast.tld:8080/annotation-tool/index.html?id=<my-event-id>

For a user to access a video using the annotation tool, they (or any role they inhabit) have to have at least one
of these ACL actions `annotate` or `annotate-admin` enabled on the video in question.
