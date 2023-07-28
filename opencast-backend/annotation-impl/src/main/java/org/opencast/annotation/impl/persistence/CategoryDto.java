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

import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.impl.CategoryImpl;
import org.opencast.annotation.impl.ResourceImpl;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

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
        @NamedQuery(name = "Category.findAllOfExtSeries", query = "select a from Category a where a.seriesExtId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Category.findAllOfSeriesCategory", query = "select a from Category a where a.seriesCategoryId = :id and a.deletedAt IS NULL"),
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

  @Column(name = "settings")
  private String settings;

  // Foreign keys
  @Column(name = "series_extid")
  private String seriesExtId;

  @Column(name = "series_category_id")
  private Long seriesCategoryId;

  /** If video id is null this is a template */
  @Column(name = "video_id")
  private Long videoId;

  @Column(name = "scale_id")
  private Long scaleId;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "\"VALUE\"")
  @CollectionTable(name = "xannotations_category_tags", joinColumns = @JoinColumn(name = "category_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static CategoryDto create(Option<String> seriesExtId, Option<Long> seriesCategoryId, Option<Long> videoId,
          Option<Long> scaleId, String name, Option<String> description, Option<String> settings, Resource resource) {
    CategoryDto dto = new CategoryDto().update(seriesExtId, seriesCategoryId, videoId, name, description, scaleId,
            settings, resource);
    dto.seriesExtId = seriesExtId.getOrElseNull();
    dto.seriesCategoryId = seriesCategoryId.getOrElseNull();
    dto.videoId = videoId.getOrElseNull();
    dto.scaleId = scaleId.getOrElseNull();
    return dto;
  }

  public CategoryDto update(Option<String> seriesExtId, Option<Long> seriesCategoryId, Option<Long> videoId,
          String name, Option<String> description, Option<Long> scaleId, Option<String> settings, Resource resource) {
    super.update(resource);
    this.seriesExtId = seriesExtId.getOrElseNull();
    this.seriesCategoryId = seriesCategoryId.getOrElseNull();
    this.videoId = videoId.getOrElseNull();
    this.name = name;
    this.description = description.getOrElseNull();
    this.scaleId = scaleId.getOrElseNull();
    this.settings = settings.getOrElseNull();
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public Category toCategory() {
    return new CategoryImpl(id, option(seriesExtId), option(seriesCategoryId), option(videoId), option(scaleId), name,
            option(description), option(settings), new ResourceImpl(option(access), option(createdBy),
                    option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt), option(deletedAt),
                    tags));
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
              jO(p("id", s.getId()), p("series_extid", s.getSeriesExtId()),
                      p("series_category_id", s.getSeriesCategoryId()), p("name", s.getName()),
                      p("description", s.getDescription()), p("settings", s.getSettings()),
                      p("scale_id", s.getScaleId())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService eas, int offset, List<Category> categories) {
    return jO(p("offset", offset), p("count", categories.size()),
            p("categories", jA(mlist(categories).map(toJson.curry(eas)))));
  }
}
