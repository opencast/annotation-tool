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
import static org.opencast.annotation.impl.Jsons.jA;
import static org.opencast.annotation.impl.Jsons.jO;
import static org.opencast.annotation.impl.Jsons.p;

import static org.opencastproject.util.data.Monadics.mlist;
import static org.opencastproject.util.data.Option.option;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;

import org.opencast.annotation.impl.CategoryImpl;
import org.opencast.annotation.impl.ResourceImpl;
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

/** JPA/JSON link to {@link Category}. */
@Entity(name = "Category")
@Table(name = "xannotations_category")
@NamedQueries({
        @NamedQuery(name = "Category.findByIdIncludeDeleted", query = "select a from Category a where a.id = :id"),
        @NamedQuery(name = "Category.findById", query = "select a from Category a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Category.findAllOfTemplate", query = "select a from Category a where a.videoId IS NULL and a.deletedAt IS NULL"),
        @NamedQuery(name = "Category.findAllOfVideo", query = "select a from Category a where a.videoId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Category.findAllOfVideoSince", query = "select a from Category a where a.videoId = :id and a.deletedAt IS NULL and ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "Category.deleteById", query = "delete from Category a where a.id = :id"),
        @NamedQuery(name = "Category.count", query = "select count(a) from Category a where a.deletedAt IS NULL"),
        @NamedQuery(name = "Category.clear", query = "delete from Category") })
public class CategoryDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "description")
  private String description;

  @Column(name = "has_duration")
  private boolean hasDuration;

  @Column(name = "settings")
  private String settings;

  // Foreign keys
  /** If video id is null this is a template */
  @Column(name = "video_id")
  private Long videoId;

  @Column(name = "scale_id")
  private Long scaleId;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_category_tags", joinColumns = @JoinColumn(name = "category_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static CategoryDto create(Option<Long> videoId, Option<Long> scaleId, String name, Option<String> description,
          boolean hasDuration, Option<String> settings, Resource resource) {
    CategoryDto dto = new CategoryDto().update(name, description, scaleId, hasDuration, settings, resource);
    dto.videoId = videoId.getOrElse((Long) null);
    dto.scaleId = scaleId.getOrElse((Long) null);
    return dto;
  }

  public CategoryDto update(String name, Option<String> description, Option<Long> scaleId, boolean hasDuration,
          Option<String> settings, Resource resource) {
    super.update(resource);
    this.name = name;
    this.description = description.getOrElse((String) null);
    this.scaleId = scaleId.getOrElse((Long) null);
    this.hasDuration = hasDuration;
    this.settings = settings.getOrElse((String) null);
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public Category toCategory() {
    return new CategoryImpl(id, option(videoId), option(scaleId), name, option(description), hasDuration,
            option(settings), new ResourceImpl(option(access), option(createdBy), option(updatedBy), option(deletedBy),
                    option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<CategoryDto, Category> toCategory = new Function<CategoryDto, Category>() {
    @Override
    public Category apply(CategoryDto dto) {
      return dto.toCategory();
    }
  };

  public static final Function2<ExtendedAnnotationService, Category, JSONObject> toJson = new Function2<ExtendedAnnotationService, Category, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService eas, Category s) {
      return conc(
              AbstractResourceDto.toJson.apply(eas, s),
              jO(p("id", s.getId()), p("name", s.getName()), p("description", s.getDescription()),
                      p("has_duration", s.hasDuration()), p("settings", s.getSettings()), p("scale_id", s.getScaleId())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService eas, int offset, List<Category> categories) {
    return jO(p("offset", offset), p("count", categories.size()),
            p("categories", jA(mlist(categories).map(toJson.curry(eas)))));
  }
}
