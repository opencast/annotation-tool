/*
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

package org.opencast.annotation.impl;

import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.User;
import org.opencast.annotation.util.data.Option;

import java.util.Objects;

/**
 * The business model implementation of {@link org.opencast.annotation.api.User}.
 */
public final class UserImpl extends ResourceImpl implements User {

  private final long id;
  private final String extId;
  private final String nickname;
  private final Option<String> email;

  public UserImpl(long id, String extId, String nickname, Option<String> email, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), null);
    this.id = id;
    this.extId = extId;
    this.nickname = nickname;
    this.email = email;
  }

  @Override
  public long getId() {
    return id;
  }

  @Override
  public String getExtId() {
    return extId;
  }

  @Override
  public String getNickname() {
    return nickname;
  }

  @Override
  public Option<String> getEmail() {
    return email;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    User user = (User) o;
    return id == user.getId() && extId.equals(user.getExtId()) && nickname.equals(user.getNickname())
            && email.equals(user.getEmail());
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, extId, nickname, email);
  }
}
