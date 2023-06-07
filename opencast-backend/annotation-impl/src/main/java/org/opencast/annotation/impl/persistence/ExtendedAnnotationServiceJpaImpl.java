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
import static org.opencast.annotation.impl.persistence.ScaleDto.toScale;
import static org.opencast.annotation.impl.persistence.ScaleValueDto.toScaleValue;
import static org.opencast.annotation.impl.persistence.TrackDto.toTrack;
import static org.opencast.annotation.impl.persistence.UserDto.toUser;
import static org.opencast.annotation.impl.persistence.VideoDto.toVideo;
import static org.opencastproject.db.Queries.namedQuery;
import static org.opencastproject.util.data.Monadics.mlist;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.Option.some;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationException;
import org.opencast.annotation.api.ExtendedAnnotationException.Cause;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Label;
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
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.ScaleImpl;
import org.opencast.annotation.impl.ScaleValueImpl;
import org.opencast.annotation.impl.TrackImpl;
import org.opencast.annotation.impl.UserImpl;
import org.opencast.annotation.impl.VideoImpl;

import org.opencastproject.db.DBSession;
import org.opencastproject.db.DBSessionFactory;
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
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.Option.Match;
import org.opencastproject.util.data.Predicate;

import org.apache.commons.lang3.tuple.Pair;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
import javax.persistence.RollbackException;
import javax.persistence.TypedQuery;

/**
 * JPA-based implementation of the {@link ExtendedAnnotationService}.
 */
@Component
public final class ExtendedAnnotationServiceJpaImpl implements ExtendedAnnotationService {

  private EntityManagerFactory entityManagerFactory;
  private DBSessionFactory dbSessionFactory;
  private DBSession db;
  private SecurityService securityService;
  private AuthorizationService authorizationService;
  private SearchService searchService;

  @Activate
  public void activate() {
    db = dbSessionFactory.createSession(entityManagerFactory);
  }

  @Deactivate
  public synchronized void deactivate() {
    db.close();
  }

  @Reference(target = "(osgi.unit.name=org.opencast.annotation.impl.persistence)")
  public void setEntityManagerFactory(EntityManagerFactory entityManagerFactory) {
    this.entityManagerFactory = entityManagerFactory;
  }

  @Reference
  public void setDBSessionFactory(DBSessionFactory dbSessionFactory) {
    this.dbSessionFactory = dbSessionFactory;
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
   */
  private <A> A tx(java.util.function.Function<EntityManager, A> f) {
    try {
      return db.execTx(f);
    } catch (Exception e) {
      if (e instanceof ExtendedAnnotationException) {
        throw (ExtendedAnnotationException) e;
      } else if (e instanceof RollbackException) {
        final Throwable cause = e.getCause();
        String message = cause.getMessage().toLowerCase();
        if (message.contains("unique") || message.contains("duplicate"))
          throw new ExtendedAnnotationException(Cause.DUPLICATE);
      } else if (e instanceof NoResultException) {
        throw new ExtendedAnnotationException(Cause.NOT_FOUND);
      }
      throw new ExtendedAnnotationException(Cause.SERVER_ERROR, e);
    }
  }

  @Override
  public User createUser(String extId, String nickname, Option<String> email, Resource resource) {
    final UserDto dto = UserDto.create(extId, nickname, email, resource);
    return tx(namedQuery.persist(dto)).toUser();
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
    return tx(em -> {
        namedQuery.update("Annotation.clear").apply(em);
        namedQuery.update("Track.clear").apply(em);
        namedQuery.update("User.clear").apply(em);
        namedQuery.update("Video.clear").apply(em);
        namedQuery.update("Category.clear").apply(em);
        namedQuery.update("Label.clear").apply(em);
        namedQuery.update("Annotation.clear").apply(em);
        namedQuery.update("Track.clear").apply(em);
        namedQuery.update("User.clear").apply(em);
        namedQuery.update("Video.clear").apply(em);
        namedQuery.update("Category.clear").apply(em);
        namedQuery.update("Label.clear").apply(em);
        namedQuery.update("Scale.clear").apply(em);
        namedQuery.update("ScaleValue.clear").apply(em);
        namedQuery.update("Comment.clear").apply(em);
        return true;
    });
  }

  @Override
  public Option<User> getUser(final long id) {
    return findById(toUser, "User.findById", id);
  }

  @Override
  public List<User> getUsers(final Option<Integer> offset, final Option<Integer> limit, final Option<Date> since)
          throws ExtendedAnnotationException {
    final Pair<String, Object>[] qparams = qparams(since.map(pairB("since")));
    final String q = since.isSome() ? "User.findAllSince" : "User.findAll";

    List<UserDto> result = findAllWithOffsetAndLimit(UserDto.class, q, offset, limit, qparams);

    return result.stream()
            .map(UserDto::toUser)
            .collect(Collectors.toList());
  }

  @Override
  public Option<User> getUserByExtId(final String id) {
    return findById(toUser, "User.findByUserId", id);
  }

  @Override
  public Video createVideo(String extId, Resource resource) throws ExtendedAnnotationException {
    final VideoDto dto = VideoDto.create(extId, resource);
    return tx(namedQuery.persist(dto)).toVideo();
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
    List<VideoDto> result = findAllWithOffsetAndLimit(VideoDto.class, "Video.findAll", none(), none());

    return result.stream()
            .map(VideoDto::toVideo)
            .collect(Collectors.toList());
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
      return tx(namedQuery.persist(dto)).toTrack();
    } else {
      throw notFound;
    }
  }

  @Override
  public Track createTrack(final Track track) throws ExtendedAnnotationException {
    if (getVideoDto(track.getVideoId()).isSome()) {
      return tx(namedQuery.persist(TrackDto.fromTrack(track))).toTrack();
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
  private static Pair<String, Object>[] qparams(Option<Pair<String, Object>>... p) {
    return Arrays.stream(p)
            .filter(Option::isSome)
            .map(Option::get)
            .<Pair<String, Object>>toArray(Pair[]::new);
  }

  @Override
  public List<Track> getTracks(final long videoId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {

    final Pair<String, Object>[] qparams = qparams(some(id(videoId)),
            since.map(pairB("since")));

    final String q = since.isSome() ? "Track.findAllOfVideoSince" : "Track.findAllOfVideo";

    List<TrackDto> trackDtos = findAllWithOffsetAndLimit(TrackDto.class, q, offset, limit, qparams);
    List <Track> tracks = trackDtos.stream()
            .map(TrackDto::toTrack)
            .collect(Collectors.toList());

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
  public Annotation createAnnotation(final long trackId, final Option<String> text, final double start,
          final Option<Double> duration, final Option<String> settings, final Option<Long> labelId,
          final Option<Long> scaleValueId, final Resource resource) throws ExtendedAnnotationException {
    if (getTrack(trackId).isSome()) {
      final AnnotationDto dto = AnnotationDto.create(trackId, text, start, duration, settings, labelId, scaleValueId,
              resource);
      return tx(namedQuery.persist(dto)).toAnnotation();
    } else {
      throw notFound;
    }
  }

  @Override
  public Annotation createAnnotation(final Annotation annotation) throws ExtendedAnnotationException {
    if (getTrackDto(annotation.getTrackId()).isSome()) {
      return tx(namedQuery.persist(AnnotationDto.fromAnnotation(annotation))).toAnnotation();
    } else {
      throw notFound;
    }
  }

  @Override
  public void updateAnnotation(final Annotation a) throws ExtendedAnnotationException {
    update("Annotation.findById", a.getId(), new Effect<AnnotationDto>() {
      @Override
      protected void run(AnnotationDto dto) {
        dto.update(a.getText(), a.getStart(), a.getDuration(), a.getSettings(), a);
      }
    });
  }

  /** Generic update method. */
  private <A> void update(String q, long id, Effect<A> update) {
    tx(em -> {
      A o = (A) namedQuery.find(q, Pair.of("id", id)).apply(em);

      update.apply(o);
      return o;
    }); //.orError(notFound);
  }

  @Override
  public boolean deleteAnnotation(Annotation a) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(a);
    final Annotation updated = new AnnotationImpl(a.getId(), a.getTrackId(), a.getText(), a.getStart(),
            a.getDuration(), a.getSettings(), a.getLabelId(), a.getScaleValueId(), deleteResource);
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
    List<AnnotationDto> annotationDtos = new ArrayList<>();
    if (start.isSome() && end.isSome()) {
      annotationDtos = findAllWithOffsetAndLimit(AnnotationDto.class, "Annotation.findAllOfTrackStartEnd", offset, limit, Pair.of("start", start.get()), Pair.of("end", end.get()));
    } else if (start.isSome()) {
      annotationDtos = findAllWithOffsetAndLimit(AnnotationDto.class, "Annotation.findAllOfTrackStart", offset, limit, Pair.of("start", start.get()));
    } else if (end.isSome()) {
      annotationDtos = findAllWithOffsetAndLimit(AnnotationDto.class, "Annotation.findAllOfTrackEnd", offset, limit, Pair.of("end", end.get()));
    } else {
      annotationDtos = findAllWithOffsetAndLimit(AnnotationDto.class, "Annotation.findAllOfTrack", offset, limit, id(trackId));
    }

    annotations = annotationDtos.stream()
            .map(AnnotationDto::toAnnotation)
            .collect(Collectors.toList());

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
    return tx(namedQuery.persist(dto)).toScale();
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
        List<ScaleDto> scaleDtos = findAllWithOffsetAndLimit(ScaleDto.class, "Scale.findAllOfVideo", offset, limit, id(id));
        return scaleDtos.stream()
                .map(ScaleDto::toScale)
                .collect(Collectors.toList());
      }

      @Override
      public List<Scale> none() {
        List<ScaleDto> scaleDtos = findAllWithOffsetAndLimit(ScaleDto.class, "Scale.findAllOfTemplate", offset, limit);
        return scaleDtos.stream()
                .map(ScaleDto::toScale)
                .collect(Collectors.toList());
      }
    });

    if (tagsAnd.isSome())
      scales = filterAndTags(scales, tagsAnd.get());

    if (tagsOr.isSome())
      scales = filterOrTags(scales, tagsOr.get());

    return scales;
  }

  private List<ScaleValue> getScaleValuesByScaleId(final long scaleId) throws ExtendedAnnotationException {
    List<ScaleValueDto> scaleValueDtos = findAllWithOffsetAndLimit(ScaleValueDto.class, "ScaleValue.findAllOfScale", none(), none(), id(scaleId));
    return scaleValueDtos.stream()
            .map(ScaleValueDto::toScaleValue)
            .collect(Collectors.toList());
  }

  @Override
  public List<ScaleValue> getScaleValues(final long scaleId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {
    final Pair<String, Object>[] qparams = qparams(some(id(scaleId)),
            since.map(pairB("since")));
    final String q = since.isSome() ? "Scale.findAllOfScaleSince" : "ScaleValue.findAllOfScale";
    List<ScaleValueDto> scaleValueDtos = findAllWithOffsetAndLimit(ScaleValueDto.class, q, offset, limit, qparams);
    List<ScaleValue> scaleValues = scaleValueDtos.stream()
            .map(ScaleValueDto::toScaleValue)
            .collect(Collectors.toList());

    if (tagsAnd.isSome())
      scaleValues = filterAndTags(scaleValues, tagsAnd.get());

    if (tagsOr.isSome())
      scaleValues = filterOrTags(scaleValues, tagsOr.get());

    return scaleValues;
  }

  @Override
  public void updateScale(final Scale s) throws ExtendedAnnotationException {
    update("Scale.findById", s.getId(), new Effect<ScaleDto>() {
      @Override
      public void run(ScaleDto dto) {
        dto.update(s.getName(), s.getDescription(), s).toScale();
      }
    });
  }

  @Override
  public boolean deleteScale(Scale s) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(s);
    final Scale updated = new ScaleImpl(s.getId(), s.getVideoId(), s.getName(), s.getDescription(), deleteResource);
    updateScale(updated);

    for (ScaleValue sv : getScaleValuesByScaleId(s.getId())) {
      deleteScaleValue(sv);
    }
    return true;
  }

  @Override
  public ScaleValue createScaleValue(long scaleId, String name, double value, int order, Resource resource)
          throws ExtendedAnnotationException {
    final ScaleValueDto dto = ScaleValueDto.create(scaleId, name, value, order, resource);

    return tx(namedQuery.persist(dto)).toScaleValue();
  }

  @Override
  public Option<ScaleValue> getScaleValue(long id) throws ExtendedAnnotationException {
    return this.<ScaleValueDto> findById("ScaleValue.findById", id).map(toScaleValue);
  }

  @Override
  public void updateScaleValue(final ScaleValue s) throws ExtendedAnnotationException {
    update("ScaleValue.findById", s.getId(), new Effect<ScaleValueDto>() {
      @Override
      public void run(ScaleValueDto dto) {
        dto.update(s.getName(), s.getValue(), s.getOrder(), s);
      }
    });
  }

  @Override
  public boolean deleteScaleValue(ScaleValue s) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(s);
    final ScaleValue updated = new ScaleValueImpl(s.getId(), s.getScaleId(), s.getName(), s.getValue(), s.getAccess(),
            deleteResource);
    updateScaleValue(updated);
    return true;
  }

  @Override
  public Category createCategory(Option<String> seriesExtId, Option<Long> seriesCategoryId, Option<Long> videoId,
          Option<Long> scaleId, String name, Option<String> description, Option<String> settings, Resource resource)
          throws ExtendedAnnotationException {
    final CategoryDto dto = CategoryDto.create(seriesExtId, seriesCategoryId, videoId, scaleId, name, description,
            settings, resource);

    return tx(namedQuery.persist(dto)).toCategory();
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
        Category category = tx(namedQuery.persist(copyDto)).toCategory();

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
    update("Category.findById", c.getId(), new Effect<CategoryDto>() {
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
      List<CategoryDto> categoryDtos = findAllWithOffsetAndLimit(CategoryDto.class, "Category.findAllOfSeriesCategory", none(), none(), id(pastC.get().getSeriesCategoryId().get()));
      List<Category> categoryAndClones = categoryDtos.stream()
              .map(CategoryDto::toCategory)
              .collect(Collectors.toList());

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
        List<CategoryDto> categoryDtos = findAllWithOffsetAndLimit(CategoryDto.class, "Category.findAllOfVideo", offset, limit, id(id));
        return categoryDtos.stream()
                .map(CategoryDto::toCategory)
                .collect(Collectors.toList());
      }

      @Override
      public List<Category> none() {
        List<CategoryDto> categoryDtos = findAllWithOffsetAndLimit(CategoryDto.class, "Category.findAllOfTemplate", offset, limit);
        return categoryDtos.stream()
                .map(CategoryDto::toCategory)
                .collect(Collectors.toList());
      }
    });

    if (seriesExtId.isSome()) {
      // Make categories editable
      List<Category> allCategories = new ArrayList<>(categories);

      List<Category> createdCategories = new ArrayList<>();
      // Grab the categories with seriesExtId.
      List<CategoryDto> categoryDtos = findAllWithOffsetAndLimit(CategoryDto.class, "Category.findAllOfExtSeries", offset, limit, id(seriesExtId.get()));
      List<Category> seriesExtIdCategories =  categoryDtos.stream()
              .map(CategoryDto::toCategory)
              .collect(Collectors.toList());

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
  public boolean deleteCategory(Category category) throws ExtendedAnnotationException {
    boolean result = true;
    // If the category is a series category, delete all corresponding series category
    if (category.getSeriesCategoryId().isSome()) {
      List<CategoryDto> categoryDtos = findAllWithOffsetAndLimit(CategoryDto.class, "Category.findAllOfSeriesCategory", none(), none(), id(category.getSeriesCategoryId().get()));
      List<Category> withSeriesCategoryId = categoryDtos.stream()
              .map(CategoryDto::toCategory)
              .collect(Collectors.toList());
      for (Category categoryBelongingToMaster: withSeriesCategoryId) {
        result = deleteCategoryImpl(categoryBelongingToMaster);
        if (!result) { break; }
      }
    // Delete the category
    } else {
      result = deleteCategoryImpl(category);
    }

    return result;
  }

  public boolean deleteCategoryImpl(Category category) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(category);
    final Category updated = new CategoryImpl(category.getId(), category.getSeriesExtId(),
            category.getSeriesCategoryId(), category.getVideoId(), category.getScaleId(), category.getName(),
            category.getDescription(), category.getSettings(), deleteResource);
    updateCategory(updated);

    for (Label l : getLabelsByCategoryId(category.getId())) {
      deleteLabel(l);
    }

    return true;
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
        return tx(namedQuery.persist(dto)).toLabel();
      }
    }

    // Normal Create
    final LabelDto dto = LabelDto.create(none(), categoryId, value, abbreviation, description, settings, resource);
    return tx(namedQuery.persist(dto)).toLabel();
  }

  @Override
  public void updateLabel(final Label l) throws ExtendedAnnotationException {
    long updateLabelId = l.getId();

    // If the label belongs to a category copy of a series category, update the label on the series category instead
    if (l.getSeriesLabelId().isSome()) {
      updateLabelId = l.getSeriesLabelId().get();
    }

    update("Label.findById", updateLabelId, new Effect<LabelDto>() {
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

    if (since.isSome()) {
      List<LabelDto> labelDtos = findAllWithOffsetAndLimit(LabelDto.class, "Label.findAllOfCategorySince", offset, limit,
              Pair.of("since", since.get()));
      labels = labelDtos.stream().map(LabelDto::toLabel).collect(Collectors.toList());
    }
    else {
      List<LabelDto> labelDtos = findAllWithOffsetAndLimit(LabelDto.class, "Label.findAllOfCategory", offset, limit,
              Pair.of("id", categoryId));
      labels = labelDtos.stream().map(LabelDto::toLabel).collect(Collectors.toList());
    }

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
          newLabels.add(tx(namedQuery.persist(dto)).toLabel());
        }

        // Return series labels, so that they are updated in the backend
        // At some point you probably want to associated copied labels with their original, so they can be properly updated
        // This will lose changes made on non-master category labels if the master then looses their series.
        // But that is quite a rare scenario (hopefully) and I'm running out of time.
        //labels = newLabels;
        labels = newLabels;
      }
    }

    if (tagsAnd.isSome())
      labels = filterAndTags(labels, tagsAnd.get());

    if (tagsOr.isSome())
      labels = filterOrTags(labels, tagsOr.get());

    return labels;
  }

  private List<Label> getLabelsByCategoryId(final long categoryId) throws ExtendedAnnotationException {
    List<LabelDto> labelDtos = findAllWithOffsetAndLimit(LabelDto.class, "Label.findAllOfCategory", some(0), some(0),
            id(categoryId));
    return labelDtos.stream()
            .map(LabelDto::toLabel)
            .collect(Collectors.toList());
  }

  @Override
  public boolean deleteLabel(Label label) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(label);
    final Label updated = new LabelImpl(label.getId(), none(), label.getCategoryId(), label.getValue(),
            label.getAbbreviation(), label.getDescription(), label.getSettings(), deleteResource);
    updateLabel(updated);
    return true;
  }

  @Override
  public Comment createComment(long annotationId, Option<Long> replyToId, String text, Resource resource) {
    final CommentDto dto = CommentDto.create(annotationId, text, replyToId, resource);
    return tx(namedQuery.persist(dto)).toComment();
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
    List<CommentDto> commentDtos = new ArrayList<>();

    if (replyToId.isSome()) {
      if (since.isSome()) {
        commentDtos = findAllWithOffsetAndLimit(CommentDto.class, "Comment.findAllRepliesSince", offset, limit,
                Pair.of("since", since.get()), Pair.of("id", replyToId.get()));
      }
      else {
        commentDtos = findAllWithOffsetAndLimit(CommentDto.class, "Comment.findAllReplies", offset, limit,
                Pair.of("id", replyToId.get()));
      }
    } else {
      if (since.isSome()) {
        commentDtos = findAllWithOffsetAndLimit(CommentDto.class, "Comment.findAllOfAnnotationSince", offset, limit,
                Pair.of("since", since.get()), Pair.of("id", annotationId));
      }
      else {
        commentDtos = findAllWithOffsetAndLimit(CommentDto.class, "Comment.findAllOfAnnotation", offset, limit,
                Pair.of("id", annotationId));
      }
    }

    comments = commentDtos.stream().map(CommentDto::toComment).collect(Collectors.toList());

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

  private static final ExtendedAnnotationException notFound = new ExtendedAnnotationException(Cause.NOT_FOUND);

  /**
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private <A, B> Option<A> findById(final Function<B, A> toA, final String queryName, final Object id) {
    Optional<B> lol = (Optional<B>) tx(em -> {
      return namedQuery.findOpt(queryName, Pair.of("id", id)).apply(em);
    });
    if (lol.isPresent()) {
      A lel = toA.apply(lol.get());
      return some(lel);
    } else {
      return none();
    }
  }

  /**
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private <A> Option<A> findById(final String queryName, final Object id) {
    try {
      Optional<A> lol = (Optional<A>) tx(namedQuery.findOpt(queryName, Pair.of("id", id)));
      if (lol.isPresent()) {
        return some(lol.get());
      } else {
        return none();
      }
    } catch (NoResultException | NonUniqueResultException e) {
      return none();
    }
  }

  private Option<VideoDto> getVideoDto(final long id) {
    return findById("Video.findById", id);
  }

  private Option<TrackDto> getTrackDto(final long id) {
    return findById("Track.findById", id);
  }

  /** Create an "id" parameter pair. */
  public static <A> Pair<String, A> id(A id) {
    return Pair.of("id", id);
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

  private boolean hasCategoryAccess(Annotation annotation) {
    return annotation.getLabelId().bind(new Function<Long, Option<Label>>() {
      @Override
      public Option<Label> apply(Long labelId) {
        boolean includeDeletedLabels = true;
        return getLabel(labelId, includeDeletedLabels);
      }
    }).bind(new Function<Label, Option<Category>>() {
      @Override
      public Option<Category> apply(Label label) {
        boolean includeDeletedCategories = true;
        return getCategory(label.getCategoryId(), includeDeletedCategories);
      }
    // TODO It would be nice if we could use the second overload of `fold` here
    // TODO Create a helper function to create `Match` objects that enables type inference ...
    }).fold(new Match<Category, Boolean>() {
      // annotations without category are always accessible
      @Override
      public Boolean none() {
        return true;
      }
      @Override
      public Boolean some(Category category) {
        return hasResourceAccess(category);
      }
    });
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
   * Custom function for findAll functionality with offset and limit
   * Would be nice if this could be replaced with something like `namedQuery.findAll`, but I couldn't
   * figure out how to make offset and limit work with that
   * @param type Dto class
   * @param q query
   * @param offset index of the first result
   * @param limit max amounts of results
   * @param params arbitrary params
   * @param <T> Dto class
   * @return
   */
  private <T> List<T> findAllWithOffsetAndLimit(Class<T> type, String q, Option<Integer> offset,
          Option<Integer> limit, Pair<String, Object>... params) {
    List<T> result = tx(em -> {
      TypedQuery<T> partial = em.createNamedQuery(q, type); //.setParameter("since", since);
      for (Pair<String, Object> param : params) {
        partial.setParameter(param.getLeft(), param.getRight());
      }
      if (limit.isSome()) {
        partial.setMaxResults(limit.get());
      }
      if (offset.isSome()) {
        partial.setFirstResult(offset.get());
      }
      return partial.getResultList();
    });

    return result;
  }

  @SuppressWarnings("SameParameterValue")
  private static <A, B> Function<B, Pair<A, B>> pairB(final A a) {
    return new Function<B, Pair<A, B>>() {
      @Override
      public Pair<A, B> apply(final B b) {
        return Pair.of(a, b);
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
