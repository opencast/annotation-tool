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

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.impl.AnnotationImpl;
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
import javax.persistence.Lob;
import javax.persistence.MapKeyColumn;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/** JPA/JSON link to {@link org.opencast.annotation.api.Annotation}. */
@Entity(name = "Annotation")
@Table(name = "xannotations_annotation")
@NamedQueries({
        @NamedQuery(name = "Annotation.findById", query = "select a from Annotation a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Annotation.findAllOfTrack", query = "select a from Annotation a where a.trackId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Annotation.findAllOfTrackStart", query = "select a from Annotation a where a.trackId = :id and a.start >= :start"),
        @NamedQuery(name = "Annotation.findAllOfTrackEnd", query = "select a from Annotation a where a.trackId = :id and (a.start + a.duration) <= :end"),
        @NamedQuery(name = "Annotation.findAllOfTrackStartEnd", query = "select a from Annotation a where a.trackId = :id and a.start >= :start and (a.start + a.duration) <= :end"),
        @NamedQuery(name = "Annotation.findAllOfTrackSince", query = "select a from Annotation a where a.trackId = :id and a.deletedAt IS NULL and ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "Annotation.deleteById", query = "delete from Annotation a where a.id = :id"),
        @NamedQuery(name = "Annotation.clear", query = "delete from Annotation") })
public class AnnotationDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "start", nullable = false)
  private double start;

  @Column(name = "duration")
  private Double duration;

  @Lob
  @Column(name = "content", nullable = false)
  private String content;

  @Column(name = "createdFromQuestionnaire")
  private long createdFromQuestionnaire;

  // Settings as JSON string
  @Column(name = "settings")
  private String settings;

  // Foreign keys
  @Column(name = "track_id", nullable = false)
  private long trackId;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_annotation_tags", joinColumns = @JoinColumn(name = "annotation_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static AnnotationDto create(long trackId, double start, Option<Double> duration, String content,
          long createdFromQuestionnaire, Option<String> settings, Resource resource) {
    final AnnotationDto dto = new AnnotationDto().update(start, duration, content, createdFromQuestionnaire,
            settings, resource);
    dto.trackId = trackId;
    return dto;
  }

  public AnnotationDto update(double start, Option<Double> duration, String content, long createdFromQuestionnaire,
          Option<String> settings, Resource resource) {
    super.update(resource);
    this.content = content;
    this.start = start;
    this.duration = duration.getOrElseNull();
    this.createdFromQuestionnaire = createdFromQuestionnaire;
    this.settings = settings.getOrElseNull();
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public static AnnotationDto fromAnnotation(Annotation a) {
    final AnnotationDto dto = create(a.getTrackId(), a.getStart(), a.getDuration(), a.getContent(),
            a.getCreatedFromQuestionnaire(), a.getSettings(), a);
    dto.id = a.getId();
    return dto;
  }

  public Annotation toAnnotation() {
    return new AnnotationImpl(id, trackId, start, option(duration), content, createdFromQuestionnaire, option(settings),
            new ResourceImpl(option(access), option(createdBy), option(updatedBy),
                    option(deletedBy), option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<AnnotationDto, Annotation> toAnnotation = new Function<AnnotationDto, Annotation>() {
    @Override
    public Annotation apply(AnnotationDto dto) {
      return dto.toAnnotation();
    }
  };

  public static final Function2<ExtendedAnnotationService, Annotation, JSONObject> toJson = new Function2<ExtendedAnnotationService, Annotation, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Annotation a) {
      return conc(
              AbstractResourceDto.toJson.apply(s, a),
              jO(p("id", a.getId()), p("start", a.getStart()), p("duration", a.getDuration()), p("content", a.getContent()),
                      p("createdFromQuestionnaire", a.getCreatedFromQuestionnaire()), p("settings", a.getSettings())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService s, int offset, List<Annotation> as) {
    return jO(p("offset", offset), p("count", as.size()), p("annotations", jA(mlist(as).map(toJson.curry(s)))));
  }
}
