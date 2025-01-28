package org.opencast.annotation.impl;

import static org.opencastproject.util.data.Option.some;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Questionnaire;
import org.opencast.annotation.api.Resource;

import org.opencastproject.util.data.Option;

import java.util.Objects;

/**
 * The business model implementation of {@link org.opencast.annotation.api.Questionnaire}.
 */
public final class QuestionnaireImpl extends ResourceImpl implements Questionnaire {

  private final long id;
  private final long videoId;
  private final String title;
  private final String content;
  private final Option<String> settings;

  public QuestionnaireImpl(long id, long videoId, String title, String content, Option<String> settings, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(),
            resource.getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(),
            null);
    this.id = id;
    this.videoId = videoId;
    this.title = title;
    this.content = content;
    this.settings = settings;
  }

  @Override
  public long getId() {
    return id;
  }

  @Override
  public Option<Long> getVideo(ExtendedAnnotationService eas) {
    return some(videoId);
  }

  @Override
  public long getVideoId() {
    return videoId;
  }

  @Override
  public String getTitle() {
    return title;
  }

  @Override
  public String getContent() {
    return content;
  }

  @Override
  public Option<String> getSettings() {
    return settings;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    Questionnaire questionnaire = (Questionnaire) o;
    return id == questionnaire.getId()
            && videoId == questionnaire.getVideoId()
            && title.equals(questionnaire.getTitle())
            && content.equals(questionnaire.getContent())
            && settings.equals(questionnaire.getSettings())
            && getAccess() == questionnaire.getAccess();
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, videoId, title, content, settings);
  }
}
