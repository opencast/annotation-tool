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

import org.opencast.annotation.api.Resource;

import org.opencastproject.util.data.Option;

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

    this.access = access.getOrElse(PRIVATE);

    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.deletedBy = deletedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;

    if (tags != null)
      this.tags = tags;
  }

  @Override
  public long getId() {
    throw new IllegalStateException("Abstract resources don't have IDs");
  }

  @Override
  public int getAccess() {
    return access;
  }

  @Override
  public Option<Long> getCreatedBy() {
    return createdBy;
  }

  @Override
  public Option<Long> getUpdatedBy() {
    return updatedBy;
  }

  @Override
  public Option<Long> getDeletedBy() {
    return deletedBy;
  }

  @Override
  public Option<Date> getCreatedAt() {
    return createdAt;
  }

  @Override
  public Option<Date> getUpdatedAt() {
    return updatedAt;
  }

  @Override
  public Option<Date> getDeletedAt() {
    return deletedAt;
  }

  @Override
  public Map<String, String> getTags() {
    return tags;
  }
}
