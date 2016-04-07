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
import ch.entwine.annotations.api.User;

/**
 * The business model implementation of {@link ch.entwine.annotations.api.User}.
 */
public final class UserImpl extends ResourceImpl implements User {

  private final long id;
  private final String extId;
  private final String nickname;
  private final Option<String> email;

  public UserImpl(long id, String extId, String nickname, Option<String> email, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.extId = extId;
    this.nickname = nickname;
    this.email = email;
  }

  /**
   * @see ch.entwine.annotations.api.User#getId()
   */
  @Override
  public long getId() {
    return id;
  }

  /**
   * @see ch.entwine.annotations.api.User#getExtId()
   */
  @Override
  public String getExtId() {
    return extId;
  }

  /**
   * @see ch.entwine.annotations.api.User#getNickname()
   */
  @Override
  public String getNickname() {
    return nickname;
  }

  /**
   * @see ch.entwine.annotations.api.User#getEmail()
   */
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
            && email.equals(user.getEmail()) && getTags().equals(user.getTags());
  }

  @Override
  public int hashCode() {
    return EqualsUtil.hash(id, extId, nickname, email, getTags());
  }

}
