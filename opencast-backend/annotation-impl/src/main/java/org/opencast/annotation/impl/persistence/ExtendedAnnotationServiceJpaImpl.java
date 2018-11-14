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

import static org.opencastproject.util.data.Monadics.mlist;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.Option.some;
import static org.opencastproject.util.data.Tuple.tuple;
import static org.opencastproject.util.persistence.Queries.named;

import org.opencast.annotation.impl.videointerface.VideoInterfaceProvider;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.VideoInterfaceProviderException;
import org.opencastproject.security.api.SecurityConstants;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.util.data.Effect;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.Option.Match;
import org.opencastproject.util.data.Predicate;
import org.opencastproject.util.data.Tuple;
import org.opencastproject.util.data.functions.Functions;
import org.opencastproject.util.data.functions.Options;
import org.opencastproject.util.data.functions.Tuples;
import org.opencastproject.util.persistence.PersistenceEnv;
import org.opencastproject.util.persistence.Queries;

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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.persistence.RollbackException;

/**
 * JPA-based implementation of the {@link ExtendedAnnotationService}.
 */
public final class ExtendedAnnotationServiceJpaImpl implements ExtendedAnnotationService {
  /** The logger */
  private static final Logger logger = LoggerFactory.getLogger(ExtendedAnnotationServiceJpaImpl.class);

  private final PersistenceEnv penv;
  private final SecurityService securityService;
  private VideoInterfaceProvider videoInterfaceProvider;

  public ExtendedAnnotationServiceJpaImpl(PersistenceEnv penv, SecurityService securityService, VideoInterfaceProvider videoInterfaceProvider) {
    this.penv = penv;
    this.securityService = securityService;
    this.videoInterfaceProvider = videoInterfaceProvider;
  }

  /**
   * Run <code>f</code> inside a transaction with exception handling applied.
   *
   * @see #exhandler
   */
  private <A> A tx(Function<EntityManager, A> f) {
    return penv.<A> tx().rethrow(exhandler).apply(f);
  }

  private int getTotal() {
    return tx(named.count("User.cont")).intValue();
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
    // return deleteById("User.deleteById", u.getId());
    return true;
  }

  @Override
  public boolean clearDatabase() throws ExtendedAnnotationException {
    return tx(new Function<EntityManager, Boolean>() {
      @SuppressWarnings("unchecked")
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
    final Tuple<String, Object>[] qparams = qparams(since.map(Tuples.<String, Object> tupleB("since")));
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

    List<Track> tracks = getTracks(video.getId(), none(0), none(0), none(Date.class),
            Option.<Map<String, String>> none(), Option.<Map<String, String>> none());
    for (Track track : tracks) {
      deleteTrack(track);
    }

    List<Category> categories = getCategories(some(video.getId()), none(0), none(0), none(Date.class),
            Option.<Map<String, String>> none(), Option.<Map<String, String>> none());
    for (Category category : categories) {
      deleteCategory(category);
    }

    List<Scale> scales = getScales(some(video.getId()), none(0), none(0), none(Date.class),
            Option.<Map<String, String>> none(), Option.<Map<String, String>> none());
    for (Scale scale : scales) {
      deleteScale(scale);
    }
    // return deleteById("Video.deleteById", video.getId());
    return true;
  }

  @Override
  public Option<Video> getVideo(final long id) throws ExtendedAnnotationException {
    return getVideoDto(id).map(toVideo);
  }

  @Override
  public List<Video> getVideos() throws ExtendedAnnotationException {
    return findAllWithoutParams(toVideo, "Video.findAll");
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

    List<Annotation> annotations = getAnnotations(t.getId(), none(Double.class), none(Double.class), none(0), none(0),
            none(Date.class), Option.<Map<String, String>> none(), Option.<Map<String, String>> none());
    for (Annotation a : annotations) {
      deleteAnnotation(a);
    }
    // return deleteById("Track.deleteById", track.getId());
    return true;
  }

  @Override
  public Option<Track> getTrack(final long trackId) throws ExtendedAnnotationException {
    return findById(toTrack, "Track.findById", trackId);
  }

  /** Remove all none values from the list of query parameters. */
  @SuppressWarnings("unchecked")
  public static Tuple<String, Object>[] qparams(Option<Tuple<String, Object>>... p) {
    return mlist(p).bind(Functions.<Option<Tuple<String, Object>>> identity()).value().toArray(new Tuple[0]);
  }

  @Override
  public List<Track> getTracks(final long videoId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {

    final Tuple<String, Object>[] qparams = qparams(some(ExtendedAnnotationServiceJpaImpl.<Object> id(videoId)),
            since.map(Tuples.<String, Object> tupleB("since")));

    final String q = since.isSome() ? "Track.findAllOfVideoSince" : "Track.findAllOfVideo";

    List<Track> tracks = findAllWithParams(toTrack, offset, limit, q, videoId, qparams);

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
        dto.update(a.getText(), a.getStart(), a.getDuration(), a.getSettings(), a);
      }
    });
  }

  /** Generic update method. */
  private <A> void update(String q, long id, Effect<A> update) {
    tx(Options.<EntityManager, A> foreach(named.<A> findSingle(q, id(id)), update)).orError(throwNotFound);
  }

  @Override
  public boolean deleteAnnotation(Annotation a) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(a);
    final Annotation updated = new AnnotationImpl(a.getId(), a.getTrackId(), a.getText(), a.getStart(),
            a.getDuration(), a.getSettings(), a.getLabelId(), a.getScaleValueId(), deleteResource);
    updateAnnotation(updated);
    // return deleteById("Annotation.deleteById", annotation.getId());
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
      annotations = findAllWithParams(toAnnotation, offset, limit, "Annotation.findAllOfTrackStartEnd", trackId,
              tuple("start", start.get()), tuple("end", end.get()));
    } else if (start.isSome()) {
      annotations = findAllWithParams(toAnnotation, offset, limit, "Annotation.findAllOfTrackStart", trackId,
              tuple("start", start.get()));
    } else if (end.isSome()) {
      annotations = findAllWithParams(toAnnotation, offset, limit, "Annotation.findAllOfTrackEnd", trackId,
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
    // return since.fold(new Option.Match<Date, List<Annotation>>() {
    // @Override
    // public List<Annotation> some(final Date since) {
    // return penv.tx(new Function<EntityManager, List<Annotation>>() {
    // @Override
    // public List<Annotation> apply(EntityManager em) {
    // return findAll(em, toAnnotation, offset, limit, "Annotation.findAllOfTrackSince", id(trackId),
    // tuple("since", since));
    // }
    // });
    // }
    //
    // @Override
    // public List<Annotation> none() {
    // return findAllById(toAnnotation, offset, limit, "Annotation.findAllOfTrack", trackId);
    // }
    // });
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
    // return since.fold(new Option.Match<Date, List<Scale>>() {
    // @Override
    // public List<Scale> some(final Date since) {
    // return penv.tx(new Function<EntityManager, List<Scale>>() {
    // @Override
    // public List<Scale> apply(EntityManager em) {
    // return findAll(em, toScale, offset, limit, "Scale.findAllOfVideoSince", id(videoId), tuple("since", since));
    // }
    // });
    // }
    //
    // @Override
    // public List<Scale> none() {
    // return findAllById(toScale, offset, limit, "Scale.findAllOfVideo", videoId);
    // }
    // });
  }

  public List<ScaleValue> getScaleValuesByScaleId(final long scaleId) throws ExtendedAnnotationException {
    return findAllById(toScaleValue, some(0), some(0), "ScaleValue.findAllOfScale", scaleId);
  }

  @Override
  public List<ScaleValue> getScaleValues(final long scaleId, final Option<Integer> offset, final Option<Integer> limit,
          Option<Date> since, final Option<Map<String, String>> tagsAnd, final Option<Map<String, String>> tagsOr)
          throws ExtendedAnnotationException {
    final Tuple<String, Object>[] qparams = qparams(some(ExtendedAnnotationServiceJpaImpl.<Object> id(scaleId)),
            since.map(Tuples.<String, Object> tupleB("since")));
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
    // return deleteById("Video.deleteById", video.getId());
    return true;
  }

  @Override
  public ScaleValue createScaleValue(long scaleId, String name, double value, int order, Resource resource)
          throws ExtendedAnnotationException {
    final ScaleValueDto dto = ScaleValueDto.create(scaleId, name, value, order, resource);

    return (ScaleValue) tx(Queries.persist(dto)).toScaleValue();
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
    // return deleteById("Video.deleteById", video.getId());
    return true;
  }

  @Override
  public Category createCategory(Option<Long> videoId, Option<Long> scaleId, String name, Option<String> description,
          Option<String> settings, Resource resource) throws ExtendedAnnotationException {
    final CategoryDto dto = CategoryDto.create(videoId, scaleId, name, description, settings, resource);

    return tx(Queries.persist(dto)).toCategory();
  }

  @Override
  public Option<Category> createCategoryFromTemplate(final long videoId, final long templateCategoryId,
          final Resource resource) throws ExtendedAnnotationException {
    return getCategory(templateCategoryId, false).fold(new Option.Match<Category, Option<Category>>() {
      @Override
      public Option<Category> some(Category c) {
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
        final CategoryDto copyDto = CategoryDto.create(Option.some(videoId), option(scaleId), c.getName(),
                c.getDescription(), c.getSettings(), resource);
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
        return Option.some(category);
      }

      @Override
      public Option<Category> none() {
        return Option.none(Category.class);
      }
    });
  }

  @Override
  public void updateCategory(final Category c) throws ExtendedAnnotationException {
    update("Category.findById", c.getId(), new Effect<CategoryDto>() {
      @Override
      public void run(CategoryDto dto) {
        dto.update(c.getName(), c.getDescription(), c.getScaleId(), c.getSettings(), c);
      }
    });
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
  public List<Category> getCategories(final Option<Long> videoId, final Option<Integer> offset,
          final Option<Integer> limit, Option<Date> since, final Option<Map<String, String>> tagsAnd,
          final Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException {
    List<Category> categories = videoId.fold(new Option.Match<Long, List<Category>>() {
      @Override
      public List<Category> some(Long id) {
        return findAllById(toCategory, offset, limit, "Category.findAllOfVideo", id);
      }

      @Override
      public List<Category> none() {
        return (List<Category>) tx(new Function<EntityManager, Object>() {
          @Override
          public Object apply(EntityManager em) {
            Query query = Queries.named.query(em, "Category.findAllOfTemplate", CategoryDto.class);
            for (Integer l : limit)
              query.setMaxResults(l);
            for (Integer o : offset)
              query.setFirstResult(o);
            return mlist(query.getResultList()).map(toCategory).value();
          }
        });
      }
    });

    if (tagsAnd.isSome())
      categories = filterAndTags(categories, tagsAnd.get());

    if (tagsOr.isSome())
      categories = filterOrTags(categories, tagsOr.get());

    return categories;
    // return since.fold(new Option.Match<Date, List<Category>>() {
    // @Override
    // public List<Category> some(final Date since) {
    // return penv.tx(new Function<EntityManager, List<Category>>() {
    // @Override
    // public List<Category> apply(EntityManager em) {
    // return findAll(em, toCategory, offset, limit, "Category.findAllOfVideoSince", id(videoId),
    // tuple("since", since));
    // }
    // });
    // }
    //
    // @Override
    // public List<Category> none() {
    // return findAllById(toCategory, offset, limit, "Category.findAllOfVideo", videoId);
    // }
    // });
  }

  @Override
  public boolean deleteCategory(Category category) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(category);
    final Category updated = new CategoryImpl(category.getId(), category.getVideoId(), category.getScaleId(),
            category.getName(), category.getDescription(), category.getSettings(), deleteResource);
    updateCategory(updated);

    for (Label l : getLabelsByCategoryId(category.getId())) {
      deleteLabel(l);
    }
    return true;
  }

  @Override
  public Label createLabel(long categoryId, String value, String abbreviation, Option<String> description,
          Option<String> settings, Resource resource) throws ExtendedAnnotationException {
    final LabelDto dto = LabelDto.create(categoryId, value, abbreviation, description, settings, resource);
    return tx(Queries.persist(dto)).toLabel();
  }

  @Override
  public void updateLabel(final Label l) throws ExtendedAnnotationException {
    update("Label.findById", l.getId(), new Effect<LabelDto>() {
      @Override
      protected void run(LabelDto dto) {
        dto.update(l.getValue(), l.getAbbreviation(), l.getDescription(), l.getSettings(), l);
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

    List<Label> labels = null;

    if (since.isSome())
      labels = findAllWithParams(toLabel, offset, limit, "Label.findAllOfCategorySince", categoryId,
              tuple("since", since.get()));
    else
      labels = findAllWithParams(toLabel, offset, limit, "Label.findAllOfCategory", categoryId, tuple("id", categoryId));

    if (tagsAnd.isSome())
      labels = filterAndTags(labels, tagsAnd.get());

    if (tagsOr.isSome())
      labels = filterOrTags(labels, tagsOr.get());

    return labels;
  }

  public List<Label> getLabelsByCategoryId(final long categoryId) throws ExtendedAnnotationException {
    return findAllById(toLabel, some(0), some(0), "Label.findAllOfCategory", categoryId);
  }

  @Override
  public boolean deleteLabel(Label label) throws ExtendedAnnotationException {
    Resource deleteResource = deleteResource(label);
    final Label updated = new LabelImpl(label.getId(), label.getCategoryId(), label.getValue(),
            label.getAbbreviation(), label.getDescription(), label.getSettings(), deleteResource);
    updateLabel(updated);
    // return deleteById("Video.deleteById", video.getId());
    return true;
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

    List<Comment> comments = null;

    if (replyToId.isSome()) {
      if (since.isSome())
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllRepliesSince", annotationId,
                tuple("since", since.get()), tuple("id", replyToId.get()));
      else
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllReplies", annotationId,
                tuple("id", replyToId.get()));
    } else {
      if (since.isSome())
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllOfAnnotationSince", annotationId,
                tuple("since", since.get()), tuple("id", annotationId));
      else
        comments = findAllWithParams(toComment, offset, limit, "Comment.findAllOfAnnotation", annotationId,
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
    final Comment updated = new CommentImpl(comment.getId(), comment.getAnnotationId(), comment.getText(),
            none(Long.class), deleteResource);
    updateComment(updated);
    // return deleteById("Comment.deleteById", comment.getId());
    return true;
  }

  // --

  /** Transform any exception from the JPA persistence layer into an API exception. */
  public static final Function<Exception, ExtendedAnnotationException> exhandler = new Function<Exception, ExtendedAnnotationException>() {
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

  public static final Function0<ExtendedAnnotationException> throwNotFound = new Function0<ExtendedAnnotationException>() {
    @Override
    public ExtendedAnnotationException apply() {
      return notFound;
    }
  };

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
    return tx(named.<A> findSingle(queryName, id(id)));
  }

  private <A, B> List<A> findAllWithoutParams(final Function<B, A> toA, final String queryName) {
    return tx(named.<B> findAllM(queryName)).map(toA).value();
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

  private <A, B> List<A> findAllWithParams(final Function<B, A> toA, final Option<Integer> offset,
          final Option<Integer> limit, final String queryName, final Object id, final Tuple<String, ?>... params) {
    return tx(named.<B> findAllM(queryName, offset, limit, params)).map(toA).value();
  }

  /**
   * Do not nest inside a tx!
   *
   * @param id
   *          value of the ":id" parameter in the named query.
   */
  private boolean deleteById(final String queryName, final Object id) {
    return tx(named.update(queryName, id(id)));
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
    return createResource(Option.<Map<String, String>> none());
  }

  @Override
  public Resource createResource(final Option<Map<String, String>> tags) {
    return createResource(tags, none(Integer.class));
  }

  @Override
  public Resource createResource(final Option<Map<String, String>> tags, final Option<Integer> access) {
    final Option<Long> userId = getCurrentUserId();
    final Option<Date> now = some(new Date());
    Map<String, String> tagsMap;
    if (tags.isSome())
      tagsMap = tags.get();
    else
      tagsMap = new HashMap<>();
    return new ResourceImpl(access.orElse(some(Resource.PRIVATE)), userId, userId, none(0L), now, now, none(Date.class),
            tagsMap);
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
  public User getOrCreateCurrentUser() {
    return getOrCreateUser(securityService.getUser());
  }

  private User getOrCreateUser(org.opencastproject.security.api.User user) {
    return getUserByExtId(user.getUsername()).getOrElse(new Function0<User>() {
      @Override
      public User apply() {
        return createUser(user.getUsername(), user.getUsername(), Option.some(user.getEmail()), createResource());
      }
    });
  }

  @Override
  public boolean hasResourceAccess(Resource resource) {
    org.opencastproject.security.api.User opencastUser = securityService.getUser();
    Option<Long> currentUserId = getUserId(opencastUser);

    return resource.getAccess() == Resource.PUBLIC
        || resource.getCreatedBy().equals(currentUserId)
        || resource.getAccess() == Resource.SHARED_WITH_ADMIN && isAnnotateAdmin(opencastUser, getResourceVideo(resource));
  }

  private boolean isAnnotateAdmin(org.opencastproject.security.api.User user, Option<Video> video) {
    if (user.hasRole(securityService.getOrganization().getAdminRole())
            || user.hasRole(SecurityConstants.GLOBAL_ADMIN_ROLE)) {
      return true;
    }

    return video.fold(new Match<Video, Boolean>() {
      @Override
      public Boolean some(Video video) {
        try {
          return videoInterfaceProvider.getVideoInterface(video.getExtId()).getAccess() == Access.ADMIN;
        } catch (VideoInterfaceProviderException e) {
          return false;
        }
      }
      @Override
      public Boolean none() {
        return false;
      }
    });
  }

  @Override
  public VideoInterface getVideoInterface(String mediaPackageId) throws VideoInterfaceProviderException {
    return videoInterfaceProvider.getVideoInterface(mediaPackageId);
  }

  private Option<Video> getResourceVideo(Resource resource) {
    return resource.getVideo(this).bind(new Function<Long, Option<Video>>() {
      @Override
      public Option<Video> apply(Long videoId) {
        return getVideo(videoId);
      }
    });
  }

  public final Function<Resource, Boolean> hasResourceAccess = new Function<Resource, Boolean>() {
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

    List<T> list = new ArrayList<T>();

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
}
