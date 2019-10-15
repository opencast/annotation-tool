#!/usr/bin/env bash

. ./.travis.env.sh
mvn clean deploy -DskipTests -Dmaven.wagon.http.pool=false "$@"
