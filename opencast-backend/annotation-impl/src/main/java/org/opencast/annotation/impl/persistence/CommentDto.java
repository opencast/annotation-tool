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

import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.impl.CommentImpl;
import org.opencast.annotation.impl.ResourceImpl;

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
import javax.persistence.Lob;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/** JPA/JSON link to {@link Comment}. */
@Entity(name = "Comment")
@Table(name = "xannotations_comment")
@NamedQueries({
        @NamedQuery(name = "Comment.findById", query = "select a from Comment a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Comment.findAllOfAnnotation", query = "select a from Comment a where a.annotationId = :id and a.deletedAt IS NULL AND a.replyToId IS NULL"),
        @NamedQuery(name = "Comment.findAllReplies", query = "select a from Comment a where a.replyToId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Comment.clear", query = "delete from Comment") })
public class CommentDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Lob
  @Column(name = "text", nullable = false)
  private String text;

  // Foreign keys
  @Column(name = "annotation_id", nullable = false)
  private long annotationId;

  @Column(name = "reply_to_id")
  private Long replyToId;

  public static CommentDto create(long annotationId, String text, Option<Long> replyToId, Resource resource) {
    CommentDto dto = new CommentDto().update(text, resource);
    dto.annotationId = annotationId;
    dto.replyToId = replyToId.getOrElseNull();
    return dto;
  }

  public CommentDto update(String text, Resource resource) {
    super.update(resource);
    this.text = text;
    return this;
  }

  public Comment toComment() {
    return new CommentImpl(id, annotationId, text, option(replyToId), new ResourceImpl(option(access),
            option(createdBy), option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt),
            option(deletedAt), null));
  }

  public static final Function<CommentDto, Comment> toComment = new Function<>() {
    @Override
    public Comment apply(CommentDto dto) {
      return dto.toComment();
    }
  };

  public static final Function2<ExtendedAnnotationService, Comment, JSONObject> toJson = new Function2<>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Comment c) {
      return conc(AbstractResourceDto.toJson.apply(s, c), jO(p("id", c.getId()), p("text", c.getText())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService s, Stream<Comment> cs) {
    return jO(p("comments", jA(cs.map(c -> toJson.apply(s, c)).toArray())));
  }
}
