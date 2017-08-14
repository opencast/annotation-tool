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
package org.opencast.annotation.endpoint;

import static org.opencastproject.util.UrlSupport.uri;
import static org.opencastproject.util.data.Arrays.array;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.Option.some;
import static org.opencastproject.util.data.functions.Strings.trimToNone;

import org.opencastproject.util.IoSupport;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Function2;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.functions.Functions;
import org.opencastproject.util.data.functions.Strings;

import static org.opencast.annotation.endpoint.util.Responses.buildOk;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationException;
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

import org.opencast.annotation.impl.persistence.AbstractResourceDto;
import org.opencast.annotation.impl.persistence.AnnotationDto;
import org.opencast.annotation.impl.persistence.CategoryDto;
import org.opencast.annotation.impl.persistence.CommentDto;
import org.opencast.annotation.impl.persistence.LabelDto;
import org.opencast.annotation.impl.persistence.ScaleDto;
import org.opencast.annotation.impl.persistence.ScaleValueDto;
import org.opencast.annotation.impl.persistence.TrackDto;
import org.opencast.annotation.impl.persistence.UserDto;
import org.opencast.annotation.impl.persistence.VideoDto;

import au.com.bytecode.opencsv.CSVWriter;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.joda.time.format.ISODateTimeFormat;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

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
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.StreamingOutput;

// no @Path annotation here since this class cannot be created by JAX-RS. Put it on implementations.
public abstract class AbstractExtendedAnnotationsRestService {

  private static final Logger logger = LoggerFactory.getLogger(AbstractExtendedAnnotationsRestService.class);

  /** Location header. */
  public static final String LOCATION = "Location";

  protected abstract ExtendedAnnotationService getExtendedAnnotationsService();

  protected abstract String getEndpointBaseUrl();

  // short hand
  private ExtendedAnnotationService eas() {
    return getExtendedAnnotationsService();
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/users")
  public Response postUsers(@FormParam("user_extid") final String userExtId,
          @FormParam("nickname") final String nickname, @FormParam("email") final String email,
          @FormParam("tags") final String tags) {
    final Option<String> emailo = trimToNone(email);
    return run(array(userExtId, nickname), new Function0<Response>() {
      @Override
      public Response apply() {
        if (eas().getUserByExtId(userExtId).isSome())
          return CONFLICT;

        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        User u = eas().createUser(userExtId, nickname, emailo, resource);
        resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        u = new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), resource);
        eas().updateUser(u);

        return Response.created(userLocationUri(u))
                .entity(Strings.asStringNull().apply(UserDto.toJson.apply(eas(), u))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/users")
  public Response putUser(@FormParam("user_extid") final String userExtId,
          @FormParam("nickname") final String nickname, @FormParam("email") final String email,
          @FormParam("tags") final String tags) {
    final Option<String> emailo = trimToNone(email);
    return run(array(userExtId, nickname), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        return eas().getUserByExtId(userExtId).fold(new Option.Match<User, Response>() {
          @Override
          public Response some(User u) {
            if (!eas().hasResourceAccess(u))
              return UNAUTHORIZED;

            Resource resource = eas().updateResource(u, tags);
            final User updated = new UserImpl(u.getId(), userExtId, nickname, emailo, resource);
            if (!u.equals(updated)) {
              eas().updateUser(updated);
              u = updated;
            }

            return Response.ok(Strings.asStringNull().apply(UserDto.toJson.apply(eas(), u)))
                    .header(LOCATION, userLocationUri(u)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource();
            User u = eas().createUser(userExtId, nickname, emailo, resource);
            resource = eas().createResource(tags);
            u = new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), resource);
            eas().updateUser(new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), resource));
            return Response.created(userLocationUri(u))
                    .entity(Strings.asStringNull().apply(UserDto.toJson.apply(eas(), u))).build();
          }
        });
      }
    });
  }

  @DELETE
  @Path("/users/{id}")
  public Response deleteUser(@PathParam("id") final long id) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getUser(id).fold(new Option.Match<User, Response>() {
          @Override
          public Response some(User u) {
            if (!eas().hasResourceAccess(u))
              return UNAUTHORIZED;
            return eas().deleteUser(u) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/users/{id}")
  public Response getUser(@PathParam("id") final long id) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getUser(id).fold(new Option.Match<User, Response>() {
          @Override
          public Response some(User u) {
            if (!eas().hasResourceAccess(u))
              return UNAUTHORIZED;

            return buildOk(UserDto.toJson.apply(eas(), u));
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
  @Path("/videos")
  public Response postVideos(@FormParam("video_extid") final String videoExtId, @FormParam("tags") final String tags) {
    return run(array(videoExtId), new Function0<Response>() {
      @Override
      public Response apply() {
        if (eas().getVideoByExtId(videoExtId).isSome())
          return CONFLICT;

        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        final Video v = eas().createVideo(videoExtId, resource);
        return Response.created(videoLocationUri(v))
                .entity(Strings.asStringNull().apply(VideoDto.toJson.apply(eas(), v))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos")
  public Response putVideo(@FormParam("video_extid") final String videoExtId,
          @FormParam("access") final Integer access, @FormParam("tags") final String tags) {
    return run(array(videoExtId), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        return eas().getVideoByExtId(videoExtId).fold(new Option.Match<Video, Response>() {
          @Override
          public Response some(Video v) {
            if (!eas().hasResourceAccess(v))
              return UNAUTHORIZED;

            Resource resource = eas().updateResource(v, tags);
            final Video updated = new VideoImpl(v.getId(), videoExtId, resource);
            if (!v.equals(updated)) {
              eas().updateVideo(updated);
              v = updated;
            }
            return Response.ok(Strings.asStringNull().apply(VideoDto.toJson.apply(eas(), v)))
                    .header(LOCATION, videoLocationUri(v)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(tags);
            final Video v = eas().createVideo(
                    videoExtId,
                    new ResourceImpl(option(access), resource.getCreatedBy(), resource.getUpdatedBy(), resource
                            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(),
                            resource.getTags()));
            return Response.created(videoLocationUri(v))
                    .entity(Strings.asStringNull().apply(VideoDto.toJson.apply(eas(), v))).build();
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{id}")
  public Response getVideo(@PathParam("id") final long id) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getVideo(id).fold(new Option.Match<Video, Response>() {
          @Override
          public Response some(Video v) {
            if (!eas().hasResourceAccess(v))
              return UNAUTHORIZED;
            return buildOk(VideoDto.toJson.apply(eas(), v));
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
  @Path("/videos/{id}")
  public Response deleteVideo(@PathParam("id") final long id) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getVideo(id).fold(new Option.Match<Video, Response>() {
          @Override
          public Response some(Video v) {
            if (!eas().hasResourceAccess(v))
              return UNAUTHORIZED;
            return eas().deleteVideo(v) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/videos/{videoId}/tracks")
  public Response postTrack(@PathParam("videoId") final long videoId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("settings") final String settings,
          @FormParam("access") final Integer access, @FormParam("tags") final String tags) {

    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        try {

          Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
          final Track t = eas().createTrack(videoId, name, trimToNone(description), Option.option(access),
                  trimToNone(settings), resource);

          return Response.created(trackLocationUri(t))
                  .entity(Strings.asStringNull().apply(TrackDto.toJson.apply(eas(), t))).build();
        } catch (ExtendedAnnotationException e) {
          // here not_found leads to a bad_request
          return notFoundToBadRequest(e);
        }
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/tracks/{id}")
  public Response putTrack(@PathParam("videoId") final long videoId, @PathParam("id") final long id,
          @FormParam("name") final String name, @FormParam("description") final String description,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        // check if video exists
        if (eas().getVideo(videoId).isSome()) {
          return eas().getTrack(id).fold(new Option.Match<Track, Response>() {
            // update track
            @Override
            public Response some(Track track) {
              if (!eas().hasResourceAccess(track))
                return UNAUTHORIZED;

              final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
              if (tagsMap.isSome() && tagsMap.get().isNone())
                return BAD_REQUEST;

              Resource resource = eas().updateResource(track,
                      tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));

              final Track updated = new TrackImpl(id, videoId, name, trimToNone(description), trimToNone(settings),
                      new ResourceImpl(option(access), resource.getCreatedBy(), resource.getUpdatedBy(), resource
                              .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource
                              .getDeletedAt(), resource.getTags()));
              if (!track.equals(updated)) {
                eas().updateTrack(updated);
                track = updated;
              }
              return Response.ok(Strings.asStringNull().apply(TrackDto.toJson.apply(eas(), track)))
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
  @Path("/videos/{videoId}/tracks/{trackId}")
  public Response deleteTrack(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId) {
    // TODO optimize querying for the existence of video and track
    if (eas().getVideo(videoId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas().getTrack(trackId).fold(new Option.Match<Track, Response>() {
            @Override
            public Response some(Track t) {
              if (!eas().hasResourceAccess(t))
                return UNAUTHORIZED;
              return eas().deleteTrack(t) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/videos/{videoId}/tracks/{id}")
  public Response getTrack(@PathParam("videoId") final long videoId, @PathParam("id") final long id) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        if (eas().getVideo(videoId).isSome()) {
          return eas().getTrack(id).fold(new Option.Match<Track, Response>() {
            @Override
            public Response some(Track t) {
              if (!eas().hasResourceAccess(t))
                return UNAUTHORIZED;
              return buildOk(TrackDto.toJson.apply(eas(), t));
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
  @Path("/videos/{videoId}/tracks")
  public Response getTracks(@PathParam("videoId") final long videoId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
        final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
        final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
        final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

        if ((datem.isSome() && datem.get().isNone()) || eas().getVideo(videoId).isNone()
                || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                || (tagsOrArray.isSome() && tagsOrArray.get().isNone())) {
          return BAD_REQUEST;
        } else {
          return buildOk(TrackDto.toJson(
                  eas(),
                  offset,
                  eas().getTracks(videoId, offsetm, limitm, datem.bind(Functions.<Option<Date>> identity()),
                          tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                          tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/tracks/{trackId}/annotations")
  public Response postAnnotation(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @FormParam("text") final String text, @FormParam("start") final Double start,
          @FormParam("duration") final Double duration, @FormParam("settings") final String settings,
          @FormParam("label_id") final Long labelId, @FormParam("scale_value_id") final Long scaleValueId,
          @FormParam("tags") final String tags) {
    return run(array(start), new Function0<Response>() {
      @Override
      public Response apply() {
        if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()) {
          final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
          if (tagsMap.isSome() && tagsMap.get().isNone())
            return BAD_REQUEST;

          Resource resource = eas().createResource(
                  tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
          final Annotation a = eas().createAnnotation(trackId, trimToNone(text), start, option(duration),
                  trimToNone(settings), option(labelId), option(scaleValueId), resource);
          return Response.created(annotationLocationUri(videoId, a))
                  .entity(Strings.asStringNull().apply(AnnotationDto.toJson.apply(eas(), a))).build();
        } else {
          return BAD_REQUEST;
        }
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{id}")
  public Response putAnnotation(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("id") final long id, @FormParam("text") final String text, @FormParam("start") final double start,
          @FormParam("duration") final Double duration, @FormParam("settings") final String settings,
          @FormParam("label_id") final Long labelId, @FormParam("scale_value_id") final Long scaleValueId,
          @FormParam("tags") final String tags) {
    return run(array(start), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        // check if video and track exist
        if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()) {
          return eas().getAnnotation(id).fold(new Option.Match<Annotation, Response>() {
            // update annotation
            @Override
            public Response some(Annotation annotation) {
              if (!eas().hasResourceAccess(annotation))
                return UNAUTHORIZED;

              Resource resource = eas().updateResource(annotation, tags);
              final Annotation updated = new AnnotationImpl(id, trackId, trimToNone(text), start, option(duration),
                      trimToNone(settings), option(labelId), option(scaleValueId), resource);
              if (!annotation.equals(updated)) {
                eas().updateAnnotation(updated);
                annotation = updated;
              }
              return Response.ok(Strings.asStringNull().apply(AnnotationDto.toJson.apply(eas(), annotation)))
                      .header(LOCATION, annotationLocationUri(videoId, updated)).build();
            }

            // create a new one
            @Override
            public Response none() {
              Resource resource = eas().createResource(tags);
              final Annotation a = eas().createAnnotation(
                      new AnnotationImpl(id, trackId, trimToNone(text), start, option(duration), trimToNone(settings),
                              option(labelId), option(scaleValueId), resource));
              return Response.created(annotationLocationUri(videoId, a))
                      .entity(Strings.asStringNull().apply(AnnotationDto.toJson.apply(eas(), a))).build();
            }
          });
        } else {
          return BAD_REQUEST;
        }
      }
    });

  }

  @DELETE
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{id}")
  public Response deleteAnnotation(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("id") final long id) {
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas().getAnnotation(id).fold(new Option.Match<Annotation, Response>() {
            @Override
            public Response some(Annotation a) {
              if (!eas().hasResourceAccess(a))
                return UNAUTHORIZED;
              return eas().deleteAnnotation(a) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{id}")
  public Response getAnnotation(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("id") final long id) {
    // TODO optimize querying for the existence of video and track
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas().getAnnotation(id).fold(new Option.Match<Annotation, Response>() {
            @Override
            public Response some(Annotation a) {
              if (!eas().hasResourceAccess(a))
                return UNAUTHORIZED;
              return buildOk(AnnotationDto.toJson.apply(eas(), a));
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
  @Path("/videos/{videoId}/tracks/{trackId}/annotations")
  public Response getAnnotations(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("start") final double start, @QueryParam("end") final double end,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        if (eas().getVideo(videoId).isSome()) {
          final Option<Double> startm = start > 0 ? some(start) : Option.<Double> none();
          final Option<Double> endm = end > 0 ? some(end) : Option.<Double> none();
          final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
          final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
          final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
          final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
          final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

          if ((datem.isSome() && datem.get().isNone()) || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                  || (tagsOrArray.isSome() && tagsOrArray.get().isNone())) {
            return BAD_REQUEST;
          } else {
            return buildOk(AnnotationDto.toJson(
                    eas(),
                    offset,
                    eas().getAnnotations(trackId, startm, endm, offsetm, limitm,
                            datem.bind(Functions.<Option<Date>> identity()),
                            tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                            tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
          }
        } else {
          return NOT_FOUND;
        }
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales")
  public Response postScaleTemplate(@FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("tags") final String tags) {
    return createScale(Option.<Long> none(), name, description, tags);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales")
  public Response postScale(@PathParam("videoId") final Long videoId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("scale_id") final Long scaleId,
          @FormParam("tags") final String tags) {
    if (scaleId == null)
      return createScale(option(videoId), name, description, tags);

    return run(array(scaleId), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (eas().getScale(scaleId, false).isNone() || eas().getVideo(videoId).isNone()
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        final Scale scale = eas().createScaleFromTemplate(videoId, scaleId, resource);
        return Response.created(scaleLocationUri(scale, true))
                .entity(Strings.asStringNull().apply(ScaleDto.toJson.apply(eas(), scale))).build();
      }
    });
  }

  private Response createScale(final Option<Long> videoId, final String name, final String description,
          final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        final Scale scale = eas().createScale(videoId, name, trimToNone(description), resource);
        return Response.created(scaleLocationUri(scale, videoId.isSome()))
                .entity(Strings.asStringNull().apply(ScaleDto.toJson.apply(eas(), scale))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales/{scaleId}")
  public Response putScale(@PathParam("scaleId") final long id, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("tags") final String tags) {
    return updateScale(Option.<Long> none(), id, name, description, tags);
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales/{scaleId}")
  public Response putScale(@PathParam("videoId") final Long videoId, @PathParam("scaleId") final long id,
          @FormParam("name") final String name, @FormParam("description") final String description,
          @FormParam("tags") final String tags) {
    return updateScale(option(videoId), id, name, description, tags);
  }

  private Response updateScale(final Option<Long> videoId, final long id, final String name, final String description,
          final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        return eas().getScale(id, false).fold(new Option.Match<Scale, Response>() {
          @Override
          public Response some(Scale scale) {
            if (!eas().hasResourceAccess(scale))
              return UNAUTHORIZED;
            Resource resource = eas().updateResource(scale, tags);
            final Scale updated = new ScaleImpl(id, videoId, name, trimToNone(description), resource);
            if (!scale.equals(updated)) {
              eas().updateScale(updated);
              scale = updated;
            }
            return Response.ok(Strings.asStringNull().apply(ScaleDto.toJson.apply(eas(), scale)))
                    .header(LOCATION, scaleLocationUri(scale, videoId.isSome())).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(tags);
            final Scale scale = eas().createScale(videoId, name, trimToNone(description), resource);

            return Response.created(scaleLocationUri(scale, videoId.isSome()))
                    .entity(Strings.asStringNull().apply(ScaleDto.toJson.apply(eas(), scale))).build();
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales/{scaleId}")
  public Response getScale(@PathParam("scaleId") final long id) {
    return getScaleResponse(Option.<Long> none(), id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales/{scaleId}")
  public Response getScale(@PathParam("videoId") final Long videoId, @PathParam("scaleId") final long id) {
    return getScaleResponse(option(videoId), id);
  }

  private Response getScaleResponse(final Option<Long> videoId, final long id) {
    if (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getScale(id, false).fold(new Option.Match<Scale, Response>() {
          @Override
          public Response some(Scale s) {
            if (!eas().hasResourceAccess(s))
              return UNAUTHORIZED;
            return buildOk(ScaleDto.toJson.apply(eas(), s));
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
  @Path("/videos/{videoId}/scales")
  public Response getScales(@PathParam("videoId") final Long videoId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return getScalesResponse(option(videoId), limit, offset, date, tagsAnd, tagsOr);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales")
  public Response getScales(@QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return getScalesResponse(Option.<Long> none(), limit, offset, date, tagsAnd, tagsOr);
  }

  private Response getScalesResponse(final Option<Long> videoId, final int limit, final int offset, final String date,
          final String tagsAnd, final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
        final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
        final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
        final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

        if (datem.isSome() && datem.get().isNone() || (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                || (tagsOrArray.isSome() && tagsOrArray.get().isNone())) {
          return BAD_REQUEST;
        } else {
          return buildOk(ScaleDto.toJson(
                  eas(),
                  offset,
                  eas().getScales(videoId, offsetm, limitm, datem.bind(Functions.<Option<Date>> identity()),
                          tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                          tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
        }
      }
    });
  }

  @DELETE
  @Path("/scales/{scaleId}")
  public Response deleteScale(@PathParam("scaleId") final long id) {
    return deleteScaleResponse(Option.<Long> none(), id);
  }

  @DELETE
  @Path("/videos/{videoId}/scales/{scaleId}")
  public Response deleteScale(@PathParam("videoId") final Long videoId, @PathParam("scaleId") final long id) {
    return deleteScaleResponse(option(videoId), id);
  }

  private Response deleteScaleResponse(final Option<Long> videoId, final long id) {
    if (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
      return BAD_REQUEST;
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getScale(id, false).fold(new Option.Match<Scale, Response>() {
          @Override
          public Response some(Scale s) {
            if (!eas().hasResourceAccess(s))
              return UNAUTHORIZED;
            return eas().deleteScale(s) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/scales/{scaleId}/scalevalues")
  public Response postScaleValue(@PathParam("scaleId") final long scaleId, @FormParam("name") final String name,
          @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("tags") final String tags) {
    return postScaleValueResponse(Option.<Long> none(), scaleId, name, value, order, tags);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales/{scaleId}/scalevalues")
  public Response postScaleValue(@PathParam("videoId") final Long videoId, @PathParam("scaleId") final long scaleId,
          @FormParam("name") final String name, @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("tags") final String tags) {
    return postScaleValueResponse(option(videoId), scaleId, name, value, order, tags);
  }

  private Response postScaleValueResponse(final Option<Long> videoId, final long scaleId, final String name,
          final double value, final int order, final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone()
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        final ScaleValue scaleValue = eas().createScaleValue(scaleId, name, value, order, resource);

        return Response.created(scaleValueLocationUri(scaleValue, videoId))
                .entity(Strings.asStringNull().apply(ScaleValueDto.toJson.apply(eas(), scaleValue))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response putScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id,
          @FormParam("name") final String name, @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("tags") final String tags) {
    return putScaleValueResponse(Option.<Long> none(), scaleId, id, name, value, order, tags);
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response putScaleValue(@PathParam("videoId") final Long videoId, @PathParam("scaleId") final long scaleId,
          @PathParam("scaleValueId") final long id, @FormParam("name") final String name,
          @DefaultValue("0") @FormParam("value") final double value,
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("tags") final String tags) {
    return putScaleValueResponse(option(videoId), scaleId, id, name, value, order, tags);
  }

  private Response putScaleValueResponse(final Option<Long> videoId, final long scaleId, final long id,
          final String name, final double value, final int order, final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone()
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        return eas().getScaleValue(id).fold(new Option.Match<ScaleValue, Response>() {
          @Override
          public Response some(ScaleValue s) {
            if (!eas().hasResourceAccess(s))
              return UNAUTHORIZED;
            Resource resource = eas().updateResource(s, tags);
            final ScaleValue updated = new ScaleValueImpl(id, scaleId, name, value, order, resource);
            if (!s.equals(updated)) {
              eas().updateScaleValue(updated);
              s = updated;
            }
            return Response.ok(Strings.asStringNull().apply(ScaleValueDto.toJson.apply(eas(), s)))
                    .header(LOCATION, scaleValueLocationUri(s, videoId)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(tags);
            final ScaleValue scaleValue = eas().createScaleValue(scaleId, name, value, order, resource);

            return Response.created(scaleValueLocationUri(scaleValue, videoId))
                    .entity(Strings.asStringNull().apply(ScaleValueDto.toJson.apply(eas(), scaleValue))).build();
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response getScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id) {
    return getScaleValueResponse(Option.<Long> none(), scaleId, id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response getScaleValue(@PathParam("videoId") final long videoId, @PathParam("scaleId") final long scaleId,
          @PathParam("scaleValueId") final long id) {
    return getScaleValueResponse(option(videoId), scaleId, id);
  }

  private Response getScaleValueResponse(final Option<Long> videoId, final long scaleId, final long id) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getScaleValue(id).fold(new Option.Match<ScaleValue, Response>() {
          @Override
          public Response some(ScaleValue s) {
            if (!eas().hasResourceAccess(s))
              return UNAUTHORIZED;
            return buildOk(ScaleValueDto.toJson.apply(eas(), s));
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
  @Path("/scales/{scaleId}/scalevalues")
  public Response getScaleValues(@PathParam("scaleId") final long scaleId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return getScaleValuesResponse(Option.<Long> none(), scaleId, limit, offset, date, tagsAnd, tagsOr);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/scales/{scaleId}/scalevalues")
  public Response getScaleValues(@PathParam("videoId") final long videoId, @PathParam("scaleId") final long scaleId,
          @QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return getScaleValuesResponse(option(videoId), scaleId, limit, offset, date, tagsAnd, tagsOr);
  }

  private Response getScaleValuesResponse(final Option<Long> videoId, final long scaleId, final int limit,
          final int offset, final String date, final String tagsAnd, final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
        final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
        final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
        final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone()
                || (datem.isSome() && datem.get().isNone()) || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                || (tagsOrArray.isSome() && tagsOrArray.get().isNone()))
          return BAD_REQUEST;

        return buildOk(ScaleValueDto.toJson(
                eas(),
                offset,
                eas().getScaleValues(scaleId, offsetm, limitm, datem.bind(Functions.<Option<Date>> identity()),
                        tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                        tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
      }
    });
  }

  @DELETE
  @Path("/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response deleteScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id) {
    return deleteScaleValueResponse(Option.<Long> none(), scaleId, id);
  }

  @DELETE
  @Path("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response deleteScaleValue(@PathParam("videoId") final long videoId, @PathParam("scaleId") final long scaleId,
          @PathParam("scaleValueId") final long id) {
    return deleteScaleValueResponse(option(videoId), scaleId, id);
  }

  private Response deleteScaleValueResponse(final Option<Long> videoId, final long scaleId, final long id) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getScaleValue(id).fold(new Option.Match<ScaleValue, Response>() {
          @Override
          public Response some(ScaleValue s) {
            if (!eas().hasResourceAccess(s))
              return UNAUTHORIZED;
            return eas().deleteScaleValue(s) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/categories")
  public Response postCategoryTemplate(@FormParam("name") final String name,
          @FormParam("description") final String description,
          @DefaultValue("true") @FormParam("has_duration") final boolean hasDuration,
          @FormParam("scale_id") final Long scaleId, @FormParam("settings") final String settings,
          @DefaultValue("0") @FormParam("access") final Integer access, @FormParam("tags") final String tags) {
    return postCategoryResponse(Option.<Long> none(), name, description, hasDuration, scaleId, settings, access, tags);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories")
  public Response postCategory(@PathParam("videoId") final long videoId, @FormParam("name") final String name,
          @FormParam("description") final String description,
          @DefaultValue("true") @FormParam("has_duration") final boolean hasDuration,
          @FormParam("scale_id") final Long scaleId, @FormParam("settings") final String settings,
          @FormParam("category_id") final Long id, @DefaultValue("0") @FormParam("access") final Integer access,
          @FormParam("tags") final String tags) {
    if (id == null)
      return postCategoryResponse(option(videoId), name, description, hasDuration, scaleId, settings, access, tags);

    return run(array(id), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (eas().getVideo(videoId).isNone() || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()),
                access);
        Option<Category> categoryFromTemplate = eas().createCategoryFromTemplate(videoId, id, resource);
        return categoryFromTemplate.fold(new Option.Match<Category, Response>() {

          @Override
          public Response some(Category c) {
            return Response.created(categoryLocationUri(c, true))
                    .entity(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas(), c))).build();
          }

          @Override
          public Response none() {
            return BAD_REQUEST;
          }

        });
      }
    });
  }

  private Response postCategoryResponse(final Option<Long> videoId, final String name, final String description,
          final boolean hasDuration, final Long scaleId, final String settings, final Integer access,
          final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()),
                access);
        final Category category = eas().createCategory(videoId, option(scaleId), name, trimToNone(description),
                hasDuration, trimToNone(settings), resource);

        return Response.created(categoryLocationUri(category, videoId.isSome()))
                .entity(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas(), category))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/categories/{categoryId}")
  public Response putCategory(@PathParam("categoryId") final long id, @FormParam("name") final String name,
          @FormParam("description") final String description,
          @DefaultValue("true") @FormParam("has_duration") final boolean hasDuration,
          @FormParam("scale_id") final Long scaleId, @FormParam("settings") final String settings,
          @FormParam("tags") final String tags) {
    return putCategoryResponse(Option.<Long> none(), id, name, description, hasDuration, option(scaleId), settings,
            tags);
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories/{categoryId}")
  public Response putCategory(@PathParam("videoId") final long videoId, @PathParam("categoryId") final long id,
          @FormParam("name") final String name, @FormParam("description") final String description,
          @DefaultValue("true") @FormParam("has_duration") final boolean hasDuration,
          @FormParam("scale_id") final Long scaleId, @FormParam("settings") final String settings,
          @FormParam("tags") final String tags) {
    return putCategoryResponse(option(videoId), id, name, description, hasDuration, option(scaleId), settings, tags);
  }

  private Response putCategoryResponse(final Option<Long> videoId, final long id, final String name,
          final String description, final boolean hasDuration, final Option<Long> scaleId, final String settings,
          final String tags) {
    return run(array(name), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        return eas().getCategory(id, false).fold(new Option.Match<Category, Response>() {
          @Override
          public Response some(Category c) {
            if (!eas().hasResourceAccess(c))
              return UNAUTHORIZED;
            Resource resource = eas().updateResource(c, tags);
            final Category updated = new CategoryImpl(id, videoId, scaleId, name, trimToNone(description), hasDuration,
                    trimToNone(settings), resource);
            if (!c.equals(updated)) {
              eas().updateCategory(updated);
              c = updated;
            }
            return Response.ok(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas(), c)))
                    .header(LOCATION, categoryLocationUri(c, videoId.isSome())).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(tags);
            final Category category = eas().createCategory(videoId, scaleId, name, trimToNone(description),
                    hasDuration, trimToNone(settings), resource);

            return Response.created(categoryLocationUri(category, videoId.isSome()))
                    .entity(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas(), category))).build();
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/categories/{categoryId}")
  public Response getCategory(@PathParam("categoryId") final long id) {
    return getCategoryResponse(Option.<Long> none(), id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories/{categoryId}")
  public Response getCategory(@PathParam("videoId") final long videoId, @PathParam("categoryId") final long id) {
    return getCategoryResponse(some(videoId), id);
  }

  private Response getCategoryResponse(final Option<Long> videoId, final long id) {
    if (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getCategory(id, false).fold(new Option.Match<Category, Response>() {
          @Override
          public Response some(Category c) {
            if (!eas().hasResourceAccess(c))
              return UNAUTHORIZED;
            return buildOk(CategoryDto.toJson.apply(eas(), c));
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
  @Path("/categories")
  public Response getCategories(@QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return getCategoriesResponse(Option.<Long> none(), limit, offset, date, tagsAnd, tagsOr);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories")
  public Response getCategories(@PathParam("videoId") final long videoId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return getCategoriesResponse(some(videoId), limit, offset, date, tagsAnd, tagsOr);
  }

  private Response getCategoriesResponse(final Option<Long> videoId, final int limit, final int offset,
          final String date, final String tagsAnd, final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
        final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
        final Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
        final Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

        if (datem.isSome() && datem.get().isNone() || (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                || (tagsOrArray.isSome() && tagsOrArray.get().isNone())) {
          return BAD_REQUEST;
        } else {
          return buildOk(CategoryDto.toJson(
                  eas(),
                  offset,
                  eas().getCategories(videoId, offsetm, limitm, datem.bind(Functions.<Option<Date>> identity()),
                          tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                          tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
        }
      }
    });
  }

  @DELETE
  @Path("/categories/{categoryId}")
  public Response deleteCategory(@PathParam("categoryId") final long categoryId) {
    return deleteCategoryResponse(Option.<Long> none(), categoryId);
  }

  @DELETE
  @Path("/videos/{videoId}/categories/{categoryId}")
  public Response deleteCategory(@PathParam("videoId") final long videoId,
          @PathParam("categoryId") final long categoryId) {
    return deleteCategoryResponse(some(videoId), categoryId);
  }

  private Response deleteCategoryResponse(final Option<Long> videoId, final long categoryId) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getCategory(categoryId, false).fold(new Option.Match<Category, Response>() {
          @Override
          public Response some(Category c) {
            if (!eas().hasResourceAccess(c))
              return UNAUTHORIZED;
            return eas().deleteCategory(c) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/categories/{categoryId}/labels")
  public Response postLabel(@PathParam("categoryId") final long categoryId, @FormParam("value") final String value,
          @FormParam("abbreviation") final String abbreviation, @FormParam("description") final String description,
          @FormParam("settings") final String settings, @FormParam("tags") final String tags) {
    return postLabelResponse(Option.<Long> none(), categoryId, value, abbreviation, description, settings, tags);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories/{categoryId}/labels")
  public Response postLabel(@PathParam("videoId") final Long videoId, @PathParam("categoryId") final long categoryId,
          @FormParam("value") final String value, @FormParam("abbreviation") final String abbreviation,
          @FormParam("description") final String description, @FormParam("settings") final String settings,
          @FormParam("tags") final String tags) {
    return postLabelResponse(option(videoId), categoryId, value, abbreviation, description, settings, tags);
  }

  private Response postLabelResponse(final Option<Long> videoId, final long categoryId, final String value,
          final String abbreviation, final String description, final String settings, final String tags) {
    return run(array(value, abbreviation), new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || eas().getCategory(categoryId, false).isNone() || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
        final Label label = eas().createLabel(categoryId, value, abbreviation, trimToNone(description),
                trimToNone(settings), resource);

        return Response.created(labelLocationUri(label, videoId))
                .entity(Strings.asStringNull().apply(LabelDto.toJson.apply(eas(), label))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/categories/{categoryId}/labels/{labelId}")
  public Response putLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id,
          @FormParam("value") final String value, @FormParam("abbreviation") final String abbreviation,
          @FormParam("description") final String description, @FormParam("settings") final String settings,
          @FormParam("tags") final String tags) {
    return putLabelResponse(Option.<Long> none(), categoryId, id, value, abbreviation, description, settings, tags);
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories/{categoryId}/labels/{labelId}")
  public Response putLabel(@PathParam("videoId") final Long videoId, @PathParam("categoryId") final long categoryId,
          @PathParam("labelId") final long id, @FormParam("value") final String value,
          @FormParam("abbreviation") final String abbreviation, @FormParam("description") final String description,
          @FormParam("settings") final String settings, @FormParam("tags") final String tags) {
    return putLabelResponse(option(videoId), categoryId, id, value, abbreviation, description, settings, tags);
  }

  private Response putLabelResponse(final Option<Long> videoId, final long categoryId, final long id,
          final String value, final String abbreviation, final String description, final String settings,
          final String tags) {
    return run(array(value, abbreviation), new Function0<Response>() {
      @Override
      public Response apply() {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || eas().getCategory(categoryId, false).isNone() || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

        return eas().getLabel(id, false).fold(new Option.Match<Label, Response>() {
          @Override
          public Response some(Label l) {
            if (!eas().hasResourceAccess(l))
              return UNAUTHORIZED;
            Resource resource = eas().updateResource(l, tags);
            final Label updated = new LabelImpl(id, categoryId, value, abbreviation, trimToNone(description),
                    trimToNone(settings), resource);
            if (!l.equals(updated)) {
              eas().updateLabel(updated);
              l = updated;
            }
            return Response.ok(Strings.asStringNull().apply(LabelDto.toJson.apply(eas(), l)))
                    .header(LOCATION, labelLocationUri(l, videoId)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(tags);
            final Label label = eas().createLabel(categoryId, value, abbreviation, trimToNone(description),
                    trimToNone(settings), resource);

            return Response.created(labelLocationUri(label, videoId))
                    .entity(Strings.asStringNull().apply(LabelDto.toJson.apply(eas(), label))).build();
          }
        });
      }
    });
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/categories/{categoryId}/labels/{labelId}")
  public Response getLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id) {
    return getLabelResponse(Option.<Long> none(), categoryId, id);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories/{categoryId}/labels/{labelId}")
  public Response getLabel(@PathParam("videoId") final long videoId, @PathParam("categoryId") final long categoryId,
          @PathParam("labelId") final long id) {
    return getLabelResponse(some(videoId), categoryId, id);
  }

  private Response getLabelResponse(final Option<Long> videoId, final long categoryId, final long id) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getLabel(id, false).fold(new Option.Match<Label, Response>() {
          @Override
          public Response some(Label l) {
            if (!eas().hasResourceAccess(l))
              return UNAUTHORIZED;
            return buildOk(LabelDto.toJson.apply(eas(), l));
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
  @Path("/categories/{categoryId}/labels")
  public Response getLabels(@PathParam("categoryId") final long categoryId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    return getLabelsResponse(Option.<Long> none(), categoryId, limit, offset, date, tagsAnd, tagsOr);
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/categories/{categoryId}/labels")
  public Response getLabels(@PathParam("videoId") final long videoId, @PathParam("categoryId") final long categoryId,
          @QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr) {
    return getLabelsResponse(some(videoId), categoryId, limit, offset, date, tagsAnd, tagsOr);
  }

  private Response getLabelsResponse(final Option<Long> videoId, final long categoryId, final int limit,
          final int offset, final String date, final String tagsAnd, final String tagsOr) {
    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
        final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
        Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
        Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || eas().getCategory(categoryId, false).isNone() || (datem.isSome() && datem.get().isNone())
                || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                || (tagsOrArray.isSome() && tagsOrArray.get().isNone()))
          return BAD_REQUEST;

        return buildOk(LabelDto.toJson(
                eas(),
                offset,
                eas().getLabels(categoryId, offsetm, limitm, datem.bind(Functions.<Option<Date>> identity()),
                        tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                        tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
      }
    });
  }

  @DELETE
  @Path("/categories/{categoryId}/labels/{labelId}")
  public Response deleteLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id) {
    return deleteLabelResponse(Option.<Long> none(), categoryId, id);
  }

  @DELETE
  @Path("/videos/{videoId}/categories/{categoryId}/labels/{labelId}")
  public Response deleteLabel(@PathParam("videoId") final long videoId, @PathParam("categoryId") final long categoryId,
          @PathParam("labelId") final long id) {
    return deleteLabelResponse(some(videoId), categoryId, id);
  }

  private Response deleteLabelResponse(final Option<Long> videoId, final long categoryId, final long id) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, new Function0<Response>() {
      @Override
      public Response apply() {
        return eas().getLabel(id, false).fold(new Option.Match<Label, Response>() {
          @Override
          public Response some(Label l) {
            if (!eas().hasResourceAccess(l))
              return UNAUTHORIZED;
            return eas().deleteLabel(l) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments")
  public Response postComment(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @FormParam("text") final String text,
          @FormParam("tags") final String tags) {
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()
            && eas().getAnnotation(annotationId).isSome()) {
      return run(array(text), new Function0<Response>() {
        @Override
        public Response apply() {
          final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
          if (tagsMap.isSome() && tagsMap.get().isNone())
            return BAD_REQUEST;

          Resource resource = eas().createResource(tagsMap.bind(Functions.<Option<Map<String, String>>> identity()));
          final Comment comment = eas().createComment(annotationId, text, resource);

          return Response.created(commentLocationUri(comment, videoId, trackId))
                  .entity(Strings.asStringNull().apply(CommentDto.toJson.apply(eas(), comment))).build();
        }
      });
    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}")
  public Response putComment(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("commentId") final long commentId,
          @FormParam("text") final String text, @FormParam("tags") final String tags) {
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()
            && eas().getAnnotation(annotationId).isSome()) {
      return run(array(text), new Function0<Response>() {
        @Override
        public Response apply() {
          final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
          if (tagsMap.isSome() && tagsMap.get().isNone())
            return BAD_REQUEST;

          final Option<Map<String, String>> tags = tagsMap.bind(Functions.<Option<Map<String, String>>> identity());

          return eas().getComment(commentId).fold(new Option.Match<Comment, Response>() {
            @Override
            public Response some(Comment c) {
              if (!eas().hasResourceAccess(c))
                return UNAUTHORIZED;
              Resource resource = eas().updateResource(c, tags);
              final Comment updated = new CommentImpl(commentId, annotationId, text, resource);
              if (!c.equals(updated)) {
                eas().updateComment(updated);
                c = updated;
              }
              return Response.ok(Strings.asStringNull().apply(CommentDto.toJson.apply(eas(), c)))
                      .header(LOCATION, commentLocationUri(c, videoId, trackId)).build();
            }

            @Override
            public Response none() {
              Resource resource = eas().createResource(tags);
              final Comment comment = eas().createComment(annotationId, text, resource);

              return Response.created(commentLocationUri(comment, videoId, trackId))
                      .entity(Strings.asStringNull().apply(CommentDto.toJson.apply(eas(), comment))).build();
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
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{id}")
  public Response deleteComment(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("id") final long commentId) {
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()
            && eas().getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas().getComment(commentId).fold(new Option.Match<Comment, Response>() {
            @Override
            public Response some(Comment c) {
              if (!eas().hasResourceAccess(c))
                return UNAUTHORIZED;
              return eas().deleteComment(c) ? NO_CONTENT : NOT_FOUND;
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
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{id}")
  public Response getComment(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @PathParam("id") final long id) {
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()
            && eas().getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          return eas().getComment(id).fold(new Option.Match<Comment, Response>() {
            @Override
            public Response some(Comment c) {
              if (!eas().hasResourceAccess(c))
                return UNAUTHORIZED;
              return buildOk(CommentDto.toJson.apply(eas(), c));
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
  @Path("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments")
  public Response getComments(@PathParam("videoId") final long videoId, @PathParam("trackId") final long trackId,
          @PathParam("annotationId") final long annotationId, @QueryParam("limit") final int limit,
          @QueryParam("offset") final int offset, @QueryParam("since") final String date,
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr) {
    if (eas().getVideo(videoId).isSome() && eas().getTrack(trackId).isSome()
            && eas().getAnnotation(annotationId).isSome()) {
      return run(nil, new Function0<Response>() {
        @Override
        public Response apply() {
          final Option<Integer> offsetm = offset > 0 ? some(offset) : Option.<Integer> none();
          final Option<Integer> limitm = limit > 0 ? some(limit) : Option.<Integer> none();
          final Option<Option<Date>> datem = trimToNone(date).map(parseDate);
          Option<Option<Map<String, String>>> tagsAndArray = trimToNone(tagsAnd).map(parseToJsonMap);
          Option<Option<Map<String, String>>> tagsOrArray = trimToNone(tagsOr).map(parseToJsonMap);

          if ((datem.isSome() && datem.get().isNone()) || (tagsAndArray.isSome() && tagsAndArray.get().isNone())
                  || (tagsOrArray.isSome() && tagsOrArray.get().isNone()))
            return BAD_REQUEST;

          return buildOk(CommentDto.toJson(
                  eas(),
                  offset,
                  eas().getComments(annotationId, offsetm, limitm, datem.bind(Functions.<Option<Date>> identity()),
                          tagsAndArray.bind(Functions.<Option<Map<String, String>>> identity()),
                          tagsOrArray.bind(Functions.<Option<Map<String, String>>> identity()))));
        }
      });
    } else {
      // track, video and/or annotation does not exist
      return BAD_REQUEST;
    }
  }

  @GET
  @Path("/export.csv")
  public Response getExportStatistics() throws IOException {
    ResponseBuilder response = Response.ok(new StreamingOutput() {
      public void write(OutputStream os) throws IOException, WebApplicationException {
        CSVWriter writer = null;
        try {
          writer = new CSVWriter(new OutputStreamWriter(os));
          writeExport(writer);
          writer.close();
        } finally {
          IOUtils.closeQuietly(os);
          IoSupport.closeQuietly(writer);
        }
      }
    });
    response.header("Content-Type", "text/csv");
    response.header("Content-Disposition", "attachment; filename=export.csv");
    return response.build();
  }

  private void writeExport(CSVWriter writer) {
    // Write headers
    List<String> header = new ArrayList<String>();
    header.add("ID");
    header.add("Creation date");
    header.add("Last update");
    header.add("Author nickname");
    header.add("Author mail");
    header.add("Track name");
    header.add("Leadin");
    header.add("Leadout");
    header.add("Duration");
    header.add("Text");
    header.add("Category name");
    header.add("Label name");
    header.add("Label abbreviation");
    header.add("Scale name");
    header.add("Scale value name");
    header.add("Scale value value");
    writer.writeNext(header.toArray(new String[header.size()]));

    for (Video video : eas().getVideos()) {
      List<Track> tracks = eas().getTracks(video.getId(), Option.<Integer> none(), Option.<Integer> none(),
              Option.<Date> none(), Option.<Map<String, String>> none(), Option.<Map<String, String>> none());
      for (Track track : tracks) {
        List<Annotation> annotations = eas().getAnnotations(track.getId(), none(Double.class), none(Double.class),
                none(Integer.class), none(Integer.class), none(Date.class), Option.<Map<String, String>> none(),
                Option.<Map<String, String>> none());
        for (Annotation annotation : annotations) {
          List<String> line = new ArrayList<String>();

          line.add(Long.toString(annotation.getId()));
          line.add(annotation.getCreatedAt().map(AbstractResourceDto.getDateAsUtc).getOrElse(""));
          line.add(annotation.getUpdatedAt().map(AbstractResourceDto.getDateAsUtc).getOrElse(""));
          line.add(annotation.getCreatedBy().map(AbstractResourceDto.getUserNickname.curry(eas())).getOrElse(""));
          line.add(option(annotation.getCreatedBy().map(getUserEmail.curry(eas())).getOrElse("")).getOrElse(""));
          line.add(track.getName());

          double start = annotation.getStart(); // start, stop, duration
          line.add(toVideoTimeString(start));
          double end = start;
          if (annotation.getDuration().isSome()) {
            end += annotation.getDuration().get();
            line.add(toVideoTimeString(end));
            line.add(toVideoTimeString(annotation.getDuration().get()));
          } else {
            line.add(toVideoTimeString(end));
            line.add("");
          }
          line.add(annotation.getText().getOrElse(""));

          if (annotation.getLabelId().isSome()) {
            Option<Label> label = eas().getLabel(annotation.getLabelId().get(), false);
            line.add(label.map(getCategoryName.curry(eas())).getOrElse(""));
            line.add(label.map(getLabelName).getOrElse(""));
            line.add(label.map(getLabelAbbreviation).getOrElse(""));
          } else {
            line.add("");
            line.add("");
            line.add("");
          }

          if (annotation.getScaleValueId().isSome()) {
            Option<ScaleValue> scaleValue = eas().getScaleValue(annotation.getScaleValueId().get());
            line.add(scaleValue.map(getScaleName.curry(eas())).getOrElse(""));
            line.add(scaleValue.map(getScaleValueName).getOrElse(""));
            line.add(scaleValue.map(getScaleValue).getOrElse(""));
          } else {
            line.add("");
            line.add("");
            line.add("");
          }

          writer.writeNext(line.toArray(new String[line.size()]));
        }
      }
    }
  }

  @DELETE
  @Path("/reset")
  public Response reset() {
    eas().clearDatabase();
    return Response.noContent().build();
  }

  // --

  public static final Response NOT_FOUND = Response.status(Response.Status.NOT_FOUND).build();
  public static final Response NOT_MODIFIED = Response.status(Response.Status.NOT_MODIFIED).build();
  public static final Response UNAUTHORIZED = Response.status(Response.Status.UNAUTHORIZED).build();
  public static final Response BAD_REQUEST = Response.status(Response.Status.BAD_REQUEST).build();
  public static final Response CONFLICT = Response.status(Response.Status.CONFLICT).build();
  public static final Response SERVER_ERROR = Response.serverError().build();
  public static final Response NO_CONTENT = Response.noContent().build();
  public static final Response OK = Response.ok().build();

  public static final Object[] nil = new Object[0];

  /** Run <code>f</code> doing common exception transformation. */
  public static Response run(Object[] mandatoryParams, Function0<Response> f) {
    for (Object a : mandatoryParams) {
      if (a == null || StringUtils.isEmpty(a.toString()))
        return BAD_REQUEST;
    }
    try {
      return f.apply();
    } catch (ExtendedAnnotationException e) {
      switch (e.getCauseCode()) {
        case UNAUTHORIZED:
          return UNAUTHORIZED;
        case DUPLICATE:
          return CONFLICT;
        case SERVER_ERROR:
          return SERVER_ERROR;
        case NOT_FOUND:
          return NOT_FOUND;
        default:
          return SERVER_ERROR;
      }
    }
  }

  private URI userLocationUri(User u) {
    return uri(getEndpointBaseUrl(), "users", u.getId());
  }

  private URI videoLocationUri(Video v) {
    return uri(getEndpointBaseUrl(), "videos", v.getId());
  }

  private URI trackLocationUri(Track t) {
    return uri(getEndpointBaseUrl(), "videos", t.getVideoId(), "tracks", t.getId());
  }

  private URI annotationLocationUri(long videoId, Annotation a) {
    return uri(getEndpointBaseUrl(), "videos", videoId, "tracks", a.getTrackId(), "annotations", a.getId());
  }

  private URI scaleLocationUri(Scale s, boolean hasVideo) {
    if (hasVideo) {
      return uri(getEndpointBaseUrl(), "videos", s.getVideoId(), "scales", s.getId());
    } else {
      return uri(getEndpointBaseUrl(), "scales", s.getId());
    }
  }

  private URI scaleValueLocationUri(ScaleValue s, Option<Long> videoId) {
    if (videoId.isSome()) {
      return uri(getEndpointBaseUrl(), "videos", videoId.get(), "scales", s.getScaleId(), "scalevalues", s.getId());
    } else {
      return uri(getEndpointBaseUrl(), "scales", s.getScaleId(), "scalevalues", s.getId());
    }
  }

  private URI categoryLocationUri(Category c, boolean hasVideo) {
    if (hasVideo && c.getVideoId().isSome()) {
      return uri(getEndpointBaseUrl(), "videos", c.getVideoId().get(), "categories", c.getId());
    } else {
      return uri(getEndpointBaseUrl(), "categories", c.getId());
    }
  }

  private URI labelLocationUri(Label l, Option<Long> videoId) {
    if (videoId.isSome()) {
      return uri(getEndpointBaseUrl(), "videos", videoId.get(), "categories", l.getCategoryId(), "labels", l.getId());
    } else {
      return uri(getEndpointBaseUrl(), "categories", l.getCategoryId(), "labels", l.getId());
    }
  }

  private URI commentLocationUri(Comment c, long videoId, long trackId) {
    return uri(getEndpointBaseUrl(), "videos", videoId, "tracks", trackId, "annotations", c.getAnnotationId(),
            "comments", c.getId());
  }

  private static Response notFoundToBadRequest(ExtendedAnnotationException e) throws ExtendedAnnotationException {
    if (e.getCauseCode() == ExtendedAnnotationException.Cause.NOT_FOUND) {
      return BAD_REQUEST;
    } else {
      throw e;
    }
  }

  public static final Function<String, Option<Date>> parseDate = new Function<String, Option<Date>>() {
    @Override
    public Option<Date> apply(String s) {
      try {
        return some(ISODateTimeFormat.dateTimeParser().parseDateTime(s).toDate());
      } catch (IllegalArgumentException e) {
        return none();
      }
    }
  };

  public static final String toVideoTimeString(double seconds) {
    long millis = new Double(seconds * 1000).longValue();
    SimpleDateFormat sdf = new SimpleDateFormat("HH:mm:ss", Locale.getDefault());
    return sdf.format(new Date(millis - TimeZone.getDefault().getRawOffset()));
  }

  @SuppressWarnings("unchecked")
  public static final Function<String, Option<Map<String, String>>> parseToJsonMap = new Function<String, Option<Map<String, String>>>() {
    @Override
    public Option<Map<String, String>> apply(String s) {
      try {
        return some((Map<String, String>) new JSONParser().parse(s));
      } catch (Exception e) {
        return none();
      }
    }
  };

  public static final Function2<ExtendedAnnotationService, Long, String> getUserEmail = new Function2<ExtendedAnnotationService, Long, String>() {
    @Override
    public String apply(ExtendedAnnotationService s, Long userId) {
      Option<User> user = s.getUser(userId);
      if (user.isNone())
        return null;

      return user.get().getEmail().getOrElse((String) null);
    }
  };

  public static final Function<Label, String> getLabelName = new Function<Label, String>() {
    @Override
    public String apply(Label label) {
      return label.getValue();
    }
  };

  public static final Function2<ExtendedAnnotationService, Label, String> getCategoryName = new Function2<ExtendedAnnotationService, Label, String>() {
    @Override
    public String apply(ExtendedAnnotationService e, Label label) {
      Option<Category> category = e.getCategory(label.getCategoryId(), true);
      if (category.isNone())
        return null;

      return category.get().getName();
    }
  };

  public static final Function<Label, String> getLabelAbbreviation = new Function<Label, String>() {
    @Override
    public String apply(Label label) {
      return label.getAbbreviation();
    }
  };

  public static final Function<ScaleValue, String> getScaleValueName = new Function<ScaleValue, String>() {
    @Override
    public String apply(ScaleValue scaleValue) {
      return scaleValue.getName();
    }
  };

  public static final Function<ScaleValue, String> getScaleValue = new Function<ScaleValue, String>() {
    @Override
    public String apply(ScaleValue scaleValue) {
      return Double.toString(scaleValue.getValue());
    }
  };

  public static final Function2<ExtendedAnnotationService, ScaleValue, String> getScaleName = new Function2<ExtendedAnnotationService, ScaleValue, String>() {
    @Override
    public String apply(ExtendedAnnotationService e, ScaleValue scaleValue) {
      Option<Scale> scale = e.getScale(scaleValue.getScaleId(), true);
      if (scale.isNone())
        return null;

      return scale.get().getName();
    }
  };

}
