# Opencast Installation Instructions

## Installing the Annotation Tool 

__Note:__ These are the installation instructions for the Opencast 2.2 branch. If you intent to use a release version
of Opencast or a 2.2+ version you will need to update `<version>2.2-SNAPSHOT</version>` to your Opencast version!

In general you should follow the [installation from source](https://docs.opencast.org/r/2.2.x/admin/installation/)
instructions for Opencast. These instructions extend the _Building Opencast_ section.

### Preparing the Build of Opencast with the Annotation Tool
Additional to the Opencast source code you will also need the source code for the Annotation Tool. In this manual we use `<annotationtool-dir>` for the base dir of the Annotation Tool checkout and `<opencast-dir>` like in the Opencast manual for the checkout dir of the Opencast source code

#### Cloning the Annotation Tool Git repository

    git clone https://bitbucket.org/opencast-community/annotation-tool.git

#### Copying files

    cp <annotationtool-dir>/opencast-backend/entwine-annotations-* <opencast-dir>/modules/

#### Configuring Build Configurations

You will need to include the Annotation Tool to the Opencast main `pom.xml` file and to the Karaf assembly `feature.xml`.

You can find an example [pom.xml](../opencast-backend/pom.xml) and [feature.xml](../opencast-backend/assemblies/karaf-features/src/main/feature/feature.xml) are included in the `opencast-backend` directory. You might use these
files if you have the right Opencast version (2.2-SNAPSHOT) AND no other additional external modules included already.

Otherwise open `<opencast-dir>/pom.xml` in an editor and add the _entwine-annotations_ modules in the <modules> section:

    ...
    <modules>
    ...
      <module>modules/entwine-annotations-api</module>
      <module>modules/entwine-annotations-impl</module>
      <module>modules/entwine-annotations-tool</module>
    ...
      <module>assemblies</module>
    </modules>
    ...


Then open `<opencast-dir>/assemblies/karaf-features/src/main/feature/feature.xml` in the editor of you choice. We need to add the annotations to the _opencast-allinone_ feature and would recommend to add it to the _opencast-presentation_ feature.

    ...
    <feature name="opencast-allinone" version="${project.version}">
      <feature version="${project.version}">opencast-core</feature>
    ...
      <bundle>mvn:ch.entwine/entwine-annotations-api/${project.version}</bundle>
      <bundle>mvn:ch.entwine/entwine-annotations-impl/${project.version}</bundle>
      <bundle>mvn:ch.entwine/entwine-annotations-tool/${project.version}</bundle>
    ...
    </feature>
    ...
    <feature name="opencast-presentation" version="${project.version}">
      <feature version="${project.version}">opencast-core</feature>
    ...
      <bundle>mvn:ch.entwine/entwine-annotations-api/${project.version}</bundle>
      <bundle>mvn:ch.entwine/entwine-annotations-impl/${project.version}</bundle>
      <bundle>mvn:ch.entwine/entwine-annotations-tool/${project.version}</bundle>
    ...
    </feature>
    ...

After this you can continue with the __Building Opencast__ section of the Opencast installation manual.
    
## Using the Tool

To use the Annotation Tool you need to open it with the event-ID:

    http://my.opencast.tld:8080/annotations-tool/index.html?id=<my-event-id>

## Development Notice

To avoid that the standalone webapp and the version included in Opencast become different version, pleas edit the JS source code in the `frontend` directory and update the backen with `grunt integration --force`

