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
import org.opencastproject.util.data.Option;

import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;

/**
 * The business model implementation of {@link org.opencast.annotation.api.Category}.
 */
public class CategoryImpl extends ResourceImpl implements Category {

  private final long id;
  private final Option<Long> videoId;
  private final Option<Long> scaleId;
  private final String name;
  private final Option<String> description;
  private final boolean hasDuration;
  private final Option<String> settings;

  public CategoryImpl(long id, Option<Long> videoId, Option<Long> scaleId, String name, Option<String> description,
          boolean hasDuration, Option<String> settings, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.videoId = videoId;
    this.scaleId = scaleId;
    this.name = name;
    this.description = description;
    this.hasDuration = hasDuration;
    this.settings = settings;
  }

  /**
   * @see org.opencast.annotation.api.Category#getId()
   */
  @Override
  public long getId() {
    return id;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getVideo
   */
  @Override
  public Option<Long> getVideo(ExtendedAnnotationService eas) {
    return videoId;
  }

  /**
   * @see org.opencast.annotation.api.Category#getVideoId()
   */
  @Override
  public Option<Long> getVideoId() {
    return videoId;
  }

  /**
   * @see org.opencast.annotation.api.Category#getScaleId()
   */
  @Override
  public Option<Long> getScaleId() {
    return scaleId;
  }

  /**
   * @see org.opencast.annotation.api.Category#getName()
   */
  @Override
  public String getName() {
    return name;
  }

  /**
   * @see org.opencast.annotation.api.Category#getDescription()
   */
  @Override
  public Option<String> getDescription() {
    return description;
  }

  /**
   * @see org.opencast.annotation.api.Category#hasDuration()
   */
  @Override
  public boolean hasDuration() {
    return hasDuration;
  }

  /**
   * @see org.opencast.annotation.api.Category#getSettings()
   */
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
    Category category = (Category) o;
    return id == category.getId() && videoId.equals(category.getVideoId()) && scaleId.equals(category.getScaleId())
            && name.equals(category.getName()) && description.equals(category.getDescription())
            && hasDuration == category.hasDuration() && settings.equals(category.getSettings())
            && getTags().equals(category.getTags());
  }

  @Override
  public int hashCode() {
    return EqualsUtil.hash(id, videoId, scaleId, name, description, hasDuration, settings, getTags());
  }

}
