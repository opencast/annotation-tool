# Copyright 2016 The WWU eLectures Team All rights reserved.
#
# Licensed under the Educational Community License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
#     http://opensource.org/licenses/ECL-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM maven:3.6-jdk-8-slim AS build

ARG repo="https://github.com/opencast/opencast.git"
ARG branch="8.10"

ENV OPENCAST_DISTRIBUTION="allinone" \
    OPENCAST_SRC="/usr/src/opencast" \
    OPENCAST_HOME="/opencast" \
    OPENCAST_UID="800" \
    OPENCAST_GID="800" \
    OPENCAST_USER="opencast" \
    OPENCAST_GROUP="opencast" \
    OPENCAST_REPO="${repo}" \
    OPENCAST_BRANCH="${branch}" \
    FFMPEG_VERSION="20200316042902-N-96975-gc467328f07"\
    OPENCAST_ANNOTATION_TOOL_SRC="/usr/src/opencast-annotation-tool"\
    OPENCAST_ANNOTATION_TOOL_REPO="https://github.com/opencast/annotation-tool.git"\
    OPENCAST_ANNOTATION_TOOL_BRANCH="master"

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      bzip2 \
      ca-certificates \
      g++ \
      gcc \
      git \
      gzip \
      libc-dev \
      make \
      openssl \
      tar \
      xz-utils \
  \
 && git clone https://github.com/ncopa/su-exec.git /tmp/su-exec \
 && cd /tmp/su-exec \
 && make \
 && cp su-exec /usr/local/sbin \
  \
 && mkdir -p /tmp/ffmpeg \
 && cd /tmp/ffmpeg \
 && curl -sSL "https://pkg.opencast.org/bin/ffmpeg/ffmpeg-${FFMPEG_VERSION}.tar.xz" \
     | tar xJf - --strip-components 1 --wildcards '*/ffmpeg' '*/ffprobe' \
 && chown root:root ff* \
 && mv ff* /usr/local/bin \
  \
 && groupadd --system -g "${OPENCAST_GID}" "${OPENCAST_GROUP}" \
 && useradd --system -M -N -g "${OPENCAST_GROUP}" -d "${OPENCAST_HOME}" -u "${OPENCAST_UID}" "${OPENCAST_USER}" \
 && mkdir -p "${OPENCAST_SRC}" "${OPENCAST_HOME}" "${OPENCAST_ANNOTATION_TOOL_SRC}" \
 && chown -R "${OPENCAST_USER}:${OPENCAST_GROUP}" "${OPENCAST_SRC}" "${OPENCAST_HOME}" "${OPENCAST_ANNOTATION_TOOL_SRC}" \
  \
 && cd \
 && rm -rf /tmp/* /var/lib/apt/lists/*

USER "${OPENCAST_USER}"

# Build Opencast
RUN git clone --recursive "${OPENCAST_REPO}" "${OPENCAST_SRC}" \
 && cd "${OPENCAST_SRC}" \
 && git checkout "${OPENCAST_BRANCH}" \
 && mvn --batch-mode install \
      -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn \
      -DskipTests=true \
      -Dcheckstyle.skip=true \
      -DskipJasmineTests=true \
 && tar -xzf build/opencast-dist-${OPENCAST_DISTRIBUTION}-*.tar.gz --strip 1 -C "${OPENCAST_HOME}" \
 # Build Annotation Tool
 && git clone --recursive "${OPENCAST_ANNOTATION_TOOL_REPO}" "${OPENCAST_ANNOTATION_TOOL_SRC}" \
 && cd "${OPENCAST_ANNOTATION_TOOL_SRC}" \
 && git checkout "${OPENCAST_ANNOTATION_TOOL_BRANCH}" \
 && mvn --batch-mode install \
      -DdeployTo="${OPENCAST_HOME}" \
      -Dopencast.version="${OPENCAST_BRANCH}" \
 # Config Annotation Tool
 && echo 'felix.fileinstall.poll = 30000' >> "${OPENCAST_HOME}"/etc/org.apache.felix.fileinstall-deploy.cfg \
 && echo 'Annotate=annotate\nManage\\ annotations=annotate-admin' >> "${OPENCAST_HOME}"/etc/listproviders/acl.additional.actions.properties \
 # Cleanup
 && rm -rf "${OPENCAST_SRC}"/* "${OPENCAST_ANNOTATION_TOOL_SRC}"/* ~/.m2 ~/.npm ~/.node-gyp

FROM openjdk:8-jdk-slim-stretch
LABEL maintainer="WWU eLectures team <electures.dev@uni-muenster.de>" \
      org.label-schema.schema-version="1.0" \
      org.label-schema.version="8.10" \
      org.label-schema.name="opencast-allinone" \
      org.label-schema.description="Docker image for the Opencast allinone distribution" \
      org.label-schema.usage="https://github.com/opencast/opencast-docker/blob/8.10/README.md" \
      org.label-schema.url="https://opencast.org/" \
      org.label-schema.vcs-url="https://github.com/opencast/opencast-docker" \
      org.label-schema.vendor="University of Münster" \
      org.label-schema.docker.debug="docker exec -it $CONTAINER sh" \
      org.label-schema.docker.cmd.help="docker run --rm quay.io/opencast/allinone:8.10 app:help"

ENV OPENCAST_VERSION="8.10" \
    OPENCAST_DISTRIBUTION="allinone" \
    OPENCAST_HOME="/opencast" \
    OPENCAST_DATA="/data" \
    OPENCAST_CUSTOM_CONFIG="/etc/opencast" \
    OPENCAST_USER="opencast" \
    OPENCAST_GROUP="opencast" \
    OPENCAST_UID="800" \
    OPENCAST_GID="800" \
    OPENCAST_REPO="${repo}" \
    OPENCAST_BRANCH="${branch}"
ENV OPENCAST_SCRIPTS="${OPENCAST_HOME}/docker/scripts" \
    OPENCAST_SUPPORT="${OPENCAST_HOME}/docker/support" \
    OPENCAST_CONFIG="${OPENCAST_HOME}/etc"

RUN groupadd --system -g "${OPENCAST_GID}" "${OPENCAST_GROUP}" \
 && useradd --system -M -N -g "${OPENCAST_GROUP}" -d "${OPENCAST_HOME}" -u "${OPENCAST_UID}" "${OPENCAST_USER}" \
 && mkdir -p "${OPENCAST_DATA}" \
 && chown -R "${OPENCAST_USER}:${OPENCAST_GROUP}" "${OPENCAST_DATA}"

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      fontconfig \
      fonts-dejavu \
      fonts-freefont-ttf \
      fonts-liberation \
      fonts-linuxlibertine \
      hunspell \
      hunspell-en-au \
      hunspell-en-ca \
      hunspell-en-gb \
      hunspell-en-us \
      hunspell-en-za \
      jq \
      netcat-openbsd \
      nfs-common \
      openssl \
      sox \
      synfig \
      tesseract-ocr \
      tesseract-ocr-eng \
      tzdata \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/local/sbin/su-exec /usr/local/bin/ff* /usr/local/sbin/
COPY --from=build --chown=opencast:opencast "${OPENCAST_HOME}" "${OPENCAST_HOME}"
COPY rootfs /

RUN rm "${OPENCAST_CONFIG}/org.opencastproject.organization-mh_default_org.cfg-tmp" \
 && rm "${OPENCAST_CONFIG}/org.opencastproject.serviceregistry.impl.ServiceRegistryJpaImpl.cfg-tmp" \
 && chown -R "${OPENCAST_USER}:${OPENCAST_GROUP}" "${OPENCAST_HOME}" \
 && javac "${OPENCAST_SCRIPTS}/TryToConnectToDb.java" \
 && rm -rf /tmp/* "${OPENCAST_SCRIPTS}/TryToConnectToDb.java"

WORKDIR "${OPENCAST_HOME}"

EXPOSE 8080
VOLUME [ "${OPENCAST_DATA}" ]

HEALTHCHECK --timeout=10s CMD /docker-healthcheck.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["app:start"]
