#!/usr/bin/env bash

. ./.travis.env.sh
mvn -s .travis.settings.xml -DskipTests deploy
