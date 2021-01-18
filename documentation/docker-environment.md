# Annotation Tool with Docker

To use the Annotation Tool within a Docker environment you can use the following instruction that is based on the [Opencast Docker instructions](https://github.com/opencast/opencast-docker).
This instruction uses **Opencast 8.10**.

## Requirements
- Git
- Docker
- Docker-Compose

## Prepare
- Clone opencast-docker repository for Opencast 8.10: `git clone --branch=8.10 https://github.com/opencast/opencast-docker.git`
- Go into folder: `cd opencast-docker`

## Build Docker image

- Replace allinone Dockerfile (located at `.\Dockerfiles\allinone\Dockerfile`) with [this version](docker-environment.8.10.Dockerfile)
- Build Docker image with `docker build -t quay.io/opencast/allinone:8.10 -f .\Dockerfiles\allinone\Dockerfile .`

## Use annotation tool

- Start environment with `docker-compose -p opencast-allinone -f docker-compose/docker-compose.allinone.h2.yml up -d`
- Go to `http://localhost:8080` and login with `admin` and `opencast`
- Upload a new video, choose the 'Process upon upload and schedule' workflow and add the access policies `Annotate` and `Manage annotations`, 
- Copy UID from uploaded video
- Go to `http://localhost:8080/annotation-tool/index.html?id=[UID]`
- Start annotate

## TODO

* [Adding Distribution to Annotation Tool to the Workflow](opencast-installation.md#adding-distribution-to-annotation-tool-to-the-workflow)
