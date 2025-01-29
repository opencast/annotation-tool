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

import org.opencastproject.db.DBSession;
import org.opencastproject.db.DBSessionFactory;
import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.search.api.SearchService;
import org.opencastproject.security.api.AuthorizationService;
import org.opencastproject.security.api.SecurityConstants;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.UnauthorizedException;
import org.opencastproject.util.NotFoundException;
import org.opencastproject.util.data.Effect;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.Option.Match;
import org.opencastproject.util.data.Predicate;

import org.apache.commons.lang3.tuple.Pair;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.NoResultException;
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
    } catch (NoResultException e) {
      throw new ExtendedAnnotationException(Cause.NOT_FOUND);
    } catch (RollbackException e) {
      Throwable cause = e.getCause();
      String message = cause.getMessage().toLowerCase();
      if (message.contains("unique") || message.contains("duplicate")) {
        throw new ExtendedAnnotationException(Cause.DUPLICATE);
      }
      throw new ExtendedAnnotationException(Cause.SERVER_ERROR, e);
    } catch (RuntimeException e) {
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
    update(UserDto.class, "User.findById", u.getId(), new Effect<>() {
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
    return findById(toUser, "User.findById", id, UserDto.class);
  }

  @Override
  public Option<User> getUserByExtId(final String id) {
    return findById(toUser, "User.findByUserId", id, UserDto.class);
  }

  @Override
  public Video createVideo(String extId, Resource resource) throws ExtendedAnnotationException {
    final VideoDto dto = VideoDto.create(extId, resource);
    return tx(namedQuery.persist(dto)).toVideo();
  }

  @Override
  public void updateVideo(final Video v) throws ExtendedAnnotationException {
    update(VideoDto.class, "Video.findById", v.getId(), new Effect<>() {
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

    getTracks(video.getId()).forEach(this::deleteTrack);

    getCategories(none(), video.getId()).forEach(this::deleteCategory);

    getScales(video.getId()).forEach(this::deleteScale);
    return true;
  }

  @Override
  public Option<Video> getVideo(final long id) throws ExtendedAnnotationException {
    return findById(toVideo, "Video.findById", id, VideoDto.class);
  }

  @Override
  public Option<Video> getVideoByExtId(final String id) throws ExtendedAnnotationException {
    return findById(toVideo, "Video.findByExtId", id, VideoDto.class);
  }

  @Override
  public Track createTrack(final long videoId, final String name, final Option<String> description,
          final Option<String> settings, final Resource resource) throws ExtendedAnnotationException {
    if (getVideo(videoId).isSome()) {
      final TrackDto dto = TrackDto.create(videoId, name, description, settings, resource);
      return tx(namedQuery.persist(dto)).toTrack();
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

    getAnnotations(t.getId()).forEach(this::deleteAnnotation);
    return true;
  }

  @Override
  public Option<Track> getTrack(final long trackId) throws ExtendedAnnotationException {
    return findById(toTrack, "Track.findById", trackId, TrackDto.class);
  }

  @Override
  public Stream<Track> getTracks(final long videoId)
          throws ExtendedAnnotationException {
    return findAll(TrackDto.class, "Track.findAllOfVideo", id(videoId)).stream()
        .map(TrackDto::toTrack)
        .filter(this::hasResourceAccess);
  }

  @Override
  public void updateTrack(final Track track) throws ExtendedAnnotationException {
    update(TrackDto.class, "Track.findById", track.getId(), new Effect<>() {
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
      return tx(namedQuery.persist(dto)).toAnnotation();
    } else {
      throw notFound;
    }
  }

  @Override
  public Annotation createAnnotation(final Annotation annotation) throws ExtendedAnnotationException {
    if (getTrack(annotation.getTrackId()).isSome()) {
      return tx(namedQuery.persist(AnnotationDto.fromAnnotation(annotation))).toAnnotation();
    } else {
      throw notFound;
    }
  }

  @Override
  public void updateAnnotation(final Annotation a) throws ExtendedAnnotationException {
    update(AnnotationDto.class, "Annotation.findById", a.getId(), new Effect<>() {
      @Override
      protected void run(AnnotationDto dto) {
        dto.update(a.getStart(), a.getDuration(), a.getContent(), a.getCreatedFromQuestionnaire(), a.getSettings(), a);
      }
    });
  }

  /** Generic update method. */
  private <A> void update(Class<A> type, String q, long id, Effect<A> update) {
    tx(em -> {
      A o = namedQuery.find(q, type, id(id)).apply(em);

      update.apply(o);
      return o;
    });
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
    return findById(toAnnotation, "Annotation.findById", id, AnnotationDto.class);
  }

  @Override
  public Stream<Annotation> getAnnotations(final long trackId)
          throws ExtendedAnnotationException {

    return findAll(AnnotationDto.class, "Annotation.findAllOfTrack", id(trackId))
            .stream()
            .map(AnnotationDto::toAnnotation)
            .filter(this::hasCategoryAccess);
  }

  @Override
  public Scale createScale(long videoId, String name, Option<String> description, Resource resource)
          throws ExtendedAnnotationException {
    if (getVideo(videoId).isSome()) {
      final ScaleDto dto = ScaleDto.create(videoId, name, description, resource);
      return tx(namedQuery.persist(dto)).toScale();
    } else {
      throw notFound;
    }
  }

  @Override
  public Option<Scale> getScale(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    final Option<Scale> scale;
    if (includeDeleted) {
      scale = findById(toScale, "Scale.findByIdIncludeDeleted", id, ScaleDto.class);
    } else {
      scale = findById(toScale, "Scale.findById", id, ScaleDto.class);
    }
    return scale;
  }

  @Override
  public Stream<Scale> getScales(long videoId)
          throws ExtendedAnnotationException {
    return findAll(ScaleDto.class, "Scale.findAllOfVideo", id(videoId)).stream()
        .map(ScaleDto::toScale);
  }

  private List<ScaleValue> getScaleValuesByScaleId(final long scaleId) throws ExtendedAnnotationException {
    List<ScaleValueDto> scaleValueDtos = findAll(ScaleValueDto.class, "ScaleValue.findAllOfScale", id(scaleId));
    return scaleValueDtos.stream()
            .map(ScaleValueDto::toScaleValue)
            .collect(Collectors.toList());
  }

  @Override
  public Stream<ScaleValue> getScaleValues(final long scaleId)
          throws ExtendedAnnotationException {
    return findAll(ScaleValueDto.class, "ScaleValue.findAllOfScale", id(scaleId))
            .stream()
            .map(ScaleValueDto::toScaleValue);
  }

  @Override
  public void updateScale(final Scale s) throws ExtendedAnnotationException {
    update(ScaleDto.class, "Scale.findByIdIncludeDeleted", s.getId(), new Effect<>() {
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

    return tx(namedQuery.persist(dto)).toScaleValue();
  }

  @Override
  public Option<ScaleValue> getScaleValue(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    if (includeDeleted) {
      return findById(toScaleValue, "ScaleValue.findByIdIncludeDeleted", id, ScaleValueDto.class);
    } else {
      return findById(toScaleValue, "ScaleValue.findById", id, ScaleValueDto.class);
    }
  }

  @Override
  public void updateScaleValue(final ScaleValue s) throws ExtendedAnnotationException {
    update(ScaleValueDto.class, "ScaleValue.findByIdIncludeDeleted", s.getId(), new Effect<>() {
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
  public Category createCategory(Option<String> seriesExtId, Option<Long> seriesCategoryId, long videoId,
          Option<Long> scaleId, String name, Option<String> description, Option<String> settings, Resource resource)
          throws ExtendedAnnotationException {
    if (getVideo(videoId).isSome()) {
      final CategoryDto dto = CategoryDto.create(seriesExtId, seriesCategoryId, videoId, scaleId, name, description,
          settings, resource);
      return tx(namedQuery.persist(dto)).toCategory();
    } else {
      throw notFound;
    }
  }

  @Override
  public void updateCategory(final Category c) throws ExtendedAnnotationException {
    update(CategoryDto.class, "Category.findByIdIncludeDeleted", c.getId(), new Effect<>() {
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
    Option<Category> pastC = findById(toCategory, "Category.findById", c.getId(), CategoryDto.class);

    // Get all categories on all videos belonging to the seriesCategoryId (including the master)
    if (pastC.isSome() && pastC.get().getSeriesCategoryId().isSome()) {
      List<CategoryDto> categoryDtos = findAll(CategoryDto.class, "Category.findAllOfSeriesCategory",
          id(pastC.get().getSeriesCategoryId().get()));
      List<Category> categoryAndClones = categoryDtos.stream()
              .map(CategoryDto::toCategory)
              .collect(Collectors.toList());

      // Delete all but the master category (which is the "c" passed to this function)
      // Update the master category with the videoId to move it to this video
      for (Category categoryAndClone : categoryAndClones) {
        long a = categoryAndClone.getId();
        long b = c.getId();
        if (a != b) {
          deleteCategoryImpl(categoryAndClone);
        }
      }
    }
    updateCategory(c);
  }

  @Override
  public Option<Category> getCategory(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    Option<Category> category;
    if (includeDeleted) {
      category = findById(toCategory, "Category.findByIdIncludeDeleted", id, CategoryDto.class);
    } else {
      category = findById(toCategory, "Category.findById", id, CategoryDto.class);
    }
    return category;
  }

  @Override
  public Stream<Category> getCategories(final Option<String> seriesExtId, final long videoId)
          throws ExtendedAnnotationException {
    List<Category> categories = findAll(CategoryDto.class, "Category.findAllOfVideo", id(videoId))
        .stream()
        .map(CategoryDto::toCategory)
        .filter(this::hasResourceAccess)
        .collect(Collectors.toList());

    if (seriesExtId.isSome()) {
      // Make categories editable
      List<Category> allCategories = new ArrayList<>(categories);

      List<Category> createdCategories = new ArrayList<>();
      // Grab the categories with seriesExtId.
      List<CategoryDto> categoryDtos = findAll(CategoryDto.class, "Category.findAllOfExtSeries", id(seriesExtId.get()));

      // Grab all master series categories by removing every category that is not referencing itself
      List<Category> seriesCategories = categoryDtos.stream()
              .map(CategoryDto::toCategory)
              .filter(category -> Option.some(category.getId()).equals(category.getSeriesCategoryId()))
              .collect(Collectors.toList());

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

    return categories.stream();
  }

  private boolean categoriesSufficientlyEqual(Category a, Category b) {
    return a.getName().equals(b.getName()) && a.getDescription().equals(b.getDescription())
            && a.getSettings().equals(b.getSettings()) && a.getTags().equals(b.getTags());
  }

  @Override
  public Category deleteCategory(Category category) throws ExtendedAnnotationException {
    Category result = null;

    // If the category is a series category, delete all corresponding series category
    if (category.getSeriesCategoryId().isSome()) {
      List<CategoryDto> categoryDtos = findAll(CategoryDto.class, "Category.findAllOfSeriesCategory",
          id(category.getSeriesCategoryId().get()));
      List<Category> withSeriesCategoryId = categoryDtos.stream()
              .map(CategoryDto::toCategory)
              .collect(Collectors.toList());
      for (Category categoryBelongingToMaster: withSeriesCategoryId) {
        result = deleteCategoryImpl(categoryBelongingToMaster);
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

    getLabelsByCategoryId(category.getId()).forEach(this::deleteLabel);
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

    update(LabelDto.class, "Label.findByIdIncludeDeleted", updateLabelId, new Effect<>() {
      @Override
      protected void run(LabelDto dto) {
        dto.update(l.getSeriesLabelId(), l.getValue(), l.getAbbreviation(), l.getDescription(), l.getSettings(), l);
      }
    });
  }

  @Override
  public Option<Label> getLabel(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    Option<Label> label;
    if (includeDeleted) {
      label = findById(toLabel, "Label.findByIdIncludeDeleted", id, LabelDto.class);
    } else {
      label = findById(toLabel, "Label.findById", id, LabelDto.class);
    }
    return label;
  }

  @Override
  public Stream<Label> getLabels(final long categoryId)
          throws ExtendedAnnotationException {

    List<Label> labels;
    List<Label> deletedLabels = new ArrayList<>();

    List<LabelDto> labelDtos = findAll(LabelDto.class, "Label.findAllOfCategory", id(categoryId));
    labels = labelDtos.stream().map(LabelDto::toLabel).collect(Collectors.toList());

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
        List<Label> seriesCategoryLabels = getLabels(seriesCategory.get().getId()).collect(Collectors.toList());

        // Update our labels with the labels from the master series category
        // Note: Maybe do an actual update instead of delete/create
        for (Label label: labels) {
          deletedLabels.add(deleteLabel(label));
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

        // @todo CC | Fix: 1) Series labels get infinitely duplicated on each HTTP request.
        // @todo CC | Fix: 2) Overriding labels (like old code did) prevented accessing potentially deleted labels, breaking annotations that use it (= full app error).
        // @todo CC | Fix: 3) Remove temporary workaround that simply merges old + new labels (just to get the app running until a fix is there)
        List<Label> merged = new ArrayList<>();
        merged.addAll(deletedLabels);
        merged.addAll(newLabels);

        labels = merged;
      }
    }

    return labels.stream();
  }

  private Stream<Label> getLabelsByCategoryId(final long categoryId) throws ExtendedAnnotationException {
    return findAll(LabelDto.class, "Label.findAllOfCategory", id(categoryId)).stream()
            .map(LabelDto::toLabel);
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
    return tx(namedQuery.persist(dto)).toComment();
  }

  @Override
  public Option<Comment> getComment(long id) {
    return findById(toComment, "Comment.findById", id, CommentDto.class);
  }

  @Override
  public Stream<Comment> getComments(final long annotationId, final Option<Long> replyToId) {
    List<CommentDto> comments;
    if (replyToId.isSome()) {
      comments = findAll(CommentDto.class, "Comment.findAllReplies", id(replyToId.get()));
    } else {
      comments = findAll(CommentDto.class, "Comment.findAllOfAnnotation", id(annotationId));
    }
    return comments.stream().map(CommentDto::toComment);
  }

  @Override
  public void updateComment(final Comment comment) {
    update(CommentDto.class, "Comment.findById", comment.getId(), new Effect<>() {
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
  public Questionnaire createQuestionnaire(long videoId, String title, String content, Option<String> settings, Resource resource)
          throws ExtendedAnnotationException {
    if (getVideo(videoId).isSome()) {
      final QuestionnaireDto dto = QuestionnaireDto.create(videoId, title, content, settings, resource);
      return tx(namedQuery.persist(dto)).toQuestionnaire();
    } else {
      throw notFound;
    }
  }

  @Override
  public Option<Questionnaire> getQuestionnaire(long id, boolean includeDeleted) throws ExtendedAnnotationException {
    if (includeDeleted) {
      return findById(toQuestionnaire, "Questionnaire.findByIdIncludeDeleted", id, QuestionnaireDto.class);
    } else {
      return findById(toQuestionnaire, "Questionnaire.findById", id, QuestionnaireDto.class);
    }
  }

  @Override
  public Stream<Questionnaire> getQuestionnaires(final long videoId)
          throws ExtendedAnnotationException {
    return findAll(QuestionnaireDto.class, "Questionnaire.findAllOfVideo", id(videoId)).stream()
            .map(QuestionnaireDto::toQuestionnaire)
            .filter(this::hasResourceAccess);
  }

  @Override
  public void updateQuestionnaire(final Questionnaire q) throws ExtendedAnnotationException {
    update(QuestionnaireDto.class, "Questionnaire.findByIdIncludeDeleted", q.getId(), new Effect<>() {
      @Override
      public void run(QuestionnaireDto dto) {
        dto.update(q.getVideoId(), q.getTitle(), q.getContent(), q.getSettings(), q);
      }
    });
  }

  @Override
  public Questionnaire deleteQuestionnaire(Questionnaire questionnaire) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(questionnaire);

    final Questionnaire updated = new QuestionnaireImpl(questionnaire.getId(), questionnaire.getVideoId(),
            questionnaire.getTitle(), questionnaire.getContent(), questionnaire.getSettings(), deleteResource);

    updateQuestionnaire(updated);

    return updated;
  }

  // --

  private static final ExtendedAnnotationException notFound = new ExtendedAnnotationException(Cause.NOT_FOUND);

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
    tagsMap = tags.getOrElse(new Function0<>() {
      @Override
      public Map<String, String> apply() {
        return new HashMap<>();
      }
    });
    return new ResourceImpl(access, userId, userId, none(), now, now, none(), tagsMap);
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
    return getUserByExtId(user.getUsername()).map(new Function<>() {
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

    return video.fold(new Match<>() {
      @Override
      public Boolean some(Video video) {
        for (MediaPackage mediaPackage : findMediaPackage(video.getExtId())) {
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
    try {
      return Option.some(searchService.get(id));
    } catch (NotFoundException | UnauthorizedException e) {
      return Option.none();
    }
  }

  @Override
  public boolean hasVideoAccess(MediaPackage mediaPackage, String access) {
    return isOpencastAdmin(securityService.getUser()) || authorizationService.hasPermission(mediaPackage, access);
  }

  private Option<Video> getResourceVideo(Resource resource) {
    return resource.getVideo(this).bind(new Function<>() {
      @Override
      public Option<Video> apply(Long videoId) {
        return getVideo(videoId);
      }
    });
  }

  private final Function<Resource, Boolean> hasResourceAccess = new Function<>() {
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

  private final Function<Annotation, Boolean> hasCategoryAccess = new Function<>() {
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
      return mlist(originalList).filter(new Predicate<>() {
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
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private <A, B> Option<A> findById(final Function<B, A> toA, final String queryName, final Object id, Class<B> type) {
    Optional<B> result = tx(em -> namedQuery.findOpt(queryName, type, id(id)).apply(em));
    if (result.isPresent()) {
      A appliedResult = toA.apply(result.get());
      return some(appliedResult);
    } else {
      return none();
    }
  }

  /**
   * Custom function for findAll functionality with offset and limit
   * Would be nice if this could be replaced with something like `namedQuery.findAll`, but I couldn't
   * figure out how to make offset and limit work with that
   *
   * @param <T>    Dto class
   * @param type   Dto class
   * @param q      query
   * @param params arbitrary params
   */
  @SafeVarargs
  private <T> List<T> findAll(Class<T> type, String q, Pair<String, Object>... params) {
    return tx(em -> {
      TypedQuery<T> partial = configureQuery(em.createNamedQuery(q, type), params);
      return partial.getResultList();
    });
  }

  @SafeVarargs
  private <T> TypedQuery<T> configureQuery(TypedQuery<T> q, Pair<String, Object>... params) {
    for (Pair<String, Object> pair : params) {
      String key = pair.getKey();
      Object value = pair.getValue();
      q.setParameter(key, value);
    }
    return q;
  }

  /** Create an "id" parameter pair. */
  private static <A> Pair<String, A> id(A id) {
    return Pair.of("id", id);
  }

  @SuppressWarnings("SameParameterValue")
  private static <A, B> Function<B, Pair<A, B>> pairB(final A a) {
    return new Function<>() {
      @Override
      public Pair<A, B> apply(final B b) {
        return Pair.of(a, b);
      }
    };
  }
}
