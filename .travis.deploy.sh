#!/usr/bin/env bash

. ./.travis.env.sh
mvn deploy -DskipTests -Dmaven.wagon.http.pool=false "$@"
