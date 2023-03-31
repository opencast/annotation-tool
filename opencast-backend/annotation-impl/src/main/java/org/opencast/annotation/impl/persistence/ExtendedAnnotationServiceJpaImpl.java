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

import static org.opencast.annotation.impl.persistence.AnnotationDto.toAnnotation;
import static org.opencast.annotation.impl.persistence.CategoryDto.toCategory;
import static org.opencast.annotation.impl.persistence.CommentDto.toComment;
import static org.opencast.annotation.impl.persistence.LabelDto.toLabel;
import static org.opencast.annotation.impl.persistence.QuestionnaireDto.toQuestionnaire;
import static org.opencast.annotation.impl.persistence.ScaleDto.toScale;
import static org.opencast.annotation.impl.persistence.ScaleValueDto.toScaleValue;
import static org.opencast.annotation.impl.persistence.TrackDto.toTrack;
import static org.opencast.annotation.impl.persistence.UserDto.toUser;
import static org.opencast.annotation.impl.persistence.VideoDto.toVideo;
import static org.opencastproject.util.data.Monadics.mlist;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.Option.some;
import static org.opencastproject.util.data.Tuple.tuple;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationException;
import org.opencast.annotation.api.ExtendedAnnotationException.Cause;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Label;
import org.opencast.annotation.api.Questionnaire;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.ScaleValue;
import org.opencast.annotation.api.Track;
import org.opencast.annotation.api.User;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.impl.AnnotationImpl;
import org.opencast.annotation.impl.CategoryImpl;
import org.opencast.annotation.impl.CommentImpl;
import org.opencast.annotation.impl.LabelImpl;
import org.opencast.annotation.impl.QuestionnaireImpl;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.ScaleImpl;
import org.opencast.annotation.impl.ScaleValueImpl;
import org.opencast.annotation.impl.TrackImpl;
import org.opencast.annotation.impl.UserImpl;
import org.opencast.annotation.impl.VideoImpl;

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.search.api.SearchQuery;
import org.opencastproject.search.api.SearchResultItem;
import org.opencastproject.search.api.SearchService;
import org.opencastproject.security.api.AuthorizationService;
import org.opencastproject.security.api.SecurityConstants;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.util.data.Effect;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Monadics;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.Option.Match;
import org.opencastproject.util.data.Predicate;
import org.opencastproject.util.data.Tuple;
import org.opencastproject.util.data.functions.Options;
import org.opencastproject.util.persistence.PersistenceEnv;
import org.opencastproject.util.persistence.PersistenceEnvs;
import org.opencastproject.util.persistence.Queries;

import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
import javax.persistence.Query;
import javax.persistence.RollbackException;

/**
 * JPA-based implementation of the {@link ExtendedAnnotationService}.
 */
@Component
public final class ExtendedAnnotationServiceJpaImpl implements ExtendedAnnotationService {

  private PersistenceEnv persistenceEnv;
  private SecurityService securityService;
  private AuthorizationService authorizationService;
  private SearchService searchService;

  @Reference(target = "(osgi.unit.name=org.opencast.annotation.impl.persistence)")
  public void setEntityManagerFactory(EntityManagerFactory entityManagerFactory) {
    this.persistenceEnv = PersistenceEnvs.persistenceEnvironment(entityManagerFactory);
  }

  @Reference
  public void setSecurityService(SecurityService securityService) {
    this.securityService = securityService;
  }

  @Reference
  public void setAuthorizationService(AuthorizationService authorizationService) {
    this.authorizationService = authorizationService;
  }

  @Reference
  public void setSearchService(SearchService searchService) {
    this.searchService = searchService;
  }

  /**
   * Run <code>f</code> inside a transaction with exception handling applied.
   *
   * @see #exhandler
   */
  private <A> A tx(Function<EntityManager, A> f) {
    return persistenceEnv.<A> tx().rethrow(exhandler).apply(f);
  }

  @Override
  public User createUser(String extId, String nickname, Option<String> email, Resource resource) {
    final UserDto dto = UserDto.create(extId, nickname, email, resource);
    return tx(Queries.persist(dto)).toUser();
  }

  @Override
  public void updateUser(final User u) {
    update("User.findById", u.getId(), new Effect<UserDto>() {
      @Override
      public void run(UserDto dto) {
        dto.update(u.getExtId(), u.getNickname(), u.getEmail(), u);
      }
    });
  }

  @Override
  public boolean deleteUser(User u) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(u);
    final User updated = new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), deleteResource);
    updateUser(updated);
    return true;
  }

  @Override
  public boolean clearDatabase() throws ExtendedAnnotationException {
    return tx(new Function<EntityManager, Boolean>() {
      @Override
      public Boolean apply(EntityManager em) {
        named.update(em, "Annotation.clear");
        named.update(em, "Track.clear");
        named.update(em, "User.clear");
        named.update(em, "Video.clear");
        named.update(em, "Category.clear");
        named.update(em, "Label.clear");
        named.update(em, "Annotation.clear");
        named.update(em, "Track.clear");
        named.update(em, "User.clear");
        named.update(em, "Video.clear");
        named.update(em, "Category.clear");
        named.update(em, "Label.clear");
        named.update(em, "Scale.clear");
        named.update(em, "ScaleValue.clear");
        named.update(em, "Comment.clear");
        return true;
      }
    });
  }

  @Override
  public Option<User> getUser(final long id) {
    return findById(toUser, "User.findById", id);
  }

  @Override
  public List<User> getUsers(final Option<Integer> offset, final Option<Integer> limit, final Option<Date> since)
          throws ExtendedAnnotationException {
    final Tuple<String, Object>[] qparams = qparams(since.map(tupleB("since")));
    final String q = since.isSome() ? "User.findAllSince" : "User.findAll";
    return tx(named.<UserDto> findAllM(q, offset, limit, qparams)).map(toUser).value();
  }

  @Override
  public Option<User> getUserByExtId(final String id) {
    return findById(toUser, "User.findByUserId", id);
  }

  @Override
  public Video createVideo(String extId, Resource resource) throws ExtendedAnnotationException {
    final VideoDto dto = VideoDto.create(extId, resource);
    return tx(Queries.persist(dto)).toVideo();
  }

  @Override
  public void updateVideo(final Video v) throws ExtendedAnnotationException {
    update("Video.findById", v.getId(), new Effect<VideoDto>() {
      @Override
      protected void run(VideoDto dto) {
        dto.update(v.getExtId(), v);
      }
    });
  }

  @Override
  public boolean deleteVideo(Video video) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(video);
    final Video updated = new VideoImpl(video.getId(), video.getExtId(), deleteResource);
    updateVideo(updated);

    List<Track> tracks = getTracks(video.getId(), none(), none(), none(), none(), none());
    for (Track track : tracks) {
      deleteTrack(track);
    }

    List<Category> categories = getCategories(none(), some(video.getId()), none(), none(), none(), none(), none());
    for (Category category : categories) {
      deleteCategory(category);
    }

    List<Scale> scales = getScales(some(video.getId()), none(), none(), none(), none(), none());
    for (Scale scale : scales) {
      deleteScale(scale);
    }
    return true;
  }

  @Override
  public Option<Video> getVideo(final long id) throws ExtendedAnnotationException {
    return getVideoDto(id).map(toVideo);
  }

  @Override
  public List<Video> getVideos() throws ExtendedAnnotationException {
    return tx(named.<VideoDto> findAllM("Video.findAll")).map(toVideo).value();
  }

  @Override
  public Option<Video> getVideoByExtId(final String id) throws ExtendedAnnotationException {
    return findById(toVideo, "Video.findByExtId", id);
  }

  @Override
  public Track createTrack(final long videoId, final String name, final Option<String> description,
          final Option<String> settings, final Resource resource) throws ExtendedAnnotationException {
    if (getVideoDto(videoId).isSome()) {
      final TrackDto dto = TrackDto.create(videoId, name, description, settings, resource);
      return tx(Queries.persist(dto)).toTrack();
    } else {
      throw notFound;
    }
  }

  @Override
  public Track createTrack(final Track track) throws ExtendedAnnotationException {
    if (getVideoDto(track.getVideoId()).isSome()) {
      return tx(Queries.persist(TrackDto.fromTrack(track))).toTrack();
    } else {
      throw notFound;
    }
  }

  @Override
  public boolean deleteTrack(Track t) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(t);
    final Track updated = new TrackImpl(t.getId(), t.getVideoId(), t.getName(), t.getDescription(), t.getSettings(),
            deleteResource);
    updateTrack(updated);

    List<Annotation> annotations = getAnnotations(t.getId(), none(), none(), none(), none(), none(), none(), none());
    for (Annotation a : annotations) {
      deleteAnnotation(a);
    }
    return true;
  }

  @Override
  public Option<Track> getTrack(final long trackId) throws ExtendedAnnotationException {
    return findById(toTrack, "Track.findById", trackId);
  }

  /** Remove all none values from the list of query parameters. */
  @SafeVarargs
  private static Tuple<String, Object>[] qparams(Option<Tuple<String, Object>>... p) {
    return Arrays.stream(p)
            .filter(Option::isSome)
            .map(Option::get)
            .<Tuple<String, Object>>toArray(Tuple[]::new);
  }

  @Override
  public List<Track> getTracks(final long videoId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {

    final Tuple<String, Object>[] qparams = qparams(some(id(videoId)),
            since.map(tupleB("since")));

    final String q = since.isSome() ? "Track.findAllOfVideoSince" : "Track.findAllOfVideo";

    List<Track> tracks = findAllWithParams(toTrack, offset, limit, q, qparams);

    if (tagsAnd.isSome())
      tracks = filterAndTags(tracks, tagsAnd.get());

    if (tagsOr.isSome())
      tracks = filterOrTags(tracks, tagsOr.get());

    tracks = filterByAccess(tracks);

    return tracks;
  }

  @Override
  public void updateTrack(final Track track) throws ExtendedAnnotationException {
    update("Track.findById", track.getId(), new Effect<TrackDto>() {
      @Override
      protected void run(TrackDto dto) {
        dto.update(track.getName(), track.getDescription(), track.getSettings(), track);
      }
    });
  }

  @Override
  public Annotation createAnnotation(final long trackId, final double start, final Option<Double> duration,
          final String content, final long createdFromQuestionnaire, final Option<String> settings, final Resource resource)
          throws ExtendedAnnotationException {
    if (getTrack(trackId).isSome()) {
      final AnnotationDto dto = AnnotationDto.create(trackId, start, duration, content, createdFromQuestionnaire,
              settings, resource);
      return tx(Queries.persist(dto)).toAnnotation();
    } else {
      throw notFound;
    }
  }

  @Override
  public Annotation createAnnotation(final Annotation annotation) throws ExtendedAnnotationException {
    if (getTrackDto(annotation.getTrackId()).isSome()) {
      return tx(Queries.persist(AnnotationDto.fromAnnotation(annotation))).toAnnotation();
    } else {
      throw notFound;
    }
  }

  @Override
  public void updateAnnotation(final Annotation a) throws ExtendedAnnotationException {
    update("Annotation.findById", a.getId(), new Effect<AnnotationDto>() {
      @Override
      protected void run(AnnotationDto dto) {
        dto.update(a.getStart(), a.getDuration(), a.getContent(), a.getCreatedFromQuestionnaire(), a.getSettings(), a);
      }
    });
  }

  /** Generic update method. */
  private <A> void update(String q, long id, Effect<A> update) {
    tx(Options.foreach(named.findSingle(q, id(id)), update)).orError(notFound);
  }

  @Override
  public boolean deleteAnnotation(Annotation a) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(a);
    final Annotation updated = new AnnotationImpl(a.getId(), a.getTrackId(), a.getStart(), a.getDuration(),
            a.getContent(), a.getCreatedFromQuestionnaire(), a.getSettings(), deleteResource);
    updateAnnotation(updated);
    return true;
  }

  @Override
  public Option<Annotation> getAnnotation(long id) throws ExtendedAnnotationException {
    return findById(toAnnotation, "Annotation.findById", id);
  }

  @Override
  public List<Annotation> getAnnotations(final long trackId, final Option<Double> start, final Option<Double> end,
          final Option<Integer> offset, final Option<Integer> limit, final Option<Date> since,
          final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {

    List<Annotation> annotations;
    // TODO refactoring with since
    if (start.isSome() && end.isSome()) {
      annotations = findAllWithParams(toAnnotation, offset, limit, "Annotation.findAllOfTrackStartEnd",
              tuple("start", start.get()), tuple("end", end.get()));
    } else if (start.isSome()) {
      annotations = findAllWithParams(toAnnotation, offset, limit, "Annotation.findAllOfTrackStart",
              tuple("start", start.get()));
    } else if (end.isSome()) {
      annotations = findAllWithParams(toAnnotation, offset, limit, "Annotation.findAllOfTrackEnd",
              tuple("end", end.get()));
    } else {
      annotations = findAllById(toAnnotation, offset, limit, "Annotation.findAllOfTrack", trackId);
    }

    if (tagsAnd.isSome())
      annotations = filterAndTags(annotations, tagsAnd.get());

    if (tagsOr.isSome())
      annotations = filterOrTags(annotations, tagsOr.get());

    // Filter out structured annotations from categories the current user cannot access
    annotations = filterByCategoryAccess(annotations);

    return annotations;
  }

  @Override
  public Scale createScale(Option<Long> videoId, String name, Option<String> description, Resource resource)
          throws ExtendedAnnotationException {
    final ScaleDto dto = ScaleDto.create(videoId, name, description, resource);
    return tx(Queries.persist(dto)).toScale();
  }

  @Override
  public Scale createScaleFromTemplate(long videoId, long templateScaleId, Resource resource)
          throws ExtendedAnnotationException {
    // Copy scale
    Option<Scale> templateScale = getScale(templateScaleId, false);
    if (templateScale.isNone())
      throw new ExtendedAnnotationException(Cause.SERVER_ERROR);

    Scale scale = createScale(Option.some(videoId), templateScale.get().getName(),
            templateScale.get().getDescription(), resource);

    for (ScaleValue sv : getScaleValuesByScaleId(templateScaleId)) {
      createScaleValue(scale.getId(), sv.getName(), sv.getValue(), sv.getOrder(), resource);
    }
    return scale;
  }

  @Override
  public Option<Scale> getScale(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    final Option<ScaleDto> dto;
    if (includeDeleted) {
      dto = findById("Scale.findByIdIncludeDeleted", id);
    } else {
      dto = findById("Scale.findById", id);
    }
    return dto.map(toScale);
  }

  @Override
  public List<Scale> getScales(Option<Long> videoId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {
    List<Scale> scales = videoId.fold(new Option.Match<Long, List<Scale>>() {
      @Override
      public List<Scale> some(Long id) {
        return findAllById(toScale, offset, limit, "Scale.findAllOfVideo", id);
      }

      @Override
      public List<Scale> none() {
        return tx(named.<ScaleDto> findAllM("Scale.findAllOfTemplate", offset, limit)).map(toScale).value();
      }
    });

    if (tagsAnd.isSome())
      scales = filterAndTags(scales, tagsAnd.get());

    if (tagsOr.isSome())
      scales = filterOrTags(scales, tagsOr.get());

    return scales;
  }

  private List<ScaleValue> getScaleValuesByScaleId(final long scaleId) throws ExtendedAnnotationException {
    return findAllById(toScaleValue, some(0), some(0), "ScaleValue.findAllOfScale", scaleId);
  }

  @Override
  public List<ScaleValue> getScaleValues(final long scaleId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {
    final Tuple<String, Object>[] qparams = qparams(some(id(scaleId)),
            since.map(tupleB("since")));
    final String q = since.isSome() ? "Scale.findAllOfScaleSince" : "ScaleValue.findAllOfScale";
    List<ScaleValue> scaleValues = tx(named.<ScaleValueDto> findAllM(q, offset, limit, qparams)).map(toScaleValue)
            .value();

    if (tagsAnd.isSome())
      scaleValues = filterAndTags(scaleValues, tagsAnd.get());

    if (tagsOr.isSome())
      scaleValues = filterOrTags(scaleValues, tagsOr.get());

    return scaleValues;
  }

  @Override
  public void updateScale(final Scale s) throws ExtendedAnnotationException {
    update("Scale.findByIdIncludeDeleted", s.getId(), new Effect<ScaleDto>() {
      @Override
      public void run(ScaleDto dto) {
        dto.update(s.getName(), s.getDescription(), s).toScale();
      }
    });
  }

  @Override
  public Scale deleteScale(Scale s) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(s);
    final Scale updated = new ScaleImpl(s.getId(), s.getVideoId(), s.getName(), s.getDescription(), deleteResource);
    updateScale(updated);

    for (ScaleValue sv : getScaleValuesByScaleId(s.getId())) {
      deleteScaleValue(sv);
    }
    return updated;
  }

  @Override
  public ScaleValue createScaleValue(long scaleId, String name, double value, int order, Resource resource)
          throws ExtendedAnnotationException {
    final ScaleValueDto dto = ScaleValueDto.create(scaleId, name, value, order, resource);

    return tx(Queries.persist(dto)).toScaleValue();
  }

  @Override
  public Option<ScaleValue> getScaleValue(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    Option<ScaleValueDto> dto;
    if (includeDeleted) {
      dto = findById("ScaleValue.findByIdIncludeDeleted", id);
    } else {
      dto = findById("ScaleValue.findById", id);
    }
    return dto.map(toScaleValue);
  }

  @Override
  public void updateScaleValue(final ScaleValue s) throws ExtendedAnnotationException {
    update("ScaleValue.findByIdIncludeDeleted", s.getId(), new Effect<ScaleValueDto>() {
      @Override
      public void run(ScaleValueDto dto) {
        dto.update(s.getName(), s.getValue(), s.getOrder(), s);
      }
    });
  }

  @Override
  public ScaleValue deleteScaleValue(ScaleValue s) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(s);
    final ScaleValue updated = new ScaleValueImpl(s.getId(), s.getScaleId(), s.getName(), s.getValue(), s.getAccess(),
            deleteResource);
    updateScaleValue(updated);
    return updated;
  }

  @Override
  public Category createCategory(Option<String> seriesExtId, Option<Long> seriesCategoryId, Option<Long> videoId,
          Option<Long> scaleId, String name, Option<String> description, Option<String> settings, Resource resource)
          throws ExtendedAnnotationException {
    final CategoryDto dto = CategoryDto.create(seriesExtId, seriesCategoryId, videoId, scaleId, name, description,
            settings, resource);

    return tx(Queries.persist(dto)).toCategory();
  }

  @Override
  public Option<Category> createCategoryFromTemplate(final long templateCategoryId, final String seriesExtId,
          final Long seriesCategoryId, final long videoId, final Resource resource) throws ExtendedAnnotationException {
    return getCategory(templateCategoryId, false).map(new Function<Category, Category>() {
      @Override
      public Category apply(Category c) {
        Long scaleId = null;
        // Copy scale
        if (c.getScaleId().isSome()) {
          Option<Scale> scale = getScale(c.getScaleId().get(), false);
          if (scale.isNone())
            throw new ExtendedAnnotationException(Cause.SERVER_ERROR);

          scaleId = createScale(Option.some(videoId), scale.get().getName(), scale.get().getDescription(), resource)
                  .getId();

          for (ScaleValue sv : getScaleValuesByScaleId(c.getScaleId().get())) {
            createScaleValue(scaleId, sv.getName(), sv.getValue(), sv.getOrder(), resource);
          }
        }
        // Copy category
        final CategoryDto copyDto = CategoryDto.create(option(seriesExtId), option(seriesCategoryId),
                Option.some(videoId), option(scaleId), c.getName(), c.getDescription(), c.getSettings(), resource);
        Category category = (Category) tx(new Function<EntityManager, Object>() {
          @Override
          public Object apply(EntityManager em) {
            return Queries.persist(copyDto).apply(em).toCategory();
          }
        });

        // Copy labels
        for (Label l : getLabelsByCategoryId(templateCategoryId)) {
          createLabel(category.getId(), l.getValue(), l.getAbbreviation(), l.getDescription(), l.getSettings(),
                  resource);
        }
        return category;
      }
    });
  }

  @Override
  public void updateCategory(final Category c) throws ExtendedAnnotationException {
    update("Category.findByIdIncludeDeleted", c.getId(), new Effect<CategoryDto>() {
      @Override
      public void run(CategoryDto dto) {
        dto.update(c.getSeriesExtId(), c.getSeriesCategoryId(), c.getVideoId(), c.getName(), c.getDescription(),
                c.getScaleId(), c.getSettings(), c);
      }
    });
  }

  @Override
  public void updateCategoryAndDeleteOtherSeriesCategories(final Category c) throws ExtendedAnnotationException {
    // Get the pre-update version of the category, to figure out its seriesCategoryId
    Option<CategoryDto> dto;
    Option<Category> pastC = none();
    dto = findById("Category.findById", c.getId());
    if (dto.isSome()) {
      pastC = dto.map(toCategory);
    }

    // Get all categories on all videos belonging to the seriesCategoryId (including the master)
    if (pastC.isSome() && pastC.get().getSeriesCategoryId().isSome()) {
      List<Category> categoryAndClones = findAllById(toCategory, none(), none(), "Category.findAllOfSeriesCategory",
              pastC.get().getSeriesCategoryId().get());

      // Delete all but the master category (which is the "c" passed to this function)
      // Update the master category with the videoId to move it to this video
      for (int j = 0; j < categoryAndClones.size(); j++) {
        long a = categoryAndClones.get(j).getId();
        long b = c.getId();
        if (a != b) {
          deleteCategoryImpl(categoryAndClones.get(j));
        }
      }
    }
    updateCategory(c);
  }

  @Override
  public Option<Category> getCategory(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    Option<CategoryDto> dto;
    if (includeDeleted) {
      dto = findById("Category.findByIdIncludeDeleted", id);
    } else {
      dto = findById("Category.findById", id);
    }
    return dto.map(toCategory);
  }

  @Override
  public List<Category> getCategories(final Option<String> seriesExtId, final Option<Long> videoId,
          final Option<Integer> offset, final Option<Integer> limit, Option<Date> since,
          final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {
    List<Category> categories = videoId.fold(new Option.Match<Long, List<Category>>() {
      @Override
      public List<Category> some(Long id) {
        List<Category> categories = findAllById(toCategory, offset, limit, "Category.findAllOfVideo", id);

        return filterByAccess(categories);
      }

      @Override
      public List<Category> none() {
        return tx(named.<CategoryDto> findAllM("Category.findAllOfTemplate", offset, limit)).map(toCategory).value();
      }
    });

    if (seriesExtId.isSome()) {
      // Make categories editable
      List<Category> allCategories = new ArrayList<>(categories);

      List<Category> createdCategories = new ArrayList<>();
      // Grab the categories with seriesExtId.
      List<Category> seriesExtIdCategories = findAllById(toCategory, offset, limit, "Category.findAllOfExtSeries",
              seriesExtId.get());

      // Grab all master series categories by removing every category that is not referencing itself
      List<Category> seriesCategories = new ArrayList<>(seriesExtIdCategories);
      seriesCategories.removeIf(n -> n.getId() != n.getSeriesCategoryId().getOrElse(-1L));

      // Link a category to a master series category if they are "sufficiently" equal
      for (Category videoCategory : allCategories) {
        for (Category seriesCategory: seriesCategories) {
          if (categoriesSufficientlyEqual(videoCategory, seriesCategory)) {
            Category update = new CategoryImpl(videoCategory.getId(), seriesCategory.getSeriesExtId(),
                    option(seriesCategory.getId()), videoCategory.getVideoId(), seriesCategory.getScaleId(),
                    seriesCategory.getName(), seriesCategory.getDescription(), seriesCategory.getSettings(),
                    new ResourceImpl(option(seriesCategory.getAccess()), seriesCategory.getCreatedBy(),
                            seriesCategory.getUpdatedBy(), seriesCategory.getDeletedBy(), seriesCategory.getCreatedAt(),
                            seriesCategory.getUpdatedAt(), seriesCategory.getDeletedAt(), seriesCategory.getTags()));
            updateCategory(update);
            allCategories.set(allCategories.indexOf(videoCategory), update);
          }
        }
      }

      // Check for every master series category if a local copy needs to be created or updated
      for (Category seriesCategory : seriesCategories) {
        boolean alreadyExists = false;
        Category existingCategory = null;

        // Check if we already have video category corresponding to the series category
        for (Category videoCategory : allCategories) {
          // If we have, update the existing video category
          if (videoCategory.getSeriesCategoryId().isSome() && videoCategory.getSeriesCategoryId().get() == seriesCategory.getId()) {
            alreadyExists = true;
            existingCategory = videoCategory;
            break;  // Don't need to continue the loop
          }
        }
        // If we have, update the existing video category
        if (alreadyExists) {
          Category update = new CategoryImpl(existingCategory.getId(), seriesCategory.getSeriesExtId(),
                  option(seriesCategory.getId()), videoId, seriesCategory.getScaleId(), seriesCategory.getName(),
                  seriesCategory.getDescription(), seriesCategory.getSettings(),
                  new ResourceImpl(option(seriesCategory.getAccess()), seriesCategory.getCreatedBy(),
                          seriesCategory.getUpdatedBy(), seriesCategory.getDeletedBy(), seriesCategory.getCreatedAt(),
                          seriesCategory.getUpdatedAt(), seriesCategory.getDeletedAt(), seriesCategory.getTags()));
          updateCategory(update);
          allCategories.set(allCategories.indexOf(existingCategory), update);
          // If we don't have, create a new video category
        } else {
          Category newCategory;
          newCategory = createCategory(seriesCategory.getSeriesExtId(), option(seriesCategory.getId()), videoId,
                  seriesCategory.getScaleId(), seriesCategory.getName(), seriesCategory.getDescription(),
                  seriesCategory.getSettings(), new ResourceImpl(option(seriesCategory.getAccess()),
                          seriesCategory.getCreatedBy(), seriesCategory.getUpdatedBy(), seriesCategory.getDeletedBy(),
                          seriesCategory.getCreatedAt(), seriesCategory.getUpdatedAt(), seriesCategory.getDeletedAt(),
                          seriesCategory.getTags()));
          createdCategories.add(newCategory);
        }
      }

      allCategories.addAll(createdCategories);
      categories = allCategories;
    }

    if (tagsAnd.isSome())
      categories = filterAndTags(categories, tagsAnd.get());

    if (tagsOr.isSome())
      categories = filterOrTags(categories, tagsOr.get());

    return categories;
  }

  private boolean categoriesSufficientlyEqual(Category a, Category b) {
    if (a.getName().equals(b.getName()) && a.getDescription().equals(b.getDescription())
    && a.getSettings().equals(b.getSettings()) && a.getTags().equals(b.getTags())) {
      return true;
    }

    return false;
  }

  @Override
  public Category deleteCategory(Category category) throws ExtendedAnnotationException {
    Category result = null;

    // If the category is a series category, delete all corresponding series category
    if (category.getSeriesCategoryId().isSome()) {
      List<Category> withSeriesCategoryId = findAllById(toCategory, none(), none(), "Category.findAllOfSeriesCategory",
              category.getSeriesCategoryId().get());
      for (Category categoryBelongingToMaster: withSeriesCategoryId) {
        result = deleteCategoryImpl(categoryBelongingToMaster);
        if (result == null) { break; }
      }
    // Delete the category
    } else {
      result = deleteCategoryImpl(category);
    }

    return result;
  }

  public Category deleteCategoryImpl(Category category) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(category);
    final Category updated = new CategoryImpl(category.getId(), category.getSeriesExtId(),
            category.getSeriesCategoryId(), category.getVideoId(), category.getScaleId(), category.getName(),
            category.getDescription(), category.getSettings(), deleteResource);
    updateCategory(updated);

    for (Label l : getLabelsByCategoryId(category.getId())) {
      deleteLabel(l);
    }
    return updated;
  }

  @Override
  public Label createLabel(long categoryId, String value, String abbreviation, Option<String> description,
          Option<String> settings, Resource resource) throws ExtendedAnnotationException {
    // Handle series categories
    // If the category belongs to a series, create the label on the series category instead
    Option<Category> category = getCategory(categoryId, false);
    Option<Category> seriesCategory;
    // If the category belongs to a series
    if (category.isSome() && category.get().getSeriesCategoryId().isSome()) {
      Long categorySeriesCategoryId = category.get().getSeriesCategoryId().get();
      seriesCategory = getCategory(categorySeriesCategoryId, false);
      // And the category is not itself (aka the master series category)
      if (seriesCategory.isSome() && categoryId != (seriesCategory.get().getId())) {
        final LabelDto dto = LabelDto.create(none(), categorySeriesCategoryId, value, abbreviation, description,
                settings, resource);
        return tx(Queries.persist(dto)).toLabel();
      }
    }

    // Normal Create
    final LabelDto dto = LabelDto.create(none(), categoryId, value, abbreviation, description, settings, resource);
    return tx(Queries.persist(dto)).toLabel();
  }

  @Override
  public void updateLabel(final Label l) throws ExtendedAnnotationException {
    long updateLabelId = l.getId();

    // If the label belongs to a category copy of a series category, update the label on the series category instead
    if (l.getSeriesLabelId().isSome()) {
      updateLabelId = l.getSeriesLabelId().get();
    }

    update("Label.findByIdIncludeDeleted", updateLabelId, new Effect<LabelDto>() {
      @Override
      protected void run(LabelDto dto) {
        dto.update(l.getSeriesLabelId(), l.getValue(), l.getAbbreviation(), l.getDescription(), l.getSettings(), l);
      }
    });
  }

  @Override
  public Option<Label> getLabel(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    Option<LabelDto> dto;
    if (includeDeleted) {
      dto = findById("Label.findByIdIncludeDeleted", id);
    } else {
      dto = findById("Label.findById", id);
    }
    return dto.map(toLabel);
  }

  @Override
  public List<Label> getLabels(final long categoryId, final Option<Integer> offset, final Option<Integer> limit,
          final Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {

    List<Label> labels;

    if (since.isSome())
      labels = findAllWithParams(toLabel, offset, limit, "Label.findAllOfCategorySince",
              tuple("since", since.get()));
    else
      labels = findAllWithParams(toLabel, offset, limit, "Label.findAllOfCategory", tuple("id", categoryId));

    // Handle series categories
    // Series categories initially do not have any labels of themselves, so we need to generate them in case they
    // ever turn into back into normal categories
    Option<Category> category = getCategory(categoryId, false);
    Option<Category> seriesCategory;
    // If the category belongs to a series
    if (category.isSome() && category.get().getSeriesCategoryId().isSome()) {
      Long categorySeriesCategoryId = category.get().getSeriesCategoryId().get();
      seriesCategory = getCategory(categorySeriesCategoryId, false);
      // And the category is not itself (aka the master series category)
      if (seriesCategory.isSome() && categoryId != (seriesCategory.get().getId())) {
        // Get labels from the master series category
        List<Label> seriesCategoryLabels = getLabels(seriesCategory.get().getId(), none(), none(), none(), none(), none());

        // Update our labels with the labels from the master series category
        // Note: Maybe do an actual update instead of delete/create
        for (Label label: labels) {
          deleteLabel(label);
        }
        List<Label> newLabels = new ArrayList<>();
        for (Label seriesLabel : seriesCategoryLabels) {
          final LabelDto dto = LabelDto.create(some(seriesLabel.getId()), categoryId, seriesLabel.getValue(),
                  seriesLabel.getAbbreviation(), seriesLabel.getDescription(), seriesLabel.getSettings(),
                  new ResourceImpl(option(seriesLabel.getAccess()),
                          seriesLabel.getCreatedBy(), seriesLabel.getUpdatedBy(), seriesLabel.getDeletedBy(),
                          seriesLabel.getCreatedAt(), seriesLabel.getUpdatedAt(), seriesLabel.getDeletedAt(),
                          seriesLabel.getTags()));
          newLabels.add(tx(Queries.persist(dto)).toLabel());
        }

        // Return series labels, so that they are updated in the backend
        // At some point you probably want to associated copied labels with their original, so they can be properly updated
        // This will lose changes made on non-master category labels if the master then looses their series.
        // But that is quite a rare scenario (hopefully) and I'm running out of time.

        // @todo CC | Fix: 1) Series labels get infinitely duplicated on each HTTP request.
        // @todo CC | Fix: 2) Overriding labels (like old code did) prevented accessing potentially deleted labels, breaking annotations that use it (= full app error).
        // @todo CC | Fix: 3) Remove temporary workaround that simply merges old + new labels (just to get the app running until a fix is there)
        List<Label> merged = new ArrayList<>();
        merged.addAll(labels);
        merged.addAll(newLabels);

        labels = merged;
      }
    }

    if (tagsAnd.isSome())
      labels = filterAndTags(labels, tagsAnd.get());

    if (tagsOr.isSome())
      labels = filterOrTags(labels, tagsOr.get());

    return labels;
  }

  private List<Label> getLabelsByCategoryId(final long categoryId) throws ExtendedAnnotationException {
    return findAllById(toLabel, some(0), some(0), "Label.findAllOfCategory", categoryId);
  }

  @Override
  public Label deleteLabel(Label label) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(label);
    final Label updated = new LabelImpl(label.getId(), none(), label.getCategoryId(), label.getValue(),
            label.getAbbreviation(), label.getDescription(), label.getSettings(), deleteResource);
    updateLabel(updated);
    return updated;
  }

  @Override
  public Comment createComment(long annotationId, Option<Long> replyToId, String text, Resource resource) {
    final CommentDto dto = CommentDto.create(annotationId, text, replyToId, resource);
    return tx(Queries.persist(dto)).toComment();
  }

  @Override
  public Option<Comment> getComment(long id) {
    return findById(toComment, "Comment.findById", id);
  }

  @Override
  public List<Comment> getComments(final long annotationId, final Option<Long> replyToId, final Option<Integer> offset,
          final Option<Integer> limit, Option<Date> since, Option<Map<String, String>> tagsAnd,
          Option<Map<String, String>> tagsOr) {

    List<Comment> comments;

    if (replyToId.isSome()) {
      if (since.isSome())
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllRepliesSince",
                tuple("since", since.get()), tuple("id", replyToId.get()));
      else
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllReplies",
                tuple("id", replyToId.get()));
    } else {
      if (since.isSome())
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllOfAnnotationSince",
                tuple("since", since.get()), tuple("id", annotationId));
      else
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllOfAnnotation",
                tuple("id", annotationId));
    }

    if (tagsAnd.isSome())
      comments = filterAndTags(comments, tagsAnd.get());

    if (tagsOr.isSome())
      comments = filterOrTags(comments, tagsOr.get());

    return comments;
  }

  @Override
  public void updateComment(final Comment comment) {
    update("Comment.findById", comment.getId(), new Effect<CommentDto>() {
      @Override
      public void run(CommentDto dto) {
        dto.update(comment.getText(), comment);
      }
    });
  }

  @Override
  public boolean deleteComment(Comment comment) {
    Resource deleteResource = deleteResource(comment);
    final Comment updated = new CommentImpl(comment.getId(), comment.getAnnotationId(), comment.getText(), none(),
            deleteResource);
    updateComment(updated);
    return true;
  }

  @Override
  public Questionnaire createQuestionnaire(Option<Long> videoId, String title, String content, Option<String> settings, Resource resource)
          throws ExtendedAnnotationException {
    final QuestionnaireDto dto = QuestionnaireDto.create(videoId, title, content, settings, resource);

    return tx(Queries.persist(dto)).toQuestionnaire();
  }

  @Override
  public Option<Questionnaire> getQuestionnaire(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    Option<QuestionnaireDto> dto;

    if (includeDeleted) {
      dto = findById("Questionnaire.findByIdIncludeDeleted", id);
    } else {
      dto = findById("Questionnaire.findById", id);
    }
    return dto.map(toQuestionnaire);
  }

  @Override
  public List<Questionnaire> getQuestionnaires(final Option<Long> videoId,
          final Option<Integer> offset, final Option<Integer> limit, Option<Date> since,
          final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {

    List<Questionnaire> questionnaires = videoId.fold(new Option.Match<Long, List<Questionnaire>>() {
      @Override
      public List<Questionnaire> some(Long id) {
        List<Questionnaire> questionnaires = findAllById(toQuestionnaire, offset, limit, "Questionnaire.findAllOfVideo", id);

        return filterByAccess(questionnaires);
      }

      @Override
      public List<Questionnaire> none() {
        return tx(named.<QuestionnaireDto> findAllM("Questionnaire.findAllOfTemplate", offset, limit)).map(toQuestionnaire).value();
      }
    });

    if (tagsAnd.isSome())
      questionnaires = filterAndTags(questionnaires, tagsAnd.get());

    if (tagsOr.isSome())
      questionnaires = filterOrTags(questionnaires, tagsOr.get());

    return questionnaires;
  }

  @Override
  public Option<Questionnaire> createQuestionnaireFromTemplate(
      final long templateQuestionnaireId,
      final long videoId,
      final Resource resource) throws ExtendedAnnotationException {
    return getQuestionnaire(templateQuestionnaireId, false).map(new Function<Questionnaire, Questionnaire>() {
      @Override
      public Questionnaire apply(Questionnaire q) {
        final QuestionnaireDto copyDto = QuestionnaireDto.create(Option.some(videoId), q.getTitle(), q.getContent(), q.getSettings(), resource);

        Questionnaire questionnaire = (Questionnaire) tx(new Function<EntityManager, Object>() {
          @Override
          public Object apply(EntityManager em) {
            return Queries.persist(copyDto).apply(em).toQuestionnaire();
          }
        });

        return questionnaire;
      }
    });
  }

  @Override
  public void updateQuestionnaire(final Questionnaire q) throws ExtendedAnnotationException {
    update("Questionnaire.findByIdIncludeDeleted", q.getId(), new Effect<QuestionnaireDto>() {
      @Override
      public void run(QuestionnaireDto dto) {
        dto.update(q.getVideoId(), q.getTitle(), q.getContent(), q.getSettings(), q);
      }
    });
  }

  @Override
  public Questionnaire deleteQuestionnaire(Questionnaire questionnaire) throws ExtendedAnnotationException {
    Questionnaire result = null;
    Resource deleteResource = deleteResource(questionnaire);

    final Questionnaire updated = new QuestionnaireImpl(questionnaire.getId(), questionnaire.getVideoId(),
            questionnaire.getTitle(), questionnaire.getContent(), questionnaire.getSettings(), deleteResource);

    updateQuestionnaire(updated);

    return updated;
  }

  // --

  /** Transform any exception from the JPA persistence layer into an API exception. */
  private static final Function<Exception, ExtendedAnnotationException> exhandler = new Function<Exception, ExtendedAnnotationException>() {
    @Override
    public ExtendedAnnotationException apply(Exception e) {
      if (e instanceof ExtendedAnnotationException) {
        return (ExtendedAnnotationException) e;
      } else if (e instanceof RollbackException) {
        final Throwable cause = e.getCause();
        String message = cause.getMessage().toLowerCase();
        if (message.contains("unique") || message.contains("duplicate"))
          return new ExtendedAnnotationException(Cause.DUPLICATE);
      }
      return new ExtendedAnnotationException(Cause.SERVER_ERROR, e);
    }
  };

  private static final ExtendedAnnotationException notFound = new ExtendedAnnotationException(Cause.NOT_FOUND);

  /**
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private <A, B> Option<A> findById(final Function<B, A> toA, final String queryName, final Object id) {
    return tx(named.<B> findSingle(queryName, id(id))).map(toA);
  }

  /**
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private <A> Option<A> findById(final String queryName, final Object id) {
    return tx(named.findSingle(queryName, id(id)));
  }

  /**
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private <A, B> List<A> findAllById(final Function<B, A> toA, final Option<Integer> offset,
          final Option<Integer> limit, final String queryName, final Object id) {
    return tx(named.<B> findAllM(queryName, offset, limit, id(id))).map(toA).value();
  }

  @SafeVarargs
  private final <A, B> List<A> findAllWithParams(final Function<B, A> toA, final Option<Integer> offset,
          final Option<Integer> limit, final String queryName, final Tuple<String, ?>... params) {
    return tx(named.<B> findAllM(queryName, offset, limit, params)).map(toA).value();
  }

  private Option<VideoDto> getVideoDto(final long id) {
    return findById("Video.findById", id);
  }

  private Option<TrackDto> getTrackDto(final long id) {
    return findById("Track.findById", id);
  }

  /** Create an "id" parameter tuple. */
  public static <A> Tuple<String, A> id(A id) {
    return tuple("id", id);
  }

  @Override
  public Resource createResource() {
    return createResource(none());
  }

  @Override
  public Resource createResource(final Option<Map<String, String>> tags) {
    return createResource(none(), tags);
  }

  @Override
  public Resource createResource(final Option<Integer> access, final Option<Map<String, String>> tags) {
    final Option<Long> userId = getCurrentUserId();
    final Option<Date> now = some(new Date());
    Map<String, String> tagsMap;
    tagsMap = tags.getOrElse(new Function0<Map<String, String>>() {
      @Override
      public Map<String, String> apply() {
        return new HashMap<>();
      }
    });
    return new ResourceImpl(access, userId, userId, none(), now, now, none(), tagsMap);
  }

  @Override
  public Resource updateResource(final Resource r) {
    return updateResource(r, some(r.getTags()));
  }

  @Override
  public Resource updateResource(final Resource r, final Option<Map<String, String>> tags) {
    Map<String, String> tagsMap;
    if (tags.isSome())
      tagsMap = tags.get();
    else
      tagsMap = new HashMap<>();
    return new ResourceImpl(some(r.getAccess()), r.getCreatedBy(), getCurrentUserId(), r.getDeletedBy(),
            r.getCreatedAt(), some(new Date()), r.getDeletedAt(), tagsMap);
  }

  @Override
  public Resource deleteResource(final Resource r) {
    return new ResourceImpl(option(r.getAccess()), r.getCreatedBy(), r.getUpdatedBy(), getCurrentUserId(),
            r.getCreatedAt(), r.getUpdatedAt(), some(new Date()), r.getTags());
  }

  /**
   * Get the annotation tool user id of an Opencast user
   *
   * @param user
   *          the Opencast user to get the annotation tool user id of
   * @return the annotation tool user id of the given Opencast user
   */
  private Option<Long> getUserId(org.opencastproject.security.api.User user) {
    return getUserByExtId(user.getUsername()).map(new Function<User, Long>() {
      @Override
      public Long apply(User user) {
        return user.getId();
      }
    });
  }

  /**
   * Get the ID of the current user. The current user is retrieved from the security service.
   *
   * @return the created resource
   */
  private Option<Long> getCurrentUserId() {
    return getUserId(securityService.getUser());
  }

  @Override
  public boolean hasResourceAccess(Resource resource) {
    org.opencastproject.security.api.User opencastUser = securityService.getUser();

    return resource.getAccess() == Resource.PUBLIC
        || resource.getAccess() == Resource.SHARED_WITH_EVERYONE
        || resource.getCreatedBy().equals(getUserId(opencastUser))
        || isOpencastAdmin(opencastUser)
        || resource.getAccess() == Resource.SHARED_WITH_ADMIN && isAnnotateAdmin(getResourceVideo(resource));
  }

  private boolean isOpencastAdmin(org.opencastproject.security.api.User user) {
    return user.hasRole(SecurityConstants.GLOBAL_ADMIN_ROLE)
            || user.hasRole(securityService.getOrganization().getAdminRole());
  }

  private boolean isAnnotateAdmin(Option<Video> video) {

    return video.fold(new Match<Video, Boolean>() {
      @Override
      public Boolean some(Video video) {
        for (MediaPackage mediaPackage: findMediaPackage(video.getExtId())) {
          return hasVideoAccess(mediaPackage, ANNOTATE_ADMIN_ACTION);
        }
        return false;
      }
      @Override
      public Boolean none() {
        return false;
      }
    });
  }

  @Override
  public Option<MediaPackage> findMediaPackage(String id) {
    return head(searchService.getByQuery(new SearchQuery().withId(id)).getItems()).map(
      new Function<SearchResultItem, MediaPackage>() {
        @Override
        public MediaPackage apply(SearchResultItem searchResultItem) {
          return searchResultItem.getMediaPackage();
        }
      }
    );
  }

  @Override
  public boolean hasVideoAccess(MediaPackage mediaPackage, String access) {
    return isOpencastAdmin(securityService.getUser()) || authorizationService.hasPermission(mediaPackage, access);
  }

  private Option<Video> getResourceVideo(Resource resource) {
    return resource.getVideo(this).bind(new Function<Long, Option<Video>>() {
      @Override
      public Option<Video> apply(Long videoId) {
        return getVideo(videoId);
      }
    });
  }

  private final Function<Resource, Boolean> hasResourceAccess = new Function<Resource, Boolean>() {
    @Override
    public Boolean apply(Resource resource) {
      return hasResourceAccess(resource);
    }
  };

  private static final boolean INCLUDE_DELETED = true;

  private boolean hasCategoryAccess(Annotation annotation) {
    try {
      @SuppressWarnings("unchecked")
      List<Map<String, Object>> content = (List<Map<String, Object>>) new JSONParser().parse(annotation.getContent());
      for (Map<String, Object> contentItem : content) {
        Object type = contentItem.get("type");
        long labelId;
        if ("label".equals(type)) {
          labelId = (long) contentItem.get("value");
        } else if ("scaling".equals(type)) {
          @SuppressWarnings("unchecked")
          Map<String, Long> value = (Map<String, Long>) contentItem.get("value");
          labelId = value.get("label");
        } else {
          continue;
        }

        Label label = getLabel(labelId, INCLUDE_DELETED).get();
        Category category = getCategory(label.getCategoryId(), INCLUDE_DELETED).get();
        if (!hasResourceAccess(category)) {
          return false;
        }
      }
    } catch (ParseException e) {
      throw new RuntimeException(e);
    }
    return true;
  }

  private final Function<Annotation, Boolean> hasCategoryAccess = new Function<Annotation, Boolean>() {
    @Override
    public Boolean apply(Annotation annotation) {
      return hasCategoryAccess(annotation);
    }
  };

  private <T extends Resource> List<T> filterOrTags(List<T> originalList, Map<String, String> tags) {
    if (tags.size() < 1)
      return originalList;

    List<T> list = new ArrayList<>();

    // OR
    resource: for (T resource : originalList) {
      Map<String, String> resourceTags = resource.getTags();
      for (String key : tags.keySet()) {
        String value = resourceTags.get(key);
        if (value != null && value.equals(tags.get(key))) {
          list.add(resource);
          continue resource;
        }
      }
    }
    return list;
  }

  private <T extends Resource> List<T> filterByAccess(List<T> originalList) {
    return mlist(originalList).filter(hasResourceAccess).value();
  }

  private <T extends Annotation> List<T> filterByCategoryAccess(List<T> originalList) {
    return mlist(originalList).filter(hasCategoryAccess).value();
  }

  private <T extends Resource> List<T> filterAndTags(final List<T> originalList, final Map<String, String> tags) {
    if (tags.size() < 1) {
      return originalList;
    } else {
      return mlist(originalList).filter(new Predicate<T>() {
        @Override
        public Boolean apply(T resource) {
          Map<String, String> resourceTags = resource.getTags();
          for (String key : tags.keySet()) {
            String value = resourceTags.get(key);
            if (value == null || !value.equals(tags.get(key)))
              return false;
          }
          return true;
        }
      }).value();
    }
  }

  /**
   * Wrapper for {@link org.opencastproject.util.persistence.Queries#named}
   * to support safe varargs without warnings
   */
  // TODO Why this wrapper ...
  private static class NamedWrapper {
    @SafeVarargs
    public final boolean update(EntityManager em, String q, Tuple<String, ?>... params) {
      return Queries.named.update(em, q, params);
    }

    @SuppressWarnings("SameParameterValue")
    @SafeVarargs
    final <A> Function<EntityManager, Monadics.ListMonadic<A>> findAllM(String q, Tuple<String, ?>... params) {
      return findAllM(q, none(), none(), params);
    }

    @SafeVarargs
    final <A> Function<EntityManager, Monadics.ListMonadic<A>> findAllM(String q, Option<Integer> maybeOffset,
            Option<Integer> maybeLimit, Tuple<String, ?>... params) {
      return new Function<EntityManager, Monadics.ListMonadic<A>>() {
        @Override
        public Monadics.ListMonadic<A> apply(EntityManager entityManager) {
          Query query = Queries.named.query(entityManager, q, params);
          for (Integer offset: maybeOffset) query.setFirstResult(offset);
          for (Integer limit: maybeLimit) query.setMaxResults(limit);
          @SuppressWarnings("unchecked")
          List<A> results = query.getResultList();
          return mlist(results);
        }
      };
    }

    @SafeVarargs
    final <A> Function<EntityManager, Option<A>> findSingle(String q, Tuple<String, ?>... params) {
      return new Function<EntityManager, Option<A>>() {
        @Override
        public Option<A> apply(EntityManager entityManager) {
          try {
            Query query = Queries.named.query(entityManager, q, params);
            @SuppressWarnings("unchecked")
            A result = (A) query.getSingleResult();
            return some(result);
          } catch (NoResultException | NonUniqueResultException e) {
            return none();
          }
        }
      };
    }
  }
  private static final NamedWrapper named = new NamedWrapper();

  @SuppressWarnings("SameParameterValue")
  private static <A, B> Function<B, Tuple<A, B>> tupleB(final A a) {
    return new Function<B, Tuple<A, B>>() {
      @Override
      public Tuple<A, B> apply(final B b) {
        return tuple(a, b);
      }
    };
  }

  private static <A> Option<A> head(final A[] as) {
    if (as.length > 0) {
      return some(as[0]);
    } else {
      return none();
    }
  }
}
