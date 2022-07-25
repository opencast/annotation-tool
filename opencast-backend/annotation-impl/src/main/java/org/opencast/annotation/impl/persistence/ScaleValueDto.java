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

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.ScaleValue;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.ScaleValueImpl;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;

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

/** JPA/JSON link to {@link ScaleValue}. */
@Entity(name = "ScaleValue")
@Table(name = "xannotations_scale_value")
@NamedQueries({
        @NamedQuery(name = "ScaleValue.findById", query = "select a from ScaleValue a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "ScaleValue.findByIdIncludeDeleted", query = "select a from ScaleValue a where a.id = :id"),
        @NamedQuery(name = "ScaleValue.deleteById", query = "delete from ScaleValue a where a.id = :id"),
        @NamedQuery(name = "ScaleValue.findAllOfScale", query = "select a from ScaleValue a where a.scaleId = :id"),
        @NamedQuery(name = "ScaleValue.findAllOfScaleSince", query = "select a from ScaleValue a where a.scaleId = :id and a.deletedAt IS NULL and ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "ScaleValue.count", query = "select count(a) from ScaleValue a where a.deletedAt IS NULL"),
        @NamedQuery(name = "ScaleValue.clear", query = "delete from ScaleValue") })
public class ScaleValueDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "value", nullable = false)
  private double value;

  @Column(name = "order_value", nullable = false)
  private int order;

  // Foreign key
  @Column(name = "scale_id", nullable = false)
  private long scaleId;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_scale_value_tags", joinColumns = @JoinColumn(name = "scale_value_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static ScaleValueDto create(long scaleId, String name, double value, int order, Resource resource) {
    ScaleValueDto dto = new ScaleValueDto().update(name, value, order, resource);
    dto.scaleId = scaleId;
    return dto;
  }

  public ScaleValueDto update(String name, double value, int order, Resource resource) {
    super.update(resource);
    this.name = name;
    this.value = value;
    this.order = order;
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public ScaleValue toScaleValue() {
    return new ScaleValueImpl(id, scaleId, name, value, order, new ResourceImpl(option(access), option(createdBy),
            option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<ScaleValueDto, ScaleValue> toScaleValue = new Function<ScaleValueDto, ScaleValue>() {
    @Override
    public ScaleValue apply(ScaleValueDto dto) {
      return dto.toScaleValue();
    }
  };

  public static final Function2<ExtendedAnnotationService, ScaleValue, JSONObject> toJson = new Function2<ExtendedAnnotationService, ScaleValue, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService eas, ScaleValue s) {
      Scale scale = eas.getScale(s.getScaleId(), true).get();

      return conc(
              AbstractResourceDto.toJson.apply(eas, s),
              jO(p("id", s.getId()), p("name", s.getName()), p("value", s.getValue()), p("order", s.getOrder()),
                      p("scale", ScaleDto.toJson.apply(eas, scale))));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService s, int offset, List<ScaleValue> scaleValues) {
    return jO(p("offset", offset), p("count", scaleValues.size()),
            p("scaleValues", jA(mlist(scaleValues).map(toJson.curry(s)))));
  }
}
