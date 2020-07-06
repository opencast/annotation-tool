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
import static org.opencast.annotation.impl.Jsons.p;
import static org.opencastproject.util.data.Option.option;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.VideoImpl;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;

import org.json.simple.JSONObject;

import java.util.HashMap;
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

/** JPA/JSON link to {@link org.opencast.annotation.api.Video}. */
@Entity(name = "Video")
@Table(name = "xannotations_video")
@NamedQueries({
        @NamedQuery(name = "Video.findById", query = "select a from Video a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Video.findByExtId", query = "select a from Video a where a.extId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Video.findAll", query = "select a from Video a where a.deletedAt IS NULL"),
        @NamedQuery(name = "Video.deleteById", query = "delete from Video a where a.id = :id"),
        @NamedQuery(name = "Video.clear", query = "delete from Video") })
public final class VideoDto extends AbstractResourceDto {

  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "extid", nullable = false, unique = true)
  private String extId;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_video_tags", joinColumns = @JoinColumn(name = "video_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static VideoDto create(String extId, Resource resource) {
    return new VideoDto().update(extId, resource);
  }

  public VideoDto update(String extId, Resource resource) {
    super.update(resource);
    this.extId = extId;
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public Video toVideo() {
    return new VideoImpl(id, extId, new ResourceImpl(option(access), option(createdBy), option(updatedBy),
            option(deletedBy), option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<VideoDto, Video> toVideo = new Function<VideoDto, Video>() {
    @Override
    public Video apply(VideoDto dto) {
      return dto.toVideo();
    }
  };

  public static final Function2<ExtendedAnnotationService, Video, JSONObject> toJson = new Function2<ExtendedAnnotationService, Video, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Video v) {
      return conc(AbstractResourceDto.toJson.apply(s, v), jO(p("id", v.getId()), p("video_extid", v.getExtId())));
    }
  };
}
