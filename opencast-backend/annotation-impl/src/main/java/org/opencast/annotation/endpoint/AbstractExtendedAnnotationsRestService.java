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

import static org.opencast.annotation.endpoint.util.Responses.buildOk;
import static org.opencastproject.util.UrlSupport.uri;
import static org.opencastproject.util.data.Arrays.array;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.Option.some;
import static org.opencastproject.util.data.functions.Strings.trimToNone;

import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.ExtendedAnnotationException;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Label;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.ScaleValue;
import org.opencast.annotation.api.User;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.BadVideoInterfaceRequestException;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceException;
import org.opencast.annotation.api.videointerface.VideoTrack;
import org.opencast.annotation.impl.CategoryImpl;
import org.opencast.annotation.impl.LabelImpl;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.ScaleImpl;
import org.opencast.annotation.impl.ScaleValueImpl;
import org.opencast.annotation.impl.UserImpl;
import org.opencast.annotation.impl.VideoImpl;
import org.opencast.annotation.impl.persistence.CategoryDto;
import org.opencast.annotation.impl.persistence.LabelDto;
import org.opencast.annotation.impl.persistence.ScaleDto;
import org.opencast.annotation.impl.persistence.ScaleValueDto;
import org.opencast.annotation.impl.persistence.UserDto;
import org.opencast.annotation.impl.persistence.VideoDto;
import org.opencast.annotation.impl.videointerface.VideoInterfaceProvider;

import org.opencastproject.security.api.SecurityService;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.functions.Functions;
import org.opencastproject.util.data.functions.Strings;

import org.apache.commons.lang3.StringUtils;
import org.joda.time.format.ISODateTimeFormat;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.util.Date;
import java.util.Map;
import java.util.Objects;

import javax.servlet.http.HttpServletRequest;
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
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

// no @Path annotation here since this class cannot be created by JAX-RS. Put it on implementations.
public abstract class AbstractExtendedAnnotationsRestService {

  private static final Logger logger = LoggerFactory.getLogger(AbstractExtendedAnnotationsRestService.class);

  /** Location header. */
  static final String LOCATION = "Location";

  protected abstract ExtendedAnnotationService getExtendedAnnotationsService();

  protected abstract SecurityService getSecurityService();

  protected abstract VideoInterfaceProvider getVideoInterfaceProvider();

  protected abstract String getEndpointBaseUrl();

  // short hand
  private ExtendedAnnotationService eas() {
    return getExtendedAnnotationsService();
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/annotate")
  // TODO Rename
  public Response initialize(@Context final HttpServletRequest request) {
    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {

        try {
          JSONArray videos = new JSONArray();
          for (VideoTrack track : videoInterface.getTracks()) {
            JSONObject video = new JSONObject();
            video.put("url", track.getUrl().toString());
            video.put("type", track.getType().toString());
            videos.add(video);
          }

          // TODO Pull this into the REST tier as well
          User user = eas().getOrCreateCurrentUser();

          Access access = videoInterface.getAccess();

          JSONObject userJson = UserDto.toJson.apply(eas(), user);
          String role = "user";
          if (access == Access.ADMIN) {
            role = "administrator";
          }
          userJson.put("role", role);

          JSONObject responseObject = new JSONObject();
          responseObject.put("user", userJson);
          responseObject.put("videos", videos);
          responseObject.put("title", Objects.toString(videoInterface.getTitle(), ""));
          responseObject.put("series", videoInterface.getSeries());
          return Response.ok(responseObject.toJSONString()).build();

        } catch (VideoInterfaceException e) {
          throw new UncheckedVideoInterfaceException(e);
        }
      }
    });
  }

  // TODO Do we still need this?
  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/users")
  public Response putUser(@FormParam("user_extid") final String userExtId,
          @FormParam("nickname") final String nickname, @FormParam("email") final String email,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    final Option<String> emailo = trimToNone(email);
    return run(array(userExtId, nickname), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        return eas().getUserByExtId(userExtId).fold(new Option.Match<User, Response>() {
          @Override
          public Response some(User u) {
            if (!hasResourceAccess(u, videoInterface))
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
            // This might have been the first user, which would mean
            // that the resource above has no owner.
            // To fix this, we just recreate it and update the user to persist it.
            resource = eas().createResource(tags);
            u = new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), resource);
            eas().updateUser(u);
            return Response.created(userLocationUri(u))
                    .entity(Strings.asStringNull().apply(UserDto.toJson.apply(eas(), u))).build();
          }
        });
      }
    });
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos")
  public Response postVideos(@FormParam("video_extid") final String videoExtId, @FormParam("tags") final String tags,
          @Context final HttpServletRequest request) {
    return run(array(videoExtId), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        if (eas().getVideoByExtId(videoExtId).isSome())
          return CONFLICT;

        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        Resource resource = eas().createResource(tagsMap.bind(Functions.identity()));
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
          @FormParam("access") final Integer access, @FormParam("tags") final String tags,
          @Context final HttpServletRequest request) {
    return run(array(videoExtId), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if (tagsMap.isSome() && tagsMap.get().isNone())
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        return eas().getVideoByExtId(videoExtId).fold(new Option.Match<Video, Response>() {
          @Override
          public Response some(Video v) {
            if (!hasResourceAccess(v, videoInterface))
              // TODO Unauthorized? Are you sure?
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

  @Path("/videos/{id}")
  public VideoEndpoint video(@PathParam("id") final long id) {
    return new VideoEndpoint(id, this, eas());
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/scales")
  public Response postScaleTemplate(@FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    return createScale(none(), name, description, access, tags, request);
  }

  Response createScale(final Option<Long> videoId, final String name, final String description,
          final Integer access, final String tags, HttpServletRequest request) {
    return run(array(name), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(option(access), tagsMap.bind(Functions.identity()));
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
          @FormParam("description") final String description, @FormParam("tags") final String tags,
          @Context final HttpServletRequest request) {
    return updateScale(none(), id, name, description, tags, request);
  }

  Response updateScale(final Option<Long> videoId, final long id, final String name, final String description,
          final String tags, final HttpServletRequest request) {
    return run(array(name), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        return eas().getScale(id, false).fold(new Option.Match<Scale, Response>() {
          @Override
          public Response some(Scale scale) {
            if (!hasResourceAccess(scale, videoInterface))
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
  public Response getScale(@PathParam("scaleId") final long id, @Context final HttpServletRequest request) {
    return getScaleResponse(none(), id, request);
  }

  Response getScaleResponse(final Option<Long> videoId, final long id, final HttpServletRequest request) {
    if (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getScale(id, false).fold(new Option.Match<Scale, Response>() {
          @Override
          public Response some(Scale s) {
            if (!hasResourceAccess(s, videoInterface))
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
  @Path("/scales")
  public Response getScales(@QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr, @Context final HttpServletRequest request) {
    return getScalesResponse(none(), limit, offset, date, tagsAnd, tagsOr, request);
  }

  Response getScalesResponse(final Option<Long> videoId, final int limit, final int offset, final String date,
          final String tagsAnd, final String tagsOr, HttpServletRequest request) {
    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : none();
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
                  eas().getScales(videoId, offsetm, limitm, datem.bind(Functions.identity()),
                          tagsAndArray.bind(Functions.identity()),
                          tagsOrArray.bind(Functions.identity()))));
        }
      }
    });
  }

  @DELETE
  @Path("/scales/{scaleId}")
  public Response deleteScale(@PathParam("scaleId") final long id, @Context final HttpServletRequest request) {
    return deleteScaleResponse(none(), id, request);
  }

  Response deleteScaleResponse(final Option<Long> videoId, final long id, final HttpServletRequest request) {
    if (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
      return BAD_REQUEST;
    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getScale(id, false).fold(new Option.Match<Scale, Response>() {
          @Override
          public Response some(Scale s) {
            if (!hasResourceAccess(s, videoInterface))
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
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    return postScaleValueResponse(none(), scaleId, name, value, order, access, tags, request);
  }

  Response postScaleValueResponse(final Option<Long> videoId, final long scaleId, final String name,
          final double value, final int order, final Integer access, final String tags, HttpServletRequest request) {
    return run(array(name), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone()
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(option(access), tagsMap.bind(Functions.identity()));
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
          @DefaultValue("0") @FormParam("order") final int order, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    return putScaleValueResponse(none(), scaleId, id, name, value, order, access, tags, request);
  }

  Response putScaleValueResponse(final Option<Long> videoId, final long scaleId, final long id,
          final String name, final double value, final int order, final Integer access, final String tags,
          final HttpServletRequest request) {
    return run(array(name), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone()
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        return eas().getScaleValue(id).fold(new Option.Match<ScaleValue, Response>() {
          @Override
          public Response some(ScaleValue s) {
            if (!hasResourceAccess(s, videoInterface))
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
            Resource resource = eas().createResource(option(access), tags);
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
  public Response getScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id,
          @Context final HttpServletRequest request) {
    return getScaleValueResponse(none(), scaleId, id, request);
  }

  Response getScaleValueResponse(final Option<Long> videoId, final long scaleId, final long id,
          final  HttpServletRequest request) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getScaleValue(id).fold(new Option.Match<ScaleValue, Response>() {
          @Override
          public Response some(ScaleValue s) {
            if (!hasResourceAccess(s, videoInterface))
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
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr,
          @Context final HttpServletRequest request) {
    return getScaleValuesResponse(none(), scaleId, limit, offset, date, tagsAnd, tagsOr, request);
  }

  Response getScaleValuesResponse(final Option<Long> videoId, final long scaleId, final int limit,
          final int offset, final String date, final String tagsAnd, final String tagsOr, HttpServletRequest request) {
    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : none();
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
                eas().getScaleValues(scaleId, offsetm, limitm, datem.bind(Functions.identity()),
                        tagsAndArray.bind(Functions.identity()),
                        tagsOrArray.bind(Functions.identity()))));
      }
    });
  }

  @DELETE
  @Path("/scales/{scaleId}/scalevalues/{scaleValueId}")
  public Response deleteScaleValue(@PathParam("scaleId") final long scaleId, @PathParam("scaleValueId") final long id,
          @Context final  HttpServletRequest request) {
    return deleteScaleValueResponse(none(), scaleId, id, request);
  }

  Response deleteScaleValueResponse(final Option<Long> videoId, final long scaleId, final long id,
          final  HttpServletRequest request) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getScale(scaleId, false).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getScaleValue(id).fold(new Option.Match<ScaleValue, Response>() {
          @Override
          public Response some(ScaleValue s) {
            if (!hasResourceAccess(s, videoInterface))
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
  public Response postCategoryTemplate(@FormParam("series_extid") final String seriesExtId,
          @FormParam("series_category_id") final Long seriesCategoryId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("scale_id") final Long scaleId,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    return postCategoryResponse(none(), none(), none(), name, description, scaleId, settings, access, tags, request);
  }

  Response postCategoryResponse(final Option<String> seriesExtId, final Option<Long> seriesCategoryId,
          final Option<Long> videoId, final String name, final String description, final Long scaleId,
          final String settings, final Integer access, final String tags, final HttpServletRequest request) {
    return run(array(name), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(option(access), tagsMap.bind(Functions.identity()));
        final Category category = eas().createCategory(seriesExtId, seriesCategoryId, videoId, option(scaleId), name,
                trimToNone(description), trimToNone(settings), resource);

        return Response.created(categoryLocationUri(category, videoId.isSome()))
                .entity(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas(), category))).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/categories/{categoryId}")
  public Response putCategory(@PathParam("categoryId") final long id,
          @FormParam("series_extid") final String seriesExtId,
          @FormParam("series_category_id") final Long seriesCategoryId, @FormParam("name") final String name,
          @FormParam("description") final String description, @FormParam("scale_id") final Long scaleId,
          @FormParam("settings") final String settings, @FormParam("access") final Integer access,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    return putCategoryResponse(id, option(seriesExtId), option(seriesCategoryId), none(), name, description,
            option(scaleId), settings, option(access), tags, request);
  }

  Response putCategoryResponse(final long id, final Option<String> seriesExtId, final Option<Long> seriesCategoryId,
          final Option<Long> videoId, final String name, final String description, final Option<Long> scaleId,
          final String settings, final Option<Integer> access, final String tags, final HttpServletRequest request) {
    return run(array(name), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        return eas().getCategory(id, false).fold(new Option.Match<Category, Response>() {
          @Override
          public Response some(Category c) {
            if (!hasResourceAccess(c, videoInterface))
              return UNAUTHORIZED;
            Resource resource = eas().updateResource(c, tags);

            // If we are updating a master series category from a local copy avoid changing the video
            // the master series category belongs to by passing the series' category's video id
            Option<Category> seriesCategory = seriesCategoryId.flatMap(new Function<Long, Option<Category>>() {
              @Override
              public Option<Category> apply(Long seriesCategoryId) {
                return eas().getCategory(seriesCategoryId, false);
              }
            });
            if (seriesCategoryId.isSome() && seriesCategory.isNone()) {
              return BAD_REQUEST;
            }
            Option<Long> seriesCategoryVideoId = seriesCategory.flatMap(new Function<Category, Option<Long>>() {
              @Override
              public Option<Long> apply(Category seriesCategory) {
                return seriesCategory.getVideoId();
              }
            });

            final Category updated = new CategoryImpl(id, seriesExtId, seriesCategoryId,
                    seriesCategoryVideoId.orElse(videoId), scaleId, name, trimToNone(description), trimToNone(settings),
                    new ResourceImpl(access, resource.getCreatedBy(), resource.getUpdatedBy(), resource.getDeletedBy(),
                            resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(),
                            resource.getTags()));
            if (!c.equals(updated)) {
              if (seriesCategoryId.isNone()) {
                eas().updateCategoryAndDeleteOtherSeriesCategories(updated);
              } else {
                eas().updateCategory(updated);
              }
              c = updated;
            }
            return Response.ok(Strings.asStringNull().apply(CategoryDto.toJson.apply(eas(), c)))
                    .header(LOCATION, categoryLocationUri(c, videoId.isSome())).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(tags);
            final Category category = eas().createCategory(seriesExtId, seriesCategoryId, videoId, scaleId, name,
                    trimToNone(description), trimToNone(settings), new ResourceImpl(access, resource.getCreatedBy(),
                            resource.getUpdatedBy(), resource.getDeletedBy(), resource.getCreatedAt(),
                            resource.getUpdatedAt(), resource.getDeletedAt(), resource.getTags()));

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
  public Response getCategory(@PathParam("categoryId") final long id, @Context final HttpServletRequest request) {
    return getCategoryResponse(none(), id, request);
  }

  Response getCategoryResponse(final Option<Long> videoId, final long id, final HttpServletRequest request) {
    if (videoId.isSome() && eas().getVideo(videoId.get()).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getCategory(id, false).fold(new Option.Match<Category, Response>() {
          @Override
          public Response some(Category c) {
            if (!hasResourceAccess(c, videoInterface))
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
  public Response getCategories(@QueryParam("seriesExtId") final String seriesExtId,
          @QueryParam("limit") final int limit, @QueryParam("offset") final int offset,
          @QueryParam("since") final String date, @QueryParam("tags-and") final String tagsAnd,
          @QueryParam("tags-or") final String tagsOr, @Context final HttpServletRequest request) {
    return getCategoriesResponse(seriesExtId, none(), limit, offset, date, tagsAnd, tagsOr, request);
  }

  Response getCategoriesResponse(final String seriesExtId, final Option<Long> videoId, final int limit,
          final int offset, final String date, final String tagsAnd, final String tagsOr, HttpServletRequest request) {
    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<String> seriesExtIdm = trimToNone(seriesExtId);
        final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : none();
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
                  eas().getCategories(seriesExtIdm, videoId, offsetm, limitm, datem.bind(Functions.identity()),
                          tagsAndArray.bind(Functions.identity()), tagsOrArray.bind(Functions.identity()))));
        }
      }
    });
  }

  @DELETE
  @Path("/categories/{categoryId}")
  public Response deleteCategory(@PathParam("categoryId") final long categoryId,
          @Context final HttpServletRequest request) {
    return deleteCategoryResponse(none(), categoryId, request);
  }

  Response deleteCategoryResponse(final Option<Long> videoId, final long categoryId, final HttpServletRequest request) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getCategory(categoryId, false).fold(new Option.Match<Category, Response>() {
          @Override
          public Response some(Category c) {
            if (!hasResourceAccess(c, videoInterface))
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
          @FormParam("access") final Integer access, @FormParam("settings") final String settings,
          @FormParam("tags") final String tags, @Context final HttpServletRequest request) {
    return postLabelResponse(none(), categoryId, value, abbreviation, description, access, settings,
            tags, request);
  }

  Response postLabelResponse(final Option<Long> videoId, final long categoryId, final String value,
          final String abbreviation, final String description, final Integer access, final String settings,
          final String tags, HttpServletRequest request) {
    return run(array(value, abbreviation), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || eas().getCategory(categoryId, false).isNone() || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        Resource resource = eas().createResource(option(access), tagsMap.bind(Functions.identity()));
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
          @FormParam("description") final String description, @FormParam("access") final Integer access,
          @FormParam("settings") final String settings, @FormParam("tags") final String tags,
          @Context final HttpServletRequest request) {
    return putLabelResponse(none(), categoryId, id, value, abbreviation, description, access, settings,
            tags, request);
  }

  Response putLabelResponse(final Option<Long> videoId, final long categoryId, final long id,
          final String value, final String abbreviation, final String description, final Integer access,
          final String settings, final String tags, final HttpServletRequest request) {
    return run(array(value, abbreviation), request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        Option<Option<Map<String, String>>> tagsMap = trimToNone(tags).map(parseToJsonMap);
        if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone())
                || eas().getCategory(categoryId, false).isNone() || (tagsMap.isSome() && tagsMap.get().isNone()))
          return BAD_REQUEST;

        final Option<Map<String, String>> tags = tagsMap.bind(Functions.identity());

        return eas().getLabel(id, false).fold(new Option.Match<Label, Response>() {
          @Override
          public Response some(Label l) {
            if (!hasResourceAccess(l, videoInterface))
              return UNAUTHORIZED;
            Resource resource = eas().updateResource(l, tags);
            final Label updated = new LabelImpl(id, l.getSeriesLabelId(), categoryId, value, abbreviation,
                    trimToNone(description), trimToNone(settings), resource);
            if (!l.equals(updated)) {
              eas().updateLabel(updated);
              l = updated;
            }
            return Response.ok(Strings.asStringNull().apply(LabelDto.toJson.apply(eas(), l)))
                    .header(LOCATION, labelLocationUri(l, videoId)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource(option(access), tags);
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
  public Response getLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id,
          @Context final HttpServletRequest request) {
    return getLabelResponse(none(), categoryId, id, request);
  }

  Response getLabelResponse(final Option<Long> videoId, final long categoryId, final long id,
          final HttpServletRequest request) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getLabel(id, false).fold(new Option.Match<Label, Response>() {
          @Override
          public Response some(Label l) {
            if (!hasResourceAccess(l, videoInterface))
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
          @QueryParam("tags-and") final String tagsAnd, @QueryParam("tags-or") final String tagsOr,
          @Context final HttpServletRequest request) {
    return getLabelsResponse(none(), categoryId, limit, offset, date, tagsAnd, tagsOr, request);
  }

  Response getLabelsResponse(final Option<Long> videoId, final long categoryId, final int limit,
          final int offset, final String date, final String tagsAnd, final String tagsOr, HttpServletRequest request) {
    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        final Option<Integer> offsetm = offset > 0 ? some(offset) : none();
        final Option<Integer> limitm = limit > 0 ? some(limit) : none();
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
                eas().getLabels(categoryId, offsetm, limitm, datem.bind(Functions.identity()),
                        tagsAndArray.bind(Functions.identity()),
                        tagsOrArray.bind(Functions.identity()))));
      }
    });
  }

  @DELETE
  @Path("/categories/{categoryId}/labels/{labelId}")
  public Response deleteLabel(@PathParam("categoryId") final long categoryId, @PathParam("labelId") final long id,
          @Context final HttpServletRequest request) {
    return deleteLabelResponse(none(), categoryId, id, request);
  }

  Response deleteLabelResponse(final Option<Long> videoId, final long categoryId, final long id,
          final HttpServletRequest request) {
    if ((videoId.isSome() && eas().getVideo(videoId.get()).isNone()) || eas().getCategory(categoryId, false).isNone())
      return BAD_REQUEST;

    return run(nil, request, new Function<VideoInterface, Response>() {
      @Override
      public Response apply(VideoInterface videoInterface) {
        return eas().getLabel(id, false).fold(new Option.Match<Label, Response>() {
          @Override
          public Response some(Label l) {
            if (!hasResourceAccess(l, videoInterface))
              return UNAUTHORIZED;

            // If the label is a copy from a series category, delete it on the series category instead
            if (l.getSeriesLabelId().isSome()) {
              return eas().getLabel(l.getSeriesLabelId().get(), false).fold(new Option.Match<Label, Response>() {
                @Override
                public Response some(Label l) {
                  if (!hasResourceAccess(l, videoInterface))
                    return UNAUTHORIZED;

                  return eas().deleteLabel(l) ? NO_CONTENT : NOT_FOUND;
                }

                @Override
                public Response none() {
                  return NOT_FOUND;
                }
              });
            // Otherwise, delete normally
            } else {
              return eas().deleteLabel(l) ? NO_CONTENT : NOT_FOUND;
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

  class UncheckedVideoInterfaceException extends RuntimeException {
    UncheckedVideoInterfaceException(VideoInterfaceException cause) {
      super(cause);
    }
  }

  boolean hasResourceAccess(Resource resource, VideoInterface videoInterface) {
    // TODO Check for annotate access in `run`
    // TODO Or do it in here?!
    //   Or maybe rather separate these things mentally, like:
    //   The service tier still checks access using a media package ID
    //   which it gets from the REST tier, which extracts it from the request.
    //   At the same time, the REST tier uses the request to check general acces.
    //   Like: Even though resources like the templates are not bound to a video,
    //   you might still want them to only be accessible when your requests
    //   come from a link that includes a valid media package id
    //   that you have access to
    if (resource.getAccess() == Resource.PUBLIC) return true;
    try {
      if (resource.getAccess() == Resource.SHARED_WITH_ADMIN && videoInterface.getAccess() == Access.ADMIN) return true;
    } catch (VideoInterfaceException e) {
      throw new UncheckedVideoInterfaceException(e);
    }
    String currentUsername = getSecurityService().getUser().getUsername();
    // TODO Shouldn't we be able to assume that `createdBy` is always set?
    Option<Long> createdById = resource.getCreatedBy();
    if (createdById.isNone()) return false;  // TODO What to return here?
    return currentUsername.equals(eas().getUser(createdById.get()).get().getExtId());
  }

  // --

  static final Response NOT_FOUND = Response.status(Response.Status.NOT_FOUND).build();
  static final Response UNAUTHORIZED = Response.status(Response.Status.UNAUTHORIZED).build();
  static final Response FORBIDDEN = Response.status(Response.Status.FORBIDDEN).build();
  static final Response BAD_REQUEST = Response.status(Response.Status.BAD_REQUEST).build();
  static final Response CONFLICT = Response.status(Response.Status.CONFLICT).build();
  static final Response SERVER_ERROR = Response.serverError().build();
  static final Response NO_CONTENT = Response.noContent().build();

  static final Object[] nil = new Object[0];

  /** Run {@code f} doing common exception transformation. */
  Response run(Object[] mandatoryParams, HttpServletRequest request, Function<VideoInterface, Response> f) {
    for (Object a : mandatoryParams) {
      if (a == null || StringUtils.isEmpty(a.toString()))
        return BAD_REQUEST;
    }

    try {
      VideoInterface videoInterface = getVideoInterfaceProvider().getVideoInterface(request);
      Access access = videoInterface.getAccess();
      if (access == Access.NONE) return FORBIDDEN;
      else if (access == Access.NOT_FOUND) return NOT_FOUND;

      return f.apply(videoInterface);

    } catch (ExtendedAnnotationException e) {
      switch (e.getCauseCode()) {
        case UNAUTHORIZED:
          return UNAUTHORIZED;
        case DUPLICATE:
          return CONFLICT;
        case NOT_FOUND:
          return NOT_FOUND;
        default:
          return SERVER_ERROR;
      }
    } catch (BadVideoInterfaceRequestException e) {
      // TODO I don't like this
      throw new WebApplicationException(e, Response.Status.BAD_REQUEST);
    } catch (VideoInterfaceException | UncheckedVideoInterfaceException e) {
      // TODO Unwrap one cause in the case of an unchecked exception?!
      throw new WebApplicationException(e, Response.Status.INTERNAL_SERVER_ERROR);
    }
  }

  private URI userLocationUri(User u) {
    return uri(getEndpointBaseUrl(), "users", u.getId());
  }

  private URI videoLocationUri(Video v) {
    return uri(getEndpointBaseUrl(), "videos", v.getId());
  }

  URI scaleLocationUri(Scale s, boolean hasVideo) {
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

  URI categoryLocationUri(Category c, boolean hasVideo) {
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

  static final Function<String, Option<Date>> parseDate = new Function<String, Option<Date>>() {
    @Override
    public Option<Date> apply(String s) {
      try {
        return some(ISODateTimeFormat.dateTimeParser().parseDateTime(s).toDate());
      } catch (IllegalArgumentException e) {
        return none();
      }
    }
  };

  static final Function<String, Option<Map<String, String>>> parseToJsonMap = new Function<String, Option<Map<String, String>>>() {
    @Override
    public Option<Map<String, String>> apply(String s) {
      try {
        @SuppressWarnings("unchecked")
        Map<String, String> result = (Map<String, String>) new JSONParser().parse(s);
        return some(result);
      } catch (Exception e) {
        return none();
      }
    }
  };
}
