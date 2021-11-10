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
import org.opencast.annotation.api.Label;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.impl.LabelImpl;
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

/** JPA/JSON link to {@link Label}. */
@Entity(name = "Label")
@Table(name = "xannotations_label")
@NamedQueries({
        @NamedQuery(name = "Label.findByIdIncludeDeleted", query = "select a from Label a where a.id = :id"),
        @NamedQuery(name = "Label.findById", query = "select a from Label a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Label.findAllOfCategory", query = "select a from Label a where a.categoryId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Label.findAllOfCategorySince", query = "select a from Label a where a.categoryId = :id and a.deletedAt IS NULL and ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "Label.deleteById", query = "delete from Label a where a.id = :id"),
        @NamedQuery(name = "Label.count", query = "select count(a) from Label a where a.deletedAt IS NULL"),
        @NamedQuery(name = "Label.clear", query = "delete from Label") })
public class LabelDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "series_label_id")
  private Long seriesLabelId;

  @Column(name = "value", nullable = false)
  private String value;

  @Column(name = "abbreviation", nullable = false)
  private String abbreviation;

  @Column(name = "description")
  private String description;

  @Column(name = "settings")
  private String settings;

  // Foreign key
  @Column(name = "category_id", nullable = false)
  private long categoryId;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_label_tags", joinColumns = @JoinColumn(name = "label_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static LabelDto create(Option<Long> seriesLabelId, long categoryId, String value, String abbreviation,
          Option<String> description, Option<String> settings, Resource resource) {
    LabelDto dto = new LabelDto().update(seriesLabelId, value, abbreviation, description, settings, resource);
    dto.categoryId = categoryId;
    return dto;
  }

  public LabelDto update(Option<Long> seriesLabelId, String value, String abbreviation, Option<String> description,
          Option<String> settings, Resource resource) {
    super.update(resource);
    this.seriesLabelId = seriesLabelId.getOrElseNull();
    this.value = value;
    this.abbreviation = abbreviation;
    this.description = description.getOrElseNull();
    this.settings = settings.getOrElseNull();
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public Label toLabel() {
    return new LabelImpl(id, option(seriesLabelId), categoryId, value, abbreviation, option(description),
            option(settings), new ResourceImpl(option(access), option(createdBy), option(updatedBy), option(deletedBy),
                    option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<LabelDto, Label> toLabel = new Function<LabelDto, Label>() {
    @Override
    public Label apply(LabelDto dto) {
      return dto.toLabel();
    }
  };

  public static final Function2<ExtendedAnnotationService, Label, JSONObject> toJson = new Function2<ExtendedAnnotationService, Label, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Label l) {
      Category category = s.getCategory(l.getCategoryId(), true).get();

      return conc(
              AbstractResourceDto.toJson.apply(s, l),
              jO(p("id", l.getId()), p("value", l.getValue()), p("abbreviation", l.getAbbreviation()),
                      p("description", l.getDescription()), p("settings", l.getSettings()),
                      p("category", CategoryDto.toJson.apply(s, category))));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService s, int offset, List<Label> ls) {
    return jO(p("offset", offset), p("count", ls.size()), p("labels", jA(mlist(ls).map(toJson.curry(s)))));
  }
}
