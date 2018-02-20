# Building the Frontend

The frontend webapp has several modes. It can integrate into an Opencast or SWITCH cast environment to store the data an central servers, or it can run on a local webserver as a standalone demo service, where the annotations are only stored in the local storage of the browser. 

As a technology stack this software uses Grunt as a buold tool and NPM to include external Javascript libraries.

At first you need to checkout the annotation tool with GIT:

    mkdir /opt/annotation
    cd /opt/annotation
    git clone https://github.com/opencast/annotation-tool.git

Make sure you have installed [Node.js](https://nodejs.org/en/download/), which you might find as a binary package in a repo also, and [Grunt](http://gruntjs.com/getting-started) on your machine.

Now you will need to initalize your NPM repository:

    cd /opt/annotation/annotation-tool/frontend/
    npm install

You have now several options to build and deploy the webapp:

* `demo` mode on a local webserver
* `integration` to update the webapp within the Opencast backend
* `build` to build the webapp and put in the the _target_ directory.
* `dev` to start a webserver with grunt to test the current webapp

## Building __demo__

If you want to use the `demo` option, you have install a webserver and cretaed a directory `/var/www/html/annotation/`
and gave your current user write access to this directory. You can adjust pathes in `Gruntfile.js`

    cp -rf /opt/annotation/annotation-tool/frontend/resources /var/www/html/annotation
    cd /opt/annotation/annotation-tool/frontend/
    grunt demo

Open your webbrowser with the URL `http://localhost/annotation/`

## Building __build__

    cd /opt/annotation/annotation-tool/frontend/
    grunt build

You will find the webapp in `/opt/annotation/annotation-tool/frontend/`.

## Building __integration__

    cd /opt/annotation/annotation-tool/frontend/
    grunt integration

The files in `/opt/annotation/annotation-tool/opencast-backend/annotation-tool/src/main/resources/ui/` should
have been updated. Use the [installation guide for Opencast](opencast-installation.md) to update Opencast with the new frontend.

## Building __dev__

    cd /opt/annotation/annotation-tool/frontend/
    grunt dev

See the console output for the URL and port that you can open in your webserver.
