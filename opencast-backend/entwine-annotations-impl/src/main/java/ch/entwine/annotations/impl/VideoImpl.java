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
import ch.entwine.annotations.api.Video;

/**
 * The business model implementation of {@link ch.entwine.annotations.api.Video}.
 */
public final class VideoImpl extends ResourceImpl implements Video {

  private final long id;
  private final String extId;

  public VideoImpl(long id, String extId, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.extId = extId;
  }

  /**
   * @see ch.entwine.annotations.api.Video#getId()
   */
  @Override
  public long getId() {
    return id;
  }

  /**
   * @see ch.entwine.annotations.api.Video#getExtId()
   */
  @Override
  public String getExtId() {
    return extId;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    Video user = (Video) o;
    return id == user.getId() && extId.equals(user.getExtId()) && getTags().equals(user.getTags());
  }

  @Override
  public int hashCode() {
    return EqualsUtil.hash(id, extId, getTags());
  }
}
