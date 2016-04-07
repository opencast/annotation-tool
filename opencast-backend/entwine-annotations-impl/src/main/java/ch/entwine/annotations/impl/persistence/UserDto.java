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
package ch.entwine.annotations.impl.persistence;

import static ch.entwine.annotations.impl.Jsons.conc;
import static ch.entwine.annotations.impl.Jsons.jA;
import static ch.entwine.annotations.impl.Jsons.jO;
import static ch.entwine.annotations.impl.Jsons.p;

import static org.opencastproject.util.data.Monadics.mlist;
import static org.opencastproject.util.data.Option.option;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import ch.entwine.annotations.api.ExtendedAnnotationService;
import ch.entwine.annotations.api.Resource;
import ch.entwine.annotations.api.User;
import ch.entwine.annotations.impl.ResourceImpl;
import ch.entwine.annotations.impl.UserImpl;

import org.json.simple.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.MapKeyColumn;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/** JPA/JSON link to {@link User}. */
@Entity(name = "User")
@Table(name = "xannotations_user")
@NamedQueries({
        @NamedQuery(name = "User.findById", query = "select a from User a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "User.findByUserId", query = "select a from User a where a.userId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "User.findAll", query = "select a from User a where a.deletedAt IS NULL"),
        @NamedQuery(name = "User.findAllSince", query = "select a from User a where a.deletedAt IS NULL and ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "User.deleteById", query = "delete from User a where a.id = :id"),
        @NamedQuery(name = "User.count", query = "select count(a) from User a where a.deletedAt IS NULL"),
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

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_user_tags", joinColumns = @JoinColumn(name = "user_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static UserDto create(String userId, String nickname, Option<String> email, Resource resource) {
    return new UserDto().update(userId, nickname, email, resource);
  }

  public UserDto update(String userId, String nickname, Option<String> email, Resource resource) {
    super.update(resource);
    this.userId = userId;
    this.nickname = nickname;
    this.email = email.getOrElse((String) null);
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public User toUser() {
    return new UserImpl(id, userId, nickname, option(email), new ResourceImpl(option(access), option(createdBy),
            option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<UserDto, User> toUser = new Function<UserDto, User>() {
    @Override
    public User apply(UserDto dto) {
      return dto.toUser();
    }
  };

  public static final Function2<ExtendedAnnotationService, User, JSONObject> toJson = new Function2<ExtendedAnnotationService, User, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, User u) {
      return conc(
              AbstractResourceDto.toJson.apply(s, u),
              jO(p("id", u.getId()), p("user_extid", u.getExtId()), p("nickname", u.getNickname()),
                      p("email", u.getEmail())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService eas, int offset, List<User> us) {
    return jO(p("offset", offset), p("count", us.size()), p("users", jA(mlist(us).map(toJson.curry(eas)))));
  }
}
