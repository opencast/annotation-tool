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

import org.opencastproject.util.data.Option;

import org.opencast.annotation.api.Resource;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * The business model implementation of {@link org.opencast.annotation.api.Resource}.
 */
public class ResourceImpl implements Resource {

  private final int access;

  private final Option<Date> createdAt;
  private final Option<Date> updatedAt;
  private final Option<Date> deletedAt;

  private final Option<Long> createdBy;
  private final Option<Long> updatedBy;
  private final Option<Long> deletedBy;

  private Map<String, String> tags = new HashMap<String, String>();

  public ResourceImpl(Option<Integer> access, Option<Long> createdBy, Option<Long> updatedBy, Option<Long> deletedBy,
          Option<Date> createdAt, Option<Date> updatedAt, Option<Date> deletedAt, Map<String, String> tags) {

    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.deletedBy = deletedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    if (tags != null)
      this.tags = tags;

    if (access.isSome()) {
      this.access = access.get();
    } else {
      this.access = PRIVATE;
    }
  }

  /**
   * @see org.opencast.annotation.api.Resource#getAccess()
   */
  @Override
  public int getAccess() {
    return access;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getCreatedBy()
   */
  @Override
  public Option<Long> getCreatedBy() {
    return createdBy;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getUpdatedBy()
   */
  @Override
  public Option<Long> getUpdatedBy() {
    return updatedBy;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getDeletedBy()
   */
  @Override
  public Option<Long> getDeletedBy() {
    return deletedBy;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getCreatedAt()
   */
  @Override
  public Option<Date> getCreatedAt() {
    return createdAt;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getUpdatedAt()
   */
  @Override
  public Option<Date> getUpdatedAt() {
    return updatedAt;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getDeletedAt()
   */
  @Override
  public Option<Date> getDeletedAt() {
    return deletedAt;
  }

  /**
   * @see org.opencast.annotation.api.Resource#getTags()
   */
  @Override
  public Map<String, String> getTags() {
    return tags;
  }

}
