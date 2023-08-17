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
import static org.opencast.annotation.impl.Jsons.jOTags;
import static org.opencast.annotation.impl.Jsons.p;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.User;

import org.opencastproject.util.DateTimeSupport;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import org.json.simple.JSONObject;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

@MappedSuperclass
public abstract class AbstractResourceDto {

  @Column(name = "access")
  protected Integer access = Resource.PRIVATE;

  @Column(name = "created_by")
  protected Long createdBy;

  @Column(name = "updated_by")
  protected Long updatedBy;

  @Column(name = "deleted_by")
  protected Long deletedBy;

  @Column(name = "created_at")
  @Temporal(TemporalType.TIMESTAMP)
  protected Date createdAt;

  @Column(name = "updated_at")
  @Temporal(TemporalType.TIMESTAMP)
  protected Date updatedAt;

  @Column(name = "deleted_at")
  @Temporal(TemporalType.TIMESTAMP)
  protected Date deletedAt;

  public AbstractResourceDto update(Resource resource) {
    this.access = resource.getAccess();
    this.createdBy = resource.getCreatedBy().getOrElseNull();
    this.updatedBy = resource.getUpdatedBy().getOrElseNull();
    this.deletedBy = resource.getDeletedBy().getOrElseNull();
    this.createdAt = resource.getCreatedAt().getOrElseNull();
    this.updatedAt = resource.getUpdatedAt().getOrElseNull();
    this.deletedAt = resource.getDeletedAt().getOrElseNull();
    return this;
  }

  public static final Function2<ExtendedAnnotationService, Resource, JSONObject> toJson = new Function2<>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Resource resource) {
      String createdAt = resource.getCreatedAt().map(getDateAsUtc).getOrElseNull();
      String updatedAt = resource.getUpdatedAt().map(getDateAsUtc).getOrElseNull();
      String deletedAt = resource.getDeletedAt().map(getDateAsUtc).getOrElseNull();

      Long createdBy = resource.getCreatedBy().getOrElseNull();
      Long updatedBy = resource.getUpdatedBy().getOrElseNull();
      Long deletedBy = resource.getDeletedBy().getOrElseNull();

      String createdByNickname = resource.getCreatedBy().map(getUserNickname.curry(s)).getOrElseNull();
      String updatedByNickname = resource.getUpdatedBy().map(getUserNickname.curry(s)).getOrElseNull();
      String deletedByNickname = resource.getDeletedBy().map(getUserNickname.curry(s)).getOrElseNull();

      String createdByEmail = resource.getCreatedBy().flatMap(getUserEmail.curry(s)).getOrElse("");
      return conc(
              jO(p("access", resource.getAccess()), p("created_by", createdBy), p("updated_by", updatedBy),
                      p("deleted_by", deletedBy), p("created_at", createdAt), p("updated_at", updatedAt),
                      p("deleted_at", deletedAt), p("created_by_nickname", createdByNickname),
                      p("created_by_email", createdByEmail),
                      p("updated_by_nickname", updatedByNickname), p("deleted_by_nickname", deletedByNickname)),
              jOTags(resource.getTags()));
    }
  };

  public static final Function<Date, String> getDateAsUtc = new Function<>() {
    @Override
    public String apply(Date date) {
      return DateTimeSupport.toUTC(date.getTime());
    }
  };

  public static final Function2<ExtendedAnnotationService, Long, String> getUserNickname = new Function2<>() {
    @Override
    public String apply(ExtendedAnnotationService s, Long userId) {
      Option<User> user = s.getUser(userId);
      if (user.isNone())
        return null;

      return user.get().getNickname();
    }
  };

  private static final Function2<ExtendedAnnotationService, Long, Option<String>> getUserEmail = new Function2<>() {
    @Override
    public Option<String> apply(ExtendedAnnotationService s, Long userId) {
      return s.getUser(userId).flatMap(new Function<>() {
        @Override
        public Option<String> apply(User user) {
          return user.getEmail();
        }
      });
    }
  };
}
