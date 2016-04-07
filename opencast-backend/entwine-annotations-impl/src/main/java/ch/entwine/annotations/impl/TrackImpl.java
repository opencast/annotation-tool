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
package ch.entwine.annotations.impl;

import org.opencastproject.util.EqualsUtil;
import org.opencastproject.util.data.Option;

import ch.entwine.annotations.api.Resource;
import ch.entwine.annotations.api.Track;

/**
 * The business model implementation of {@link ch.entwine.annotations.api.Track}.
 */
public final class TrackImpl extends ResourceImpl implements Track {

  private final long id;
  private final long videoId;
  private final String name;
  private final Option<String> description;
  private final Option<String> settings;

  public TrackImpl(long id, long videoId, String name, Option<String> description, Option<String> settings,
          Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.videoId = videoId;
    this.name = name;
    this.description = description;
    this.settings = settings;

  }

  /**
   * @see ch.entwine.annotations.api.Track#getId()
   */
  @Override
  public long getId() {
    return id;
  }

  /**
   * @see ch.entwine.annotations.api.Track#getVideoId()
   */
  @Override
  public long getVideoId() {
    return videoId;
  }

  /**
   * @see ch.entwine.annotations.api.Track#getName()
   */
  @Override
  public String getName() {
    return name;
  }

  /**
   * @see ch.entwine.annotations.api.Track#getDescription()
   */
  @Override
  public Option<String> getDescription() {
    return description;
  }

  /**
   * @see ch.entwine.annotations.api.Track#getSettings()
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
    Track track = (Track) o;
    return id == track.getId() && videoId == track.getVideoId() && description.equals(track.getDescription())
            && name.equals(track.getName()) && settings.equals(track.getSettings()) && getAccess() == track.getAccess()
            && getTags().equals(track.getTags());
  }

  @Override
  public int hashCode() {
    return EqualsUtil.hash(id, videoId, name, description, settings, getTags());
  }
}
