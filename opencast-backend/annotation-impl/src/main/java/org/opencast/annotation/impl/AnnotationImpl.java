/**
 *  Copyright 2012, Entwine GmbH, Switzerland
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
package org.opencast.annotation.impl;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Track;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Option;

import java.util.Objects;

/**
 * The business model implementation of {@link org.opencast.annotation.api.Annotation}.
 */
public class AnnotationImpl extends ResourceImpl implements Annotation {

  private final long id;
  private final long trackId;
  private final double start;
  private final Option<Double> duration;
  private final String content;
  private final boolean createdFromQuestionnaire;
  private final Option<String> settings;

  public AnnotationImpl(long id, long trackId, double start, Option<Double> duration,
          String content, boolean createdFromQuestionnaire, Option<String> settings, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.trackId = trackId;
    this.start = start;
    this.duration = duration;
    this.content = content;
    this.createdFromQuestionnaire = createdFromQuestionnaire;
    this.settings = settings;
  }

  @Override
  public long getId() {
    return id;
  }

  @Override
  public Option<Long> getVideo(final ExtendedAnnotationService eas) {
    return eas.getTrack(trackId).bind(new Function<Track, Option<Long>>() {
      @Override
      public Option<Long> apply(Track track) {
        return track.getVideo(eas);
      }
    });
  }

  @Override
  public long getTrackId() {
    return trackId;
  }

  @Override
  public double getStart() {
    return start;
  }

  @Override
  public Option<Double> getDuration() {
    return duration;
  }

  @Override
  public String getContent() {
    return content;
  }

  @Override
  public boolean getCreatedFromQuestionnaire() {
    return createdFromQuestionnaire;
  }

  @Override
  public Option<String> getSettings() {
    return settings;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    Annotation annotation = (Annotation) o;
    return id == annotation.getId() && trackId == annotation.getTrackId() && duration.equals(annotation.getDuration())
            && start == annotation.getStart() && content.equals(annotation.getContent())
            && settings.equals(annotation.getSettings()) && getTags().equals(annotation.getTags());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, trackId, start, duration, content, settings, getTags());
  }
}
