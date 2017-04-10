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

import org.opencastproject.util.DateTimeSupport;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.User;

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
    this.createdBy = resource.getCreatedBy().getOrElse((Long) null);
    this.updatedBy = resource.getUpdatedBy().getOrElse((Long) null);
    this.deletedBy = resource.getDeletedBy().getOrElse((Long) null);
    this.createdAt = resource.getCreatedAt().getOrElse((Date) null);
    this.updatedAt = resource.getUpdatedAt().getOrElse((Date) null);
    this.deletedAt = resource.getDeletedAt().getOrElse((Date) null);
    return this;
  }

  public static final Function2<ExtendedAnnotationService, Resource, JSONObject> toJson = new Function2<ExtendedAnnotationService, Resource, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Resource resource) {
      String createdAt = resource.getCreatedAt().map(getDateAsUtc).getOrElse((String) null);
      String updatedAt = resource.getUpdatedAt().map(getDateAsUtc).getOrElse((String) null);
      String deletedAt = resource.getDeletedAt().map(getDateAsUtc).getOrElse((String) null);

      Long createdBy = resource.getCreatedBy().getOrElse((Long) null);
      Long updatedBy = resource.getUpdatedBy().getOrElse((Long) null);
      Long deletedBy = resource.getDeletedBy().getOrElse((Long) null);

      String createdByNickname = resource.getCreatedBy().map(getUserNickname.curry(s)).getOrElse((String) null);
      String updatedByNickname = resource.getUpdatedBy().map(getUserNickname.curry(s)).getOrElse((String) null);
      String deletedByNickname = resource.getDeletedBy().map(getUserNickname.curry(s)).getOrElse((String) null);
      return conc(
              jO(p("access", resource.getAccess()), p("created_by", createdBy), p("updated_by", updatedBy),
                      p("deleted_by", deletedBy), p("created_at", createdAt), p("updated_at", updatedAt),
                      p("deleted_at", deletedAt), p("created_by_nickname", createdByNickname),
                      p("updated_by_nickname", updatedByNickname), p("deleted_by_nickname", deletedByNickname)),
              jOTags(resource.getTags()));
    }
  };

  public static final Function<Date, String> getDateAsUtc = new Function<Date, String>() {
    @Override
    public String apply(Date date) {
      return DateTimeSupport.toUTC(date.getTime());
    }
  };

  public static final Function2<ExtendedAnnotationService, Long, String> getUserNickname = new Function2<ExtendedAnnotationService, Long, String>() {
    @Override
    public String apply(ExtendedAnnotationService s, Long userId) {
      Option<User> user = s.getUser(userId);
      if (user.isNone())
        return null;

      return user.get().getNickname();
    }
  };

}
