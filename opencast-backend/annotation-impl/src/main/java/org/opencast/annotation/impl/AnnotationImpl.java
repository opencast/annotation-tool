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

import org.opencastproject.util.EqualsUtil;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Option;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Track;

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

  /**
   * @see org.opencast.annotation.api.Annotation#getId()
   */
  @Override
  public long getId() {
    return id;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getVideo(ExtendedAnnotationService)
   */
  @Override
  public Option<Long> getVideo(final ExtendedAnnotationService eas) {
    return eas.getTrack(trackId).bind(new Function<Track, Option<Long>>() {
      @Override
      public Option<Long> apply(Track track) {
        return track.getVideo(eas);
      }
    });
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getTrackId()
   */
  @Override
  public long getTrackId() {
    return trackId;
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getText()
   */
  @Override
  public Option<String> getText() {
    return text;
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getStart()
   */
  @Override
  public double getStart() {
    return start;
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getDuration()
   */
  @Override
  public Option<Double> getDuration() {
    return duration;
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getSettings()
   */
  @Override
  public Option<String> getSettings() {
    return settings;
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getLabelId()
   */
  @Override
  public Option<Long> getLabelId() {
    return labelId;
  }

  /**
   * @see org.opencast.annotation.api.Annotation#getScaleValueId()
   */
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
    return EqualsUtil.hash(id, trackId, start, duration, text, settings, labelId, scaleValueId, getTags());
  }

}
