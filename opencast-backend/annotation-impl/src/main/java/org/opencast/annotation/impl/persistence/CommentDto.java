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
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;

import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;

import org.opencast.annotation.impl.CommentImpl;
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
import javax.persistence.Lob;
import javax.persistence.MapKeyColumn;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;

/** JPA/JSON link to {@link Comment}. */
@Entity(name = "Comment")
@Table(name = "xannotations_comment")
@NamedQueries({
        @NamedQuery(name = "Comment.findByIdIncludeDeleted", query = "select a from Comment a where a.id = :id"),
        @NamedQuery(name = "Comment.findById", query = "select a from Comment a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Comment.findAllOfAnnotation", query = "select a from Comment a where a.annotationId = :id and a.deletedAt IS NULL AND a.replyToId IS NULL"),
        @NamedQuery(name = "Comment.findAllOfAnnotationSince", query = "select a from Comment a where a.annotationId = :id AND a.replyToId IS NULL AND a.deletedAt IS NULL AND ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "Comment.findAllReplies", query = "select a from Comment a where a.replyToId = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Comment.findAllRepliesSince", query = "select a from Comment a where a.replyToId = :id AND a.deletedAt IS NULL AND ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "Comment.deleteById", query = "delete from Comment a where a.id = :id"),
        @NamedQuery(name = "Comment.count", query = "select count(a) from Comment a where a.deletedAt IS NULL"),
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

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_comment_tags", joinColumns = @JoinColumn(name = "comment_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static CommentDto create(long annotationId, String text, Option<Long> replyToId, Resource resource) {
    CommentDto dto = new CommentDto().update(text, resource);
    dto.annotationId = annotationId;
    dto.replyToId = replyToId.getOrElseNull();
    return dto;
  }

  public CommentDto update(String text, Resource resource) {
    super.update(resource);
    this.text = text;
    if (resource.getTags() != null)
      this.tags = resource.getTags();
    return this;
  }

  public Comment toComment() {
    return new CommentImpl(id, annotationId, text, option(replyToId), new ResourceImpl(option(access),
            option(createdBy), option(updatedBy), option(deletedBy), option(createdAt), option(updatedAt),
            option(deletedAt), tags));
  }

  public static final Function<CommentDto, Comment> toComment = new Function<CommentDto, Comment>() {
    @Override
    public Comment apply(CommentDto dto) {
      return dto.toComment();
    }
  };

  public static final Function2<ExtendedAnnotationService, Comment, JSONObject> toJson = new Function2<ExtendedAnnotationService, Comment, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService s, Comment c) {
      return conc(AbstractResourceDto.toJson.apply(s, c), jO(p("id", c.getId()), p("text", c.getText())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService s, int offset, List<Comment> ls) {
    return jO(p("offset", offset), p("count", ls.size()), p("comments", jA(mlist(ls).map(toJson.curry(s)))));
  }

}
