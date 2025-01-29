package org.opencast.annotation.endpoint;

import static org.opencast.annotation.api.ExtendedAnnotationService.ANNOTATE_ACTION;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.BAD_REQUEST;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.FORBIDDEN;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.LOCATION;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.NOT_FOUND;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.NO_CONTENT;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.UNAUTHORIZED;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.nil;
import static org.opencast.annotation.endpoint.AbstractExtendedAnnotationsRestService.run;
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
import org.opencast.annotation.api.Label;
import org.opencast.annotation.api.Questionnaire;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.ScaleValue;
import org.opencast.annotation.api.Track;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.impl.AnnotationImpl;
import org.opencast.annotation.impl.CategoryImpl;
import org.opencast.annotation.impl.CommentImpl;
import org.opencast.annotation.impl.LabelImpl;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.ScaleImpl;
import org.opencast.annotation.impl.ScaleValueImpl;
import org.opencast.annotation.impl.TrackImpl;
import org.opencast.annotation.impl.persistence.AnnotationDto;
import org.opencast.annotation.impl.persistence.CategoryDto;
import org.opencast.annotation.impl.persistence.CommentDto;
import org.opencast.annotation.impl.persistence.LabelDto;
import org.opencast.annotation.impl.persistence.QuestionnaireDto;
import org.opencast.annotation.impl.persistence.ScaleDto;
import org.opencast.annotation.impl.persistence.ScaleValueDto;
import org.opencast.annotation.impl.persistence.TrackDto;
import org.opencast.annotation.impl.persistence.VideoDto;

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Option;

import java.net.URI;

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
  private final Option<Video> videoOpt;

  VideoEndpoint(final long videoId, final AbstractExtendedAnnotationsRestService host,
          final ExtendedAnnotationService eas) {
    this.videoId = videoId;
    this.host = host;
    this.eas = eas;

    this.videoOpt = this.eas.getVideo(videoId);

    if (this.videoOpt.isSome()) {
      MediaPackage mediaPackage = eas.findMediaPackage(videoOpt.get().getExtId()).get();
      if (!eas.hasVideoAccess(mediaPackage, ANNOTATE_ACTION)) {
        throw new WebApplicationException(FORBIDDEN);
      }
    }
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public Response getVideo() {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return videoOpt.fold(new Option.Match<>() {
          @Override
          public Response some(Video v) {
            if (!eas.hasResourceAccess(v)) {
              return UNAUTHORIZED;
            }
            return Response.ok(VideoDto.toJson.apply(eas, v).toString()).build();
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
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return videoOpt.fold(new Option.Match<>() {
          @Override
          public Response some(Video v) {
            if (!eas.hasResourceAccess(v)) {
              return UNAUTHORIZED;
            }
            return eas.deleteVideo(v) ? NO_CONTENT : NOT_FOUND;
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
          @FormParam("settings") final String settings, @FormParam("access") final Integer access) {

    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        try {
          Resource resource = eas.createResource(option(access), none());
          final Track t = eas.createTrack(videoId, name, trimToNone(description), trimToNone(settings), resource);

          return Response.created(trackLocationUri(t)).entity(TrackDto.toJson.apply(eas, t).toString()).build();
        } catch (ExtendedAnnotationException e) {
          if (e.getCauseCode() == ExtendedAnnotationException.Cause.NOT_FOUND) {
            return BAD_REQUEST;
          } else {
            throw e;
          }
        }
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{id}")
  public Response putTrack(@PathParam("id") final long id, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("settings") final String settings,
          @FormParam("access") final Integer access) {
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        // check if video exists
        if (videoOpt.isSome()) {
          return eas.getTrack(id).fold(new Option.Match<>() {
            // update track
            @Override
            public Response some(Track track) {
              if (!eas.hasResourceAccess(track)) {
                return UNAUTHORIZED;
              }

              Resource resource = eas.updateResource(track, Option.none());

              final Track updated = new TrackImpl(id, videoId, name, trimToNone(description), trimToNone(settings),
                  new ResourceImpl(option(access), resource.getCreatedBy(), resource.getUpdatedBy(), resource.getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(),
                      resource.getDeletedAt(), resource.getTags()));
              if (!track.equals(updated)) {
                eas.updateTrack(updated);
                track = updated;
              }
              return Response.ok(TrackDto.toJson.apply(eas, track).toString()).header(LOCATION, trackLocationUri(updated)).build();
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
    if (videoOpt.isSome()) {
      return run(nil, new Function0<>() {
        @Override
        public Response apply() {
          return eas.getTrack(trackId).fold(new Option.Match<>() {
            @Override
            public Response some(Track t) {
              if (!eas.hasResourceAccess(t)) {
                return UNAUTHORIZED;
              }
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
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (videoOpt.isSome()) {
          return eas.getTrack(id).fold(new Option.Match<>() {
            @Override
            public Response some(Track t) {
              if (!eas.hasResourceAccess(t)) {
                return UNAUTHORIZED;
              }
              return Response.ok(TrackDto.toJson.apply(eas, t).toString()).build();
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
  public Response getTracks() {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (videoOpt.isNone()) {
          return BAD_REQUEST;
        } else {
          return Response.ok(TrackDto.toJson(eas, eas.getTracks(videoId)).toString()).build();
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations")
  public Response postAnnotation(@PathParam("trackId") final long trackId, @FormParam("start") final Double start,
          @FormParam("duration") final Double duration, @FormParam("content") @DefaultValue("[]") final String content,
          @FormParam("createdFromQuestionnaire") final long createdFromQuestionnaire,
          @FormParam("settings") final String settings) {
    return run(array(start), new Function0<>() {
      @Override
      public Response apply() {
        if (videoOpt.isSome() && eas.getTrack(trackId).isSome()) {
          Resource resource = eas.createResource();
          final Annotation a = eas.createAnnotation(trackId, start, option(duration), content, createdFromQuestionnaire,
              trimToNone(settings), resource);
          return Response.created(annotationLocationUri(videoId, a)).entity(AnnotationDto.toJson.apply(eas, a).toString()).build();
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
          @FormParam("start") final double start, @FormParam("duration") final Double duration,
          @FormParam("content") @DefaultValue("[]") final String content,
          @FormParam("createdFromQuestionnaire") final long createdFromQuestionnaire,
          @FormParam("settings") final String settings) {
    return run(array(start), new Function0<>() {
      @Override
      public Response apply() {
        // check if video and track exist
        if (videoOpt.isSome() && eas.getTrack(trackId).isSome()) {
          return eas.getAnnotation(id).fold(new Option.Match<>() {
            // update annotation
            @Override
            public Response some(Annotation annotation) {
              if (!eas.hasResourceAccess(annotation)) {
                return UNAUTHORIZED;
              }

              Resource resource = eas.updateResource(annotation, Option.none());
              final Annotation updated = new AnnotationImpl(id, trackId, start, option(duration), content,
                  createdFromQuestionnaire, trimToNone(settings), resource);
              if (!annotation.equals(updated)) {
                eas.updateAnnotation(updated);
                annotation = updated;
              }
              return Response.ok(AnnotationDto.toJson.apply(eas, annotation).toString()).header(LOCATION, annotationLocationUri(videoId, updated)).build();
            }

            // create a new one
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
  @Path("tracks/{trackId}/annotations/{id}")
  public Response deleteAnnotation(@PathParam("trackId") final long trackId, @PathParam("id") final long id) {
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()) {
      return run(nil, new Function0<>() {
        @Override
        public Response apply() {
          return eas.getAnnotation(id).fold(new Option.Match<>() {
            @Override
            public Response some(Annotation a) {
              if (!eas.hasResourceAccess(a)) {
                return UNAUTHORIZED;
              }
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
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()) {
      return run(nil, new Function0<>() {
        @Override
        public Response apply() {
          return eas.getAnnotation(id).fold(new Option.Match<>() {
            @Override
            public Response some(Annotation a) {
              if (!eas.hasResourceAccess(a)) {
                return UNAUTHORIZED;
              }
              return Response.ok(AnnotationDto.toJson.apply(eas, a).toString()).build();
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

  // TODO Is this even used?
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations")
  public Response getAnnotations(@PathParam("trackId") final long trackId) {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (videoOpt.isSome()) {
          return Response.ok(AnnotationDto.toJson(eas,
                  eas.getAnnotations(trackId)).toString()).build();
        } else {
          return NOT_FOUND;
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales")
  public Response postScale(@FormParam("name") final String name, @FormParam("description") final String description, @FormParam("access") final Integer access) {
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        }

        Resource resource = eas.createResource(option(access), none());
        final Scale scale = eas.createScale(videoId, name, trimToNone(description), resource);
        return Response.created(scaleLocationUri(scale)).entity(ScaleDto.toJson.apply(eas, scale).toString()).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}")
  public Response putScale(@PathParam("scaleId") final long id, @FormParam("name") final String name,
          @FormParam("description") final String description) {
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        }

        return eas.getScale(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(Scale scale) {
            if (!eas.hasResourceAccess(scale)) {
              return UNAUTHORIZED;
            }
            Resource resource = eas.updateResource(scale, Option.none());
            final Scale updated = new ScaleImpl(id, videoId, name, trimToNone(description), resource);
            if (!scale.equals(updated)) {
              eas.updateScale(updated);
              scale = updated;
            }
            return Response.ok(ScaleDto.toJson.apply(eas, scale).toString()).header(LOCATION, scaleLocationUri(scale)).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}")
  public Response getScale(@PathParam("scaleId") final long id) {
    if (eas.getVideo(videoId).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getScale(id, false).fold(new Option.Match<>() {
          @Override
          public Response some(Scale s) {
            if (!eas.hasResourceAccess(s)) {
              return UNAUTHORIZED;
            }
            return Response.ok(ScaleDto.toJson.apply(eas, s).toString()).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales")
  public Response getScales() {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        } else {
          return Response.ok(ScaleDto.toJson(eas, eas.getScales(videoId)).toString()).build();
        }
      }
    });
  }

  @DELETE
  @Path("scales/{scaleId}")
  public Response deleteScale(@PathParam("scaleId") final long id) {
    if (eas.getVideo(videoId).isNone())
      return BAD_REQUEST;
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getScale(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(Scale s) {
            if (!eas.hasResourceAccess(s)) {
              return UNAUTHORIZED;
            }
            // Delete all scale values
            eas.getScaleValues(s.getId()).forEach(eas::deleteScaleValue);
            // Delete scale itself
            s = eas.deleteScale(s);
            return Response.ok(ScaleDto.toJson.apply(eas, s).toString()).header(LOCATION, scaleLocationUri(s)).build();
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
  @Path("scales/{scaleId}/scalevalues")
  public Response postScaleValue(@PathParam("scaleId") final long scaleId, @FormParam("name") final String name,
          @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("access") final Integer access) {
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone() || eas.getScale(scaleId, false).isNone()) {
          return BAD_REQUEST;
        }

        Resource resource = eas.createResource(option(access), none());
        final ScaleValue scaleValue = eas.createScaleValue(scaleId, name, value, order, resource);

        return Response.created(scaleValueLocationUri(scaleValue, videoId)).entity(ScaleValueDto.toJson.apply(eas, scaleValue).toString()).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response putScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id,
          @FormParam("name") final String name, @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("access") final Integer access) {
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone() || eas.getScale(scaleId, false).isNone()) {
          return BAD_REQUEST;
        }

        return eas.getScaleValue(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(ScaleValue s) {
            if (!eas.hasResourceAccess(s)) {
              return UNAUTHORIZED;
            }
            Resource resource = eas.updateResource(s, Option.none());
            final ScaleValue updated = new ScaleValueImpl(id, scaleId, name, value, order, resource);
            if (!s.equals(updated)) {
              eas.updateScaleValue(updated);
              s = updated;
            }
            return Response.ok(ScaleValueDto.toJson.apply(eas, s).toString()).header(LOCATION, scaleValueLocationUri(s, videoId)).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response getScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id) {
    if (eas.getVideo(videoId).isNone() || eas.getScale(scaleId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getScaleValue(id, false).fold(new Option.Match<>() {
          @Override
          public Response some(ScaleValue s) {
            if (!eas.hasResourceAccess(s)) {
              return UNAUTHORIZED;
            }
            return Response.ok(ScaleValueDto.toJson.apply(eas, s).toString()).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("scales/{scaleId}/scalevalues")
  public Response getScaleValues(@PathParam("scaleId") final long scaleId) {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone() || eas.getScale(scaleId, true).isNone()) {
          return BAD_REQUEST;
        }

        return Response.ok(ScaleValueDto.toJson(eas, eas.getScaleValues(scaleId)).toString()).build();
      }
    });
  }

  @DELETE
  @Path("scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response deleteScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id) {
    if (eas.getVideo(videoId).isNone() || eas.getScale(scaleId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getScaleValue(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(ScaleValue s) {
            if (!eas.hasResourceAccess(s)) {
              return UNAUTHORIZED;
            }
            s = eas.deleteScaleValue(s);
            return Response.ok(ScaleValueDto.toJson.apply(eas, s).toString())
                .header(LOCATION, scaleValueLocationUri(s, videoId)).build();
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
  @Path("categories")
  public Response postCategory(@FormParam("series_extid") final String seriesExtId,
          @FormParam("series_category_id") final Long seriesCategoryId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("scale_id") final Long scaleId,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access) {
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        }

        Resource resource = eas.createResource(option(access), none());
        final Category category = eas.createCategory(trimToNone(seriesExtId), option(seriesCategoryId), videoId,
            option(scaleId), name, trimToNone(description), trimToNone(settings), resource);

        return Response.created(categoryLocationUri(category)).entity(CategoryDto.toJson.apply(eas, category).toString()).build();
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
          @FormParam("settings") final String settings, @FormParam("access") final Integer access) {
    Option<Long> seriesCategoryIdOpt = option(seriesCategoryId);
    Option<String> seriesExtIdOpt = trimToNone(seriesExtId);
    return run(array(name), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        }

        return eas.getCategory(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(Category c) {
            if (!eas.hasResourceAccess(c)) {
              return UNAUTHORIZED;
            }
            Resource resource = eas.updateResource(c, Option.none());

            // If we are updating a master series category from a local copy avoid changing the video
            // the master series category belongs to by passing the series' category's video id
            Option<Category> seriesCategory = seriesCategoryIdOpt.flatMap(new Function<>() {
              @Override
              public Option<Category> apply(Long seriesCategoryId11) {
                return eas.getCategory(seriesCategoryId11, false);
              }
            });
            if (seriesCategoryIdOpt.isSome() && seriesCategory.isNone()) {
              return BAD_REQUEST;
            }
            Option<Long> seriesCategoryVideoId = seriesCategory.map(new Function<>() {
              @Override
              public Long apply(Category seriesCategory) {
                return seriesCategory.getVideoId();
              }
            });

            final Category updated = new CategoryImpl(id, seriesExtIdOpt, seriesCategoryIdOpt, seriesCategoryVideoId.getOrElse(videoId), option(scaleId),
                name, trimToNone(description), trimToNone(settings),
                new ResourceImpl(option(access), resource.getCreatedBy(), resource.getUpdatedBy(), resource.getDeletedBy(),
                    resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource.getTags()));
            if (!c.equals(updated)) {
              if (seriesCategoryIdOpt.isNone()) {
                eas.updateCategoryAndDeleteOtherSeriesCategories(updated);
              } else {
                eas.updateCategory(updated);
              }
              c = updated;
            }
            return Response.ok(CategoryDto.toJson.apply(eas, c).toString()).header(LOCATION, categoryLocationUri(c)).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}")
  public Response getCategory(@PathParam("categoryId") final long id) {
    if (eas.getVideo(videoId).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getCategory(id, false).fold(new Option.Match<>() {
          @Override
          public Response some(Category c) {
            if (!eas.hasResourceAccess(c)) {
              return UNAUTHORIZED;
            }
            return Response.ok(CategoryDto.toJson.apply(eas, c).toString()).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories")
  public Response getCategories(@QueryParam("series-extid") final String seriesExtId) {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        final Option<String> seriesExtIdm = trimToNone(seriesExtId);

        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        } else {
          return Response.ok(CategoryDto.toJson(eas, eas.getCategories(seriesExtIdm, videoId)).toString()).build();
        }
      }
    });
  }

  @DELETE
  @Path("categories/{categoryId}")
  public Response deleteCategory(@PathParam("categoryId") final long categoryId) {
    if (eas.getVideo(videoId).isNone() || eas.getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getCategory(categoryId, true).fold(new Option.Match<>() {
          @Override
          public Response some(Category c) {
            if (!eas.hasResourceAccess(c)) {
              return UNAUTHORIZED;
            }
            c = eas.deleteCategory(c);
            return Response.ok(CategoryDto.toJson.apply(eas, c).toString())
                .header(LOCATION, categoryLocationUri(c)).build();
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
  @Path("categories/{categoryId}/labels")
  public Response postLabel(@PathParam("categoryId") final long categoryId, @FormParam("value") final String value,
          @FormParam("abbreviation") final String abbreviation, @FormParam("description") final String description,
          @FormParam("access") final Integer access, @FormParam("settings") final String settings) {
    return run(array(value, abbreviation), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone() || eas.getCategory(categoryId, false).isNone()) {
          return BAD_REQUEST;
        }

        Resource resource = eas.createResource(option(access), none());
        final Label label = eas.createLabel(categoryId, value, abbreviation, trimToNone(description), trimToNone(settings), resource);

        return Response.created(labelLocationUri(label)).entity(LabelDto.toJson.apply(eas, label).toString()).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels/{labelId}")
  public Response putLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id,
          @FormParam("value") final String value, @FormParam("abbreviation") final String abbreviation,
          @FormParam("description") final String description, @FormParam("access") final Integer access,
          @FormParam("settings") final String settings) {
    return run(array(value, abbreviation), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone() || eas.getCategory(categoryId, false).isNone()) {
          return BAD_REQUEST;
        }

        return eas.getLabel(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(Label l) {
            if (!eas.hasResourceAccess(l)) {
              return UNAUTHORIZED;
            }
            Resource resource = eas.updateResource(l, Option.none());
            final Label updated = new LabelImpl(id, l.getSeriesLabelId(), categoryId, value, abbreviation, trimToNone(description), trimToNone(settings), resource);
            if (!l.equals(updated)) {
              eas.updateLabel(updated);
              l = updated;
            }
            return Response.ok(LabelDto.toJson.apply(eas, l).toString()).header(LOCATION, labelLocationUri(l))
                .build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels/{labelId}")
  public Response getLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id) {
    if (eas.getVideo(videoId).isNone() || eas.getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getLabel(id, false).fold(new Option.Match<>() {
          @Override
          public Response some(Label l) {
            if (!eas.hasResourceAccess(l)) {
              return UNAUTHORIZED;
            }
            return Response.ok(LabelDto.toJson.apply(eas, l).toString()).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("categories/{categoryId}/labels")
  public Response getLabels(@PathParam("categoryId") final long categoryId) {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone() || eas.getCategory(categoryId, true).isNone()) {
          return BAD_REQUEST;
        }

        return Response.ok(LabelDto.toJson(eas, eas.getLabels(categoryId)).toString()).build();
      }
    });
  }

  @DELETE
  @Path("categories/{categoryId}/labels/{labelId}")
  public Response deleteLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id) {
    if (eas.getVideo(videoId).isNone() || eas.getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getLabel(id, true).fold(new Option.Match<>() {
          @Override
          public Response some(Label l) {
            if (!eas.hasResourceAccess(l)) {
              return UNAUTHORIZED;
            }

            // If the label is a copy from a series category, delete it on the series category instead
            if (l.getSeriesLabelId().isSome()) {
              return eas.getLabel(l.getSeriesLabelId().get(), false).fold(new Option.Match<>() {
                @Override
                public Response some(Label l) {
                  if (!eas.hasResourceAccess(l)) {
                    return UNAUTHORIZED;
                  }

                  l = eas.deleteLabel(l);
                  return Response.ok(LabelDto.toJson.apply(eas, l).toString())
                      .header(LOCATION, labelLocationUri(l)).build();
                }

                @Override
                public Response none() {
                  return NOT_FOUND;
                }
              });
              // Otherwise, delete normally
            } else {
              l = eas.deleteLabel(l);
              return Response.ok(LabelDto.toJson.apply(eas, l).toString()).header(LOCATION, labelLocationUri(l)).build();
            }
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("questionnaires/{questionnaireId}")
  public Response getQuestionnaire(@PathParam("questionnaireId") final long id) {
    if (eas.getVideo(videoId).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getQuestionnaire(id, false).fold(new Option.Match<>() {
          @Override
          public Response some(Questionnaire c) {
            if (!eas.hasResourceAccess(c)) {
              return UNAUTHORIZED;
            }
            return Response.ok(QuestionnaireDto.toJson.apply(eas, c).toString()).build();
          }

          @Override
          public Response none() {
            return NOT_FOUND;
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("questionnaires")
  public Response getQuestionnaires() {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        } else {
          return Response.ok(QuestionnaireDto.toJson(eas, eas.getQuestionnaires(videoId)).toString())
                  .build();
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("questionnaires")
  public Response postQuestionnaire(
          @FormParam("title") final String title,
          @FormParam("content") @DefaultValue("[]") final String content,
          @FormParam("settings") final String settings,
          @FormParam("access") final Integer access) {
    return run(array(title, content), new Function0<>() {
      @Override
      public Response apply() {
        if (eas.getVideo(videoId).isNone()) {
          return BAD_REQUEST;
        }

        Resource resource = eas.createResource(option(access), none());
        final Questionnaire questionnaire = eas.createQuestionnaire(videoId, title, content, trimToNone(settings),
            resource);

        return Response.created(questionnaireLocationUri(questionnaire)).entity(QuestionnaireDto.toJson.apply(eas, questionnaire).toString()).build();
      }
    });
  }

  @DELETE
  @Path("questionnaires/{questionnaireId}")
  public Response deleteQuestionnaire(@PathParam("questionnaireId") final long questionnaireId) {
    if (eas.getVideo(videoId).isNone() || eas.getQuestionnaire(
        questionnaireId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas.getQuestionnaire(questionnaireId, true).fold(new Option.Match<>() {
          @Override
          public Response some(Questionnaire q) {
            if (!eas.hasResourceAccess(q)) {
              return UNAUTHORIZED;
            }

            q = eas.deleteQuestionnaire(q);

            return Response.ok(QuestionnaireDto.toJson.apply(eas, q).toString())
                .header(LOCATION, questionnaireLocationUri(q)).build();
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
  @Path("tracks/{trackId}/annotations/{annotationId}/comments")
  public Response postComment(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @FormParam("text") final String text) {
    return postCommentResponse(trackId, annotationId, none(), text);
  }

  private Response postCommentResponse(final long trackId, final long annotationId, final Option<Long> replyToId,
          final String text) {
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(array(text), new Function0<>() {
        @Override
        public Response apply() {
          Resource resource = eas.createResource();
          final Comment comment = eas.createComment(annotationId, replyToId, text, resource);

          return Response.created(commentLocationUri(comment, videoId, trackId)).entity(CommentDto.toJson.apply(eas, comment).toString()).build();
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
          @FormParam("text") final String text) {
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(array(text), new Function0<>() {
        @Override
        public Response apply() {
          return eas.getComment(commentId).fold(new Option.Match<>() {
            @Override
            public Response some(Comment c) {
              if (!eas.hasResourceAccess(c)) {
                return UNAUTHORIZED;
              }
              Resource resource = eas.updateResource(c, Option.none());
              final Comment updated = new CommentImpl(commentId, annotationId, text, Option.none(), resource);
              if (!c.equals(updated)) {
                eas.updateComment(updated);
                c = updated;
              }
              return Response.ok(CommentDto.toJson.apply(eas, c).toString()).header(LOCATION, commentLocationUri(c, videoId, trackId)).build();
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

  @DELETE
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{id}")
  public Response deleteComment(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("id") final long commentId) {
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<>() {
        @Override
        public Response apply() {
          return eas.getComment(commentId).fold(new Option.Match<>() {
            @Override
            public Response some(Comment c) {
              if (!eas.hasResourceAccess(c)) {
                return UNAUTHORIZED;
              }
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
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<>() {
        @Override
        public Response apply() {
          return eas.getComment(id).fold(new Option.Match<>() {
            @Override
            public Response some(Comment c) {
              if (!eas.hasResourceAccess(c)) {
                return UNAUTHORIZED;
              }
              return Response.ok(CommentDto.toJson.apply(eas, c).toString()).build();
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
          @PathParam("annotationId") final long annotationId) {
    return getCommentsResponse(trackId, annotationId, none());
  }

  private Response getCommentsResponse(final long trackId, final long annotationId, final Option<Long> replyToId) {
    if (videoOpt.isSome() && eas.getTrack(trackId).isSome()
            && eas.getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<>() {
        @Override
        public Response apply() {
          return Response.ok(CommentDto.toJson(eas, eas.getComments(annotationId, replyToId)).toString()).build();
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
          @FormParam("text") final String text) {
    Option<Comment> comment = eas.getComment(commentId);
    if (comment.isNone()) return BAD_REQUEST;
    return postCommentResponse(trackId, annotationId, Option.some(comment.get().getId()), text);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies")
  public Response getReplies(@PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("commentId") final long commentId) {
    Option<Comment> comment = eas.getComment(commentId);
    if (comment.isNone()) return BAD_REQUEST;
    return getCommentsResponse(trackId, annotationId, some(commentId));
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

  private URI scaleLocationUri(Scale s) {
    return uri(host.getEndpointBaseUrl(), "videos", s.getVideoId(), "scales", s.getId());
  }

  private URI scaleValueLocationUri(ScaleValue s, long videoId) {
    return uri(host.getEndpointBaseUrl(), "videos", videoId, "scales", s.getScaleId(), "scalevalues", s.getId());
  }

  private URI categoryLocationUri(Category c) {
    return uri(host.getEndpointBaseUrl(), "videos", c.getVideoId(), "categories", c.getId());
  }

  private URI labelLocationUri(Label l) {
    return uri(host.getEndpointBaseUrl(), "videos", videoId, "categories", l.getCategoryId(), "labels", l.getId());
  }

  private URI questionnaireLocationUri(Questionnaire q) {
    return uri(host.getEndpointBaseUrl(), "videos", q.getVideoId(), "questionnaires", q.getId());
  }
}
