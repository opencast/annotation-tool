package org.opencast.annotation.endpoint;

import static org.opencast.annotation.api.ExtendedAnnotationService.ANNOTATE_ACTION;
import static org.opencast.annotation.api.ExtendedAnnotationService.ANNOTATE_ADMIN_ACTION;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.BAD_REQUEST;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.FORBIDDEN;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.LOCATION;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.NOT_FOUND;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.NO_CONTENT;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.UNAUTHORIZED;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.nil;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.parseDate;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.parseToJsonMap;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.run;
import static org.opencast.annotation.endpoint.util.Responses.buildOk;
import static org.opencastproject.util.UrlSupport.uri;
import static org.opencastproject.util.data.Arrays.array;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.Option.some;
import static org.opencastproject.util.data.functions.Strings.trimToNone;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationException;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.Track;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.impl.AnnotationImpl;
import org.opencast.annotation.impl.CommentImpl;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.TrackImpl;
import org.opencast.annotation.impl.persistence.AnnotationDto;
import org.opencast.annotation.impl.persistence.CategoryDto;
import org.opencast.annotation.impl.persistence.CommentDto;
import org.opencast.annotation.impl.persistence.ScaleDto;
import org.opencast.annotation.impl.persistence.TrackDto;
import org.opencast.annotation.impl.persistence.VideoDto;

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.functions.Functions;
import org.opencastproject.util.data.functions.Strings;

import java.net.URI;
import java.util.Date;
import java.util.Map;

import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class VideoEndpoint {

  private final AbstractExtendedAnnotationsRestService host;
  private final ExtendedAnnotationService eas;

  private final long videoId;

  private static class VideoData {

    enum Access {
        NONE,
        ANNOTATE,
        ANNOTATE_ADMIN
    }

    private final Video video;
    private final Access access;

    VideoData(final Video video, final Access access) {
      this.video = video;
      this.access = access;
    }

    public Video getVideo() {
      return video;
    }

    public Access getAccess() {
      return access;
    }
  }

  private final Option<VideoData> videoData;

  private VideoData.Access getVideoAccess(MediaPackage mediaPackage) {
    if (eas.hasVideoAccess(mediaPackage, ANNOTATE_ADMIN_ACTION)) return VideoData.Access.ANNOTATE_ADMIN;
    if (eas.hasVideoAccess(mediaPackage, ANNOTATE_ACTION)) return VideoData.Access.ANNOTATE;
    return VideoData.Access.NONE;
  }

  VideoEndpoint(final long videoId, final AbstractExtendedAnnotationsRestService host,
          final ExtendedAnnotationService eas) {
    this.videoId = videoId;
    this.host = host;
    this.eas = eas;

    this.videoData = this.eas.getVideo(videoId).map(new Function<Video, VideoData>() {
      @Override
      public VideoData apply(final Video video) {
        MediaPackage mediaPackage = eas.findMediaPackage(video.getExtId()).get();
        VideoData.Access access = getVideoAccess(mediaPackage);
        return new VideoData(video, access);
      }
    });

    for (VideoData videoData: this.videoData) {
      if (videoData.getAccess() == VideoData.Access.NONE) {
        throw new WebApplicationException(FORBIDDEN);
      }
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response getVideo() {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return videoData.fold(new Option.Match<VideoData, Response>() {
          @Override
          public Response some(VideoData v) {
            if (!eas.hasResourceAccess(v.getVideo()))
              return UNAUTHORIZED;
            return buildOk(VideoDto.toJson.apply(eas, v.getVideo()));
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @DELETE
  public Response deleteVideo() {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return videoData.fold(new Option.Match<VideoData, Response>() {
          @Override
          public Response some(VideoData v) {
            if (!eas.hasResourceAccess(v.getVideo()))
              return UNAUTHORIZED;
            return eas.deleteVideo(v.getVideo()) ? NO_CONTENT : NOT_FOUND;
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks")
  public Response postTrack(@FormParam("name") final String name, @FormParam("description") final String description,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {

    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        try {

          Resource resource = eas.createResource(option(access), tagsMap.bind(Functions.identity()));
          final Track t = eas.createTrack(videoId, name, trimToNone(description), trimToNone(settings), resource);

          return Response.created(trackLocationUri(t))
                  .entity(Strings.asStringNull().apply(TrackDto.toJson.apply(eas, t))).build();
        } catch (ExtendedAnnotationException e) {
          // here not_found leads to a bad_request
          return notFoundToBadRequest(e);
        }
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{id}")
  public Response putTrack(@PathParam("id") final long id, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("settings") final String settings,
          @FormParam("access") final Integer access, @FormParam("tags") final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        // check if video exists
        if (videoData.isSome()) {
          return eas.getTrack(id).fold(new Option.Match<Track, Response>() {
            // update track
            @Override
            public Response some(Track track) {
              if (!eas.hasResourceAccess(track))
                return UNAUTHORIZED;

              final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
              if (tagsMap.isSome() && tagsMap.get().isNone())
                return BAD_REQUEST;

              Resource resource = eas.updateResource(track,
                      tagsMap.bind(Functions.identity()));

              final Track updated = new TrackImpl(id, videoId, name, trimToNone(description), trimToNone(settings),
                      new ResourceImpl(option(access), resource.getCreatedBy(), resource.getUpdatedBy(), resource
                              .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource
                              .getDeletedAt(), resource.getTags()));
              if (!track.equals(updated)) {
                eas.updateTrack(updated);
                track = updated;
              }
              return Response.ok(Strings.asStringNull().apply(TrackDto.toJson.apply(eas, track)))
                      .header(LOCATION, trackLocationUri(updated)).build();
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        } else {
          return BAD_REQUEST;
        }
      }
    });
  }

  @DELETE
  @Path("tracks/{trackId}")
  public Response deleteTrack(@PathParam("trackId") final long trackId) {
    // TODO optimize querying for the existence of video and track
    if (videoData.isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas.getTrack(trackId).fold(new Option.Match<Track, Response>() {
            @Override
            public Response some(Track t) {
              if (!eas.hasResourceAccess(t))
                return UNAUTHORIZED;
              return eas.deleteTrack(t) ? NO_CONTENT : NOT_FOUND;
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        }
      });
    } else {
      return BAD_REQUEST;
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{id}")
  public Response getTrack(@PathParam("id") final long id) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        if (videoData.isSome()) {
          return eas.getTrack(id).fold(new Option.Match<Track, Response>() {
            @Override
            public Response some(Track t) {
              if (!eas.hasResourceAccess(t))
                return UNAUTHORIZED;
              return buildOk(TrackDto.toJson.apply(eas, t));
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        } else {
          return BAD_REQUEST;
        }
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks")
  public Response getTracks(@QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : none();
        final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
        final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
        final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

        if ((datem.isSome() && datem.get().isNone()) || videoData.isNone()
                || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                || (tagsOrArray.isSome() && tagsOrArray.get().isNone())) {
          return BAD_REQUEST;
        } else {
          return buildOk(TrackDto.toJson(
                  eas,
                  offset,
                  eas.getTracks(videoId, offsetm, limitm, datem.bind(Functions.identity()),
                          tagsAndArray.bind(Functions.identity()),
                          tagsOrArray.bind(Functions.identity()))));
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations")
  public Response postAnnotation(@PathParam("trackId") final long trackId, @FormParam("text") final String text,
          @FormParam("start") final Double start, @FormParam("duration") final Double duration,
          @FormParam("settings") final String settings, @FormParam("label_id") final Long labelId,
          @FormParam("scale_value_id") final Long scaleValueId, @FormParam("tags") final String tags) {
    return run(array(start), new Function0<Response>() {
      @Override
      public Response apply() {
        if (videoData.isSome() && eas.getTrack(trackId).isSome()) {
          final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
          if (tagsMap.isSome() && tagsMap.get().isNone())
            return BAD_REQUEST;

          Resource resource = eas.createResource(
                  tagsMap.bind(Functions.identity()));
          final Annotation a = eas.createAnnotation(trackId, trimToNone(text), start, option(duration),
                  trimToNone(settings), option(labelId), option(scaleValueId), resource);
          return Response.created(annotationLocationUri(videoId, a))
                  .entity(Strings.asStringNull().apply(AnnotationDto.toJson.apply(eas, a))).build();
        } else {
          return BAD_REQUEST;
        }
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{id}")
  public Response putAnnotation(@PathParam("trackId") final long trackId, @PathParam("id") final long id,
          @FormParam("text") final String text, @FormParam("start") final double start,
          @FormParam("duration") final Double duration, @FormParam("settings") final String settings,
          @FormParam("label_id") final Long labelId, @FormParam("scale_value_id") final Long scaleValueId,
          @FormParam("tags") final String tags) {
    return run(array(start), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        // check if video and track exist
        if (videoData.isSome() && eas.getTrack(trackId).isSome()) {
          return eas.getAnnotation(id).fold(new Option.Match<Annotation, Response>() {
            // update annotation
            @Override
            public Response some(Annotation annotation) {
              if (!eas.hasResourceAccess(annotation))
                return UNAUTHORIZED;

              Resource resource = eas.updateResource(annotation, tags);
              final Annotation updated = new AnnotationImpl(id, trackId, trimToNone(text), start, option(duration),
                      trimToNone(settings), option(labelId), option(scaleValueId), resource);
              if (!annotation.equals(updated)) {
                eas.updateAnnotation(updated);
                annotation = updated;
              }
              return Response.ok(Strings.asStringNull().apply(AnnotationDto.toJson.apply(eas, annotation)))
                      .header(LOCATION, annotationLocationUri(videoId, updated)).build();
            }

            // create a new one
            @Override
            public Response none() {
              Resource resource = eas.createResource(tags);
              final Annotation a = eas.createAnnotation(
                      new AnnotationImpl(id, trackId, trimToNone(text), start, option(duration), trimToNone(settings),
                              option(labelId), option(scaleValueId), resource));
              return Response.created(annotationLocationUri(videoId, a))
                      .entity(Strings.asStringNull().apply(AnnotationDto.toJson.apply(eas, a))).build();
            }
          });
        } else {
          return BAD_REQUEST;
        }
      }
    });

  }

  @DELETE
  @Path("tracks/{trackId}/annotations/{id}")
  public Response deleteAnnotation(@PathParam("trackId") final long trackId, @PathParam("id") final long id) {
    if (videoData.isSome() && eas.getTrack(trackId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas.getAnnotation(id).fold(new Option.Match<Annotation, Response>() {
            @Override
            public Response some(Annotation a) {
              if (!eas.hasResourceAccess(a))
                return UNAUTHORIZED;
              return eas.deleteAnnotation(a) ? NO_CONTENT : NOT_FOUND;
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        }
      });
    } else {
      return BAD_REQUEST;
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{id}")
  public Response getAnnotation(@PathParam("trackId") final long trackId, @PathParam("id") final long id) {
    // TODO optimize querying for the existence of video and track
    if (videoData.isSome() && eas.getTrack(trackId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas.getAnnotation(id).fold(new Option.Match<Annotation, Response>() {
            @Override
            public Response some(Annotation a) {
              if (!eas.hasResourceAccess(a))
                return UNAUTHORIZED;
              return buildOk(AnnotationDto.toJson.apply(eas, a));
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        }
      });
    } else {
      // track and/or video do not exist
      return BAD_REQUEST;
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations")
  public Response getAnnotations(@PathParam("trackId") final long trackId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("start") final double start,
          @QueryParam("end") final double end, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        if (videoData.isSome()) {
          final Option<Double> startm = start > 0 ? some(start) : none();
          final Option<Double> endm = end > 0 ? some(end) : none();
          final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
          final Option<Integer> limitm = limit > 0 ? some(limit) : none();
          final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
          final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
          final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

          if ((datem.isSome() && datem.get().isNone()) || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                  || (tagsOrArray.isSome() && tagsOrArray.get().isNone())) {
            return BAD_REQUEST;
          } else {
            return buildOk(AnnotationDto.toJson(
                    eas,
                    offset,
                    eas.getAnnotations(trackId, startm, endm, offsetm, limitm,
                            datem.bind(Functions.identity()),
                            tagsAndArray.bind(Functions.identity()),
                            tagsOrArray.bind(Functions.identity()))));
          }
        } else {
          return NOT_FOUND;
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales")
  public Response postScale(@FormParam("name") final String name, @FormParam("description") final String description,
          @FormParam("scale_id") final Long scaleId, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    if (scaleId == null)
        return host.createScale(some(videoId), name, description, access, tags);

    // TODO Why does this not use `createScale`?
    return run(array(scaleId), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (eas.getScale(scaleId, false).isNone() || videoData.isNone()
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas.createResource(option(access), tagsMap.bind(Functions.identity()));
        final Scale scale = eas.createScaleFromTemplate(videoId, scaleId, resource);
        return Response.created(host.scaleLocationUri(scale, true))
                .entity(Strings.asStringNull().apply(ScaleDto.toJson.apply(eas, scale))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}")
  public Response putScale(@PathParam("scaleId") final long id, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("tags") final String tags) {
    return host.updateScale(some(videoId), id, name, description, tags);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}")
  public Response getScale(@PathParam("scaleId") final long id) {
    return host.getScaleResponse(some(videoId), id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales")
  public Response getScales(@QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return host.getScalesResponse(some(videoId), limit, offset, date, tagsAnd, tagsOr);
  }

  @DELETE
  @Path("scales/{scaleId}")
  public Response deleteScale(@PathParam("scaleId") final long id) {
    return host.deleteScaleResponse(some(videoId), id);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues")
  public Response postScaleValue(@PathParam("scaleId") final long scaleId, @FormParam("name") final String name,
          @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    return host.postScaleValueResponse(some(videoId), scaleId, name, value, order, access, tags);
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response putScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id,
          @FormParam("name") final String name, @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    return host.putScaleValueResponse(some(videoId), scaleId, id, name, value, order, access, tags);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response getScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id) {
    return host.getScaleValueResponse(some(videoId), scaleId, id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues")
  public Response getScaleValues(@PathParam("scaleId") final long scaleId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return host.getScaleValuesResponse(some(videoId), scaleId, limit, offset, date, tagsAnd, tagsOr);
  }

  @DELETE
  @Path("scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response deleteScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id) {
    return host.deleteScaleValueResponse(some(videoId), scaleId, id);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories")
  public Response postCategory(@FormParam("category_id") final Long id,
          @FormParam("series_extid") final String seriesExtId,
          @FormParam("series_category_id") final Long seriesCategoryId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("scale_id") final Long scaleId,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    if (id == null)
      return host.postCategoryResponse(trimToNone(seriesExtId), option(seriesCategoryId), some(videoId), name,
              description, scaleId, settings, access, tags);
    return run(array(id), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (videoData.isNone() || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas.createResource(tagsMap.bind(Functions.identity()));
        Option<Category> categoryFromTemplate = eas.createCategoryFromTemplate(id, seriesExtId, seriesCategoryId,
                videoId, resource);
        return categoryFromTemplate.fold(new Option.Match<Category, Response>() {

          @Override
          public Response some(Category c) {
            return Response.created(host.categoryLocationUri(c, true))
                    .entity(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas, c))).build();
          }

          @Override
          public Response none() {
            return BAD_REQUEST;
          }

        });
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}")
  public Response putCategory(@PathParam("categoryId") final long id,
          @FormParam("series_extid") final String seriesExtId,
          @FormParam("series_category_id") final Long seriesCategoryId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("scale_id") final Long scaleId,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    return host.putCategoryResponse(id, trimToNone(seriesExtId), option(seriesCategoryId), some(videoId), name,
            description, option(scaleId), settings, option(access), tags);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}")
  public Response getCategory(@PathParam("categoryId") final long id) {
    return host.getCategoryResponse(some(videoId), id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories")
  public Response getCategories(@QueryParam("seriesExtId") final String seriesExtId,
          @QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return host.getCategoriesResponse(seriesExtId, some(videoId), limit, offset, date, tagsAnd, tagsOr);
  }

  @DELETE
  @Path("categories/{categoryId}")
  public Response deleteCategory(@PathParam("categoryId") final long categoryId) {
    return host.deleteCategoryResponse(some(videoId), categoryId);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels")
  public Response postLabel(@PathParam("categoryId") final long categoryId, @FormParam("value") final String value,
          @FormParam("abbreviation") final String abbreviation, @FormParam("description") final String description,
          @FormParam("access") final Integer access, @FormParam("settings") final String settings,
          @FormParam("tags") final String tags) {
    return host.postLabelResponse(some(videoId), categoryId, value, abbreviation, description, access, settings, tags);
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels/{labelId}")
  public Response putLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id,
          @FormParam("value") final String value, @FormParam("abbreviation") final String abbreviation,
          @FormParam("description") final String description, @FormParam("access") final Integer access,
          @FormParam("settings") final String settings, @FormParam("tags") final String tags) {
    return host.putLabelResponse(some(videoId), categoryId, id, value, abbreviation, description, access, settings,
            tags);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels/{labelId}")
  public Response getLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id) {
    return host.getLabelResponse(some(videoId), categoryId, id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels")
  public Response getLabels(@PathParam("categoryId") final long categoryId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return host.getLabelsResponse(some(videoId), categoryId, limit, offset, date, tagsAnd, tagsOr);
  }

  @DELETE
  @Path("categories/{categoryId}/labels/{labelId}")
  public Response deleteLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id) {
    return host.deleteLabelResponse(some(videoId), categoryId, id);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments")
  public Response postComment(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @FormParam("text") final String text,
          @FormParam("tags") final String tags) {
    return postCommentResponse(trackId, annotationId, none(), text, tags);
  }

  private Response postCommentResponse(final long trackId, final long annotationId, final Option<Long> replyToId,
          final String text, final String tags) {
    if (videoData.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(array(text), new Function0<Response>() {
        @Override
        public Response apply() {
          final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
          if (tagsMap.isSome() && tagsMap.get().isNone())
            return BAD_REQUEST;

          Resource resource = eas.createResource(tagsMap.bind(Functions.identity()));
          final Comment comment = eas.createComment(annotationId, replyToId, text, resource);

          return Response.created(commentLocationUri(comment, videoId, trackId))
                  .entity(Strings.asStringNull().apply(CommentDto.toJson.apply(eas, comment))).build();
        }
      });
    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{commentId}")
  public Response putComment(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("commentId") final long commentId,
          @FormParam("text") final String text, @FormParam("tags") final String tags) {
    if (videoData.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(array(text), new Function0<Response>() {
        @Override
        public Response apply() {
          final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
          if (tagsMap.isSome() && tagsMap.get().isNone())
            return BAD_REQUEST;

          final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

          return eas.getComment(commentId).fold(new Option.Match<Comment, Response>() {
            @Override
            public Response some(Comment c) {
              if (!eas.hasResourceAccess(c))
                return UNAUTHORIZED;
              Resource resource = eas.updateResource(c, tags);
              final Comment updated = new CommentImpl(commentId, annotationId, text, Option.none(), resource);
              if (!c.equals(updated)) {
                eas.updateComment(updated);
                c = updated;
              }
              return Response.ok(Strings.asStringNull().apply(CommentDto.toJson.apply(eas, c)))
                      .header(LOCATION, commentLocationUri(c, videoId, trackId)).build();
            }

            @Override
            public Response none() {
              Resource resource = eas.createResource(tags);
              final Comment comment = eas.createComment(annotationId, Option.none(), text, resource);

              return Response.created(commentLocationUri(comment, videoId, trackId))
                      .entity(Strings.asStringNull().apply(CommentDto.toJson.apply(eas, comment))).build();
            }
          });
        }
      });

    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @DELETE
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{id}")
  public Response deleteComment(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("id") final long commentId) {
    if (videoData.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas.getComment(commentId).fold(new Option.Match<Comment, Response>() {
            @Override
            public Response some(Comment c) {
              if (!eas.hasResourceAccess(c))
                return UNAUTHORIZED;
              return eas.deleteComment(c) ? NO_CONTENT : NOT_FOUND;
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        }
      });
    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{id}")
  public Response getComment(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("id") final long id) {
    if (videoData.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas.getComment(id).fold(new Option.Match<Comment, Response>() {
            @Override
            public Response some(Comment c) {
              if (!eas.hasResourceAccess(c))
                return UNAUTHORIZED;
              return buildOk(CommentDto.toJson.apply(eas, c));
            }

            @Override
            public Response none() {
              return NOT_FOUND;
            }
          });
        }
      });
    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments")
  public Response getComments(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return getCommentsResponse(trackId, annotationId, none(), limit, offset, date, tagsAnd, tagsOr);
  }

  private Response getCommentsResponse(final long trackId, final long annotationId, final Option<Long> replyToId,
          final int limit, final int offset, final String date, final String tagsAnd, final String tagsOr) {
    if (videoData.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
          final Option<Integer> limitm = limit > 0 ? some(limit) : none();
          final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
          Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
          Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

          if ((datem.isSome() && datem.get().isNone()) || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                  || (tagsOrArray.isSome() && tagsOrArray.get().isNone()))
            return BAD_REQUEST;

          return buildOk(CommentDto.toJson(
                  eas,
                  offset,
                  eas.getComments(annotationId, replyToId, offsetm, limitm,
                          datem.bind(Functions.identity()),
                          tagsAndArray.bind(Functions.identity()),
                          tagsOrArray.bind(Functions.identity()))));
        }
      });
    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies")
  public Response postReply(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("commentId") final long commentId,
          @FormParam("text") final String text, @FormParam("tags") final String tags) {
    Option<Comment> comment = eas.getComment(commentId);
    if (comment.isNone()) return BAD_REQUEST;
    return postCommentResponse(trackId, annotationId, Option.some(comment.get().getId()), text, tags);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies")
  public Response getReplies(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("commentId") final long commentId,
          @QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    Option<Comment> comment = eas.getComment(commentId);
    if (comment.isNone()) return BAD_REQUEST;
    return getCommentsResponse(trackId, annotationId, some(commentId), limit, offset, date, tagsAnd,
            tagsOr);
  }

  private URI trackLocationUri(Track t) {
    return uri(host.getEndpointBaseUrl(), "videos", t.getVideoId(), "tracks", t.getId());
  }

  private URI annotationLocationUri(long videoId, Annotation a) {
    return uri(host.getEndpointBaseUrl(), "videos", videoId, "tracks", a.getTrackId(), "annotations", a.getId());
  }

  private URI commentLocationUri(Comment c, long videoId, long trackId) {
    return uri(host.getEndpointBaseUrl(), "videos", videoId, "tracks", trackId, "annotations", c.getAnnotationId(),
            "comments", c.getId());
  }

  private static Response notFoundToBadRequest(ExtendedAnnotationException e) throws ExtendedAnnotationException {
    if (e.getCauseCode() == ExtendedAnnotationException.Cause.NOT_FOUND) {
      return BAD_REQUEST;
    } else {
      throw e;
    }
  }
}
