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
import static org.opencastproject.util.data.Option.option;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.ScaleImpl;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import org.json.simple.JSONObject;

import java.util.stream.Stream;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/** JPA/JSON link to {@link Scale}. */
@Entity(name = "Scale")
@Table(name = "xannotations_scale")
@NamedQueries({
        @NamedQuery(name = "Scale.findById", query = "select a from Scale a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Scale.findByIdIncludeDeleted", query = "select a from Scale a where a.id = :id"),
        @NamedQuery(name = "Scale.findAllOfVideo", query = "select a from Scale a where a.videoId = :id"),
        @NamedQuery(name = "Scale.clear", query = "delete from Scale") })
public class ScaleDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "description")
  private String description;

  // Foreign key
  @Column(name = "video_id", nullable = false)
  private long videoId;

  public static ScaleDto create(long videoId, String name, Option<String> description, Resource resource) {
    final ScaleDto dto = new ScaleDto().update(name, description, resource);
    dto.videoId = videoId;
    return dto;
  }

  public ScaleDto update(String name, Option<String> description, Resource resource) {
    super.update(resource);
    this.name = name;
    this.description = description.getOrElseNull();
    return this;
  }

  public Scale toScale() {
    return new ScaleImpl(id, videoId, name, option(description), new ResourceImpl(option(access),
            option(createdBy), option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt),
            option(deletedAt), null));
  }

  public static final Function<ScaleDto, Scale> toScale = new Function<>() {
    @Override
    public Scale apply(ScaleDto dto) {
      return dto.toScale();
    }
  };

  public static final Function2<ExtendedAnnotationService, Scale, JSONObject> toJson = new Function2<>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService eas, Scale s) {
      return conc(AbstractResourceDto.toJson.apply(eas, s),
          jO(p("id", s.getId()), p("name", s.getName()), p("description", s.getDescription())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService eas, Stream<Scale> scales) {
    return jO(p("scales", jA(scales.map(s -> toJson.apply(eas, s)).toArray())));
  }
}
