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
package org.opencast.annotation.impl.persistence;

import static org.opencast.annotation.impl.Jsons.conc;
import static org.opencast.annotation.impl.Jsons.jO;
import static org.opencast.annotation.impl.Jsons.p;
import static org.opencastproject.util.data.Option.option;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.User;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.UserImpl;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import org.json.simple.JSONObject;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/** JPA/JSON link to {@link User}. */
@Entity(name = "User")
@Table(name = "xannotations_user")
@NamedQueries({
        @NamedQuery(name = "User.findById", query = "select a from User a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "User.findByUserId", query = "select a from User a where a.userId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "User.clear", query = "delete from User") })
public class UserDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "extid", nullable = false, unique = true)
  private String userId;

  @Column(name = "nickname", nullable = false)
  private String nickname;

  @Column(name = "email")
  private String email;

  public static UserDto create(String userId, String nickname, Option<String> email, Resource resource) {
    return new UserDto().update(userId, nickname, email, resource);
  }

  public UserDto update(String userId, String nickname, Option<String> email, Resource resource) {
    super.update(resource);
    this.userId = userId;
    this.nickname = nickname;
    this.email = email.getOrElseNull();
    return this;
  }

  public User toUser() {
    return new UserImpl(id, userId, nickname, option(email), new ResourceImpl(option(access), option(createdBy),
            option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt), option(deletedAt), null));
  }

  public static final Function<UserDto, User> toUser = new Function<>() {
    @Override
    public User apply(UserDto dto) {
      return dto.toUser();
    }
  };

  public static final Function2<ExtendedAnnotationService, User, JSONObject> toJson = new Function2<>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, User u) {
      return conc(AbstractResourceDto.toJson.apply(s, u),
          jO(p("id", u.getId()), p("user_extid", u.getExtId()), p("nickname", u.getNickname()), p("email", u.getEmail())));
    }
  };
}
