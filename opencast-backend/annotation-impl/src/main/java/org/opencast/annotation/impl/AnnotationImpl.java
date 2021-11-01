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
import org.opencast.annotation.api.Resource;

import org.opencastproject.util.data.Option;

import java.util.Objects;

/**
 * The business model implementation of {@link org.opencast.annotation.api.Annotation}.
 */
public class AnnotationImpl extends ResourceImpl implements Annotation {

  private final long id;
  private final long trackId;
  private final Option<String> text;
  private final double start;
  private final Option<Double> duration;
  private final Option<String> settings;
  private final Option<Long> labelId;
  private final Option<Long> scaleValueId;

  public AnnotationImpl(long id, long trackId, Option<String> text, double start, Option<Double> duration,
          Option<String> settings, Option<Long> labelId, Option<Long> scaleValueId, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.trackId = trackId;
    this.text = text;
    this.start = start;
    this.duration = duration;
    this.settings = settings;
    this.labelId = labelId;
    this.scaleValueId = scaleValueId;
  }

  @Override
  public long getId() {
    return id;
  }

  @Override
  public long getTrackId() {
    return trackId;
  }

  @Override
  public Option<String> getText() {
    return text;
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
  public Option<String> getSettings() {
    return settings;
  }

  @Override
  public Option<Long> getLabelId() {
    return labelId;
  }

  @Override
  public Option<Long> getScaleValueId() {
    return scaleValueId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    Annotation annotation = (Annotation) o;
    return id == annotation.getId() && trackId == annotation.getTrackId() && duration.equals(annotation.getDuration())
            && start == annotation.getStart() && text.equals(annotation.getText())
            && settings.equals(annotation.getSettings()) && labelId.equals(annotation.getLabelId())
            && scaleValueId.equals(annotation.getScaleValueId()) && getTags().equals(annotation.getTags());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, trackId, start, duration, text, settings, labelId, scaleValueId, getTags());
  }
}
