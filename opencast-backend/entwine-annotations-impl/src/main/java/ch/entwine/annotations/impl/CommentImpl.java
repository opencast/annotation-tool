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
package ch.entwine.annotations.impl;

import org.opencastproject.util.EqualsUtil;
import org.opencastproject.util.data.Option;

import ch.entwine.annotations.api.Comment;
import ch.entwine.annotations.api.Resource;

/**
 * The business model implementation of {@link ch.entwine.annotations.api.Comment}.
 */
public final class CommentImpl extends ResourceImpl implements Comment {

  private final long id;
  private final long annotationId;
  private final String text;

  public CommentImpl(long id, long annotationId, String text, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.annotationId = annotationId;
    this.text = text;
  }

  /**
   * @see ch.entwine.annotations.api.Comment#getId()
   */
  @Override
  public long getId() {
    return id;
  }

  /**
   * @see ch.entwine.annotations.api.Comment#getAnnotationId()
   */
  @Override
  public long getAnnotationId() {
    return annotationId;
  }

  /**
   * @see ch.entwine.annotations.api.Comment#getText()
   */
  @Override
  public String getText() {
    return text;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    Comment comment = (Comment) o;
    return id == comment.getId() && annotationId == comment.getAnnotationId() && text.equals(comment.getText())
            && getTags().equals(comment.getTags());
  }

  @Override
  public int hashCode() {
    return EqualsUtil.hash(id, annotationId, text, getTags());
  }

}
