#!/usr/bin/env bash

. ./.travis.env.sh
mvn deploy -DskipTests "$@"
