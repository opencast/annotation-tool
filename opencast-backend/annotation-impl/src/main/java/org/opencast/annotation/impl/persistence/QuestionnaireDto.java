package org.opencast.annotation.impl.persistence;

import static org.opencast.annotation.impl.Jsons.conc;
import static org.opencast.annotation.impl.Jsons.jA;
import static org.opencast.annotation.impl.Jsons.jO;
import static org.opencast.annotation.impl.Jsons.p;
import static org.opencastproject.util.data.Monadics.mlist;
import static org.opencastproject.util.data.Option.option;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Questionnaire;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.impl.QuestionnaireImpl;
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

@Entity(name = "Questionnaire")
@Table(name = "xannotations_questionnaire")
@NamedQueries({
        @NamedQuery(name = "Questionnaire.findByIdIncludeDeleted", query = "select a from Questionnaire a where a.id = :id"),
        @NamedQuery(name = "Questionnaire.findById", query = "select a from Questionnaire a where a.id = :id and a.deletedAt IS NULL"),
        @NamedQuery(name = "Questionnaire.findAllOfTemplate", query = "select a from Questionnaire a where a.videoId IS NULL and a.deletedAt IS NULL"),
        @NamedQuery(name = "Questionnaire.findAllOfVideo", query = "select a from Questionnaire a where a.videoId = :id"),
        //@NamedQuery(name = "Questionnaire.findAllOfVideoSince", query = "select a from Questionnaire a where a.videoId = :id and a.deletedAt IS NULL and ((a.updatedAt IS NOT NULL AND a.updatedAt >= :since) OR (a.updatedAt IS NULL AND a.createdAt >= :since))"),
        @NamedQuery(name = "Questionnaire.deleteById", query = "delete from Questionnaire a where a.id = :id"),
        @NamedQuery(name = "Questionnaire.count", query = "select count(a) from Questionnaire a where a.deletedAt IS NULL"),
        @NamedQuery(name = "Questionnaire.clear", query = "delete from Questionnaire") })
public class QuestionnaireDto extends AbstractResourceDto {
  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;

  // Foreign key
  /** If video id is null, it is a template */
  @Column(name = "video_id")
  private Long videoId;

  @Column(name = "title", nullable = false)
  private String title;

  @Lob
  @Column(name = "content", nullable = false)
  private String content;

  @Column(name = "settings")
  private String settings;

  @ElementCollection
  @MapKeyColumn(name = "name")
  @Column(name = "value")
  @CollectionTable(name = "xannotations_questionnaire_tags", joinColumns = @JoinColumn(name = "questionnaire_id"))
  protected Map<String, String> tags = new HashMap<String, String>();

  public static QuestionnaireDto create(Option<Long> videoId, String title, String content, Option<String> settings, Resource resource) {
    QuestionnaireDto dto = new QuestionnaireDto().update(videoId, title, content, settings, resource);
    dto.videoId = videoId.getOrElseNull();

    return dto;
  }

  public QuestionnaireDto update(Option<Long> videoId, String title, String content, Option<String> settings, Resource resource) {
    super.update(resource);
    this.videoId = videoId.getOrElseNull();
    this.title = title;
    this.content = content;
    this.settings = settings.getOrElseNull();

    if (resource.getTags() != null)
      this.tags = resource.getTags();

    return this;
  }

  public Questionnaire toQuestionnaire() {
    return new QuestionnaireImpl(id, option(videoId), title, content, option(settings),
        new ResourceImpl(option(access), option(createdBy), option(updatedBy), option(deletedBy),
        option(createdAt), option(updatedAt), option(deletedAt), tags));
  }

  public static final Function<QuestionnaireDto, Questionnaire> toQuestionnaire = new Function<QuestionnaireDto, Questionnaire>() {
    @Override
    public Questionnaire apply(QuestionnaireDto dto) {
      return dto.toQuestionnaire();
    }
  };

  public static final Function2<ExtendedAnnotationService, Questionnaire, JSONObject> toJson = new Function2<ExtendedAnnotationService, Questionnaire, JSONObject>() {
    @Override
    public JSONObject apply(ExtendedAnnotationService eas, Questionnaire s) {
      return conc(
              AbstractResourceDto.toJson.apply(eas, s),
              jO(p("id", s.getId()), p("title", s.getTitle()),
              p("settings", s.getSettings()), p("content", s.getContent())));
    }
  };

  public static JSONObject toJson(ExtendedAnnotationService eas, int offset, List<Questionnaire> questionnaires) {
    return jO(p("offset", offset), p("count", questionnaires.size()),
            p("questionnaires", jA(mlist(questionnaires).map(toJson.curry(eas)))));
  }
}
