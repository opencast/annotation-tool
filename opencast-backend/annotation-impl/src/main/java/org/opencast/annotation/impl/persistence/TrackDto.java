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
import org.opencast.annotation.api.Track;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.TrackImpl;

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

/** JPA/JSON link to {@link org.opencast.annotation.api.Track}. */
@Entity(name = "Track")
@Table(name = "xannotations_track")
@NamedQueries({
        @NamedQuery(name = "Track.findById", query = "select a from Track a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Track.findAllOfVideo", query = "select a from Track a where a.videoId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Track.clear", query = "delete from Track") })
public class TrackDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "description")
  private String description;

  // Settings as JSON string
  @Column(name = "settings")
  private String settings;

  // Foreign key
  @Column(name = "video_id", nullable = false)
  private long videoId;

  public static TrackDto create(long videoId, String name, Option<String> description,  Option<String> settings,
          Resource resource) {
    final TrackDto dto = new TrackDto().update(name, description, settings, resource);
    dto.videoId = videoId;
    return dto;
  }

  public static TrackDto fromTrack(Track t) {
    return create(t.getVideoId(), t.getName(), t.getDescription(), t.getSettings(), t);
  }

  public TrackDto update(String name, Option<String> description, Option<String> settings,
          Resource resource) {
    super.update(resource);
    this.name = name;
    this.description = description.getOrElseNull();
    this.settings = settings.getOrElseNull();
    return this;
  }

  public Track toTrack() {
    return new TrackImpl(id, videoId, name, option(description), option(settings), new ResourceImpl(option(access),
            option(createdBy), option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt),
            option(deletedAt), null));
  }

  public static final Function<TrackDto, Track> toTrack = new Function<>() {
    @Override
    public Track apply(TrackDto dto) {
      return dto.toTrack();
    }
  };

  public static final Function2<ExtendedAnnotationService, Track, JSONObject> toJson = new Function2<>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Track t) {
      return conc(AbstractResourceDto.toJson.apply(s, t),
          jO(p("id", t.getId()), p("name", t.getName()), p("description", t.getDescription()), p("settings", t.getSettings())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService eas, Stream<Track> ts) {
    return jO(p("tracks", jA(ts.map(t -> toJson.apply(eas, t)).toArray())));
  }
}
