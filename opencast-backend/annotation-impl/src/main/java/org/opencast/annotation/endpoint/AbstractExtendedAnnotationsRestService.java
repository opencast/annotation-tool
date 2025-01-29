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

import static org.opencast.annotation.api.ExtendedAnnotationService.ANNOTATE_ACTION;
import static org.opencast.annotation.api.ExtendedAnnotationService.ANNOTATE_ADMIN_ACTION;
import static org.opencastproject.util.UrlSupport.uri;
import static org.opencastproject.util.data.Arrays.array;
import static org.opencastproject.util.data.Option.option;
import static org.opencastproject.util.data.functions.Strings.trimToNone;

import org.opencast.annotation.api.ExtendedAnnotationException;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.User;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.impl.ResourceImpl;
import org.opencast.annotation.impl.UserImpl;
import org.opencast.annotation.impl.VideoImpl;
import org.opencast.annotation.impl.persistence.UserDto;
import org.opencast.annotation.impl.persistence.VideoDto;

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.util.data.Function0;
import org.opencastproject.util.data.Option;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;

import javax.ws.rs.DELETE;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

// no @Path annotation here since this class cannot be created by JAX-RS. Put it on implementations.
public abstract class AbstractExtendedAnnotationsRestService {

  private static final Logger logger = LoggerFactory.getLogger(AbstractExtendedAnnotationsRestService.class);

  /** Location header. */
  static final String LOCATION = "Location";

  protected abstract ExtendedAnnotationService getExtendedAnnotationsService();

  protected abstract String getEndpointBaseUrl();

  // shorthand
  private ExtendedAnnotationService eas() {
    return getExtendedAnnotationsService();
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/users")
  public Response postUsers(@FormParam("user_extid") final String userExtId,
          @FormParam("nickname") final String nickname, @FormParam("email") final String email) {
    final Option<String> emailo = trimToNone(email);
    return run(array(userExtId, nickname), new Function0<>() {
      @Override
      public Response apply() {
        if (eas().getUserByExtId(userExtId).isSome()) {
          return CONFLICT;
        }

        Resource resource = eas().createResource();
        User u = eas().createUser(userExtId, nickname, emailo, resource);
        // This might have been the first user, which would mean
        // that the resource above has no owner.
        // To fix this, we just recreate it and update the user to persist it.
        resource = eas().createResource();
        u = new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), resource);
        eas().updateUser(u);

        return Response.created(userLocationUri(u)).entity(UserDto.toJson.apply(eas(), u).toString()).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/users")
  public Response putUser(@FormParam("user_extid") final String userExtId,
          @FormParam("nickname") final String nickname, @FormParam("email") final String email) {
    final Option<String> emailo = trimToNone(email);
    return run(array(userExtId, nickname), new Function0<>() {
      @Override
      public Response apply() {
        return eas().getUserByExtId(userExtId).fold(new Option.Match<>() {
          @Override
          public Response some(User u) {
            if (!eas().hasResourceAccess(u)) {
              return UNAUTHORIZED;
            }

            Resource resource = eas().updateResource(u, Option.none());
            final User updated = new UserImpl(u.getId(), userExtId, nickname, emailo, resource);
            if (!u.equals(updated)) {
              eas().updateUser(updated);
              u = updated;
            }

            return Response.ok(UserDto.toJson.apply(eas(), u).toString()).header(LOCATION, userLocationUri(u)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource();
            User u = eas().createUser(userExtId, nickname, emailo, resource);
            // This might have been the first user, which would mean
            // that the resource above has no owner.
            // To fix this, we just recreate it and update the user to persist it.
            u = new UserImpl(u.getId(), u.getExtId(), u.getNickname(), u.getEmail(), resource);
            eas().updateUser(u);
            return Response.created(userLocationUri(u)).entity(UserDto.toJson.apply(eas(), u).toString()).build();
          }
        });
      }
    });
  }

  @DELETE
  @Path("/users/{id}")
  public Response deleteUser(@PathParam("id") final long id) {
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas().getUser(id).fold(new Option.Match<>() {
          @Override
          public Response some(User u) {
            if (!eas().hasResourceAccess(u)) {
              return UNAUTHORIZED;
            }
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
    return run(nil, new Function0<>() {
      @Override
      public Response apply() {
        return eas().getUser(id).fold(new Option.Match<>() {
          @Override
          public Response some(User u) {
            if (!eas().hasResourceAccess(u)) {
              return UNAUTHORIZED;
            }

            return Response.ok(UserDto.toJson.apply(eas(), u).toString()).build();
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
  @Produces(MediaType.TEXT_PLAIN)
  @Path("/users/is-annotate-admin/{mpId}")
  public Response isAnnotateAdmin(@PathParam("mpId") final String mpId) {
    Option<MediaPackage> mpOpt = eas().findMediaPackage(mpId);
    if (mpOpt.isSome()) {
      return Response.ok(Boolean.toString(eas().hasVideoAccess(mpOpt.get(), ANNOTATE_ADMIN_ACTION))).build();
    }
    return Response.ok("false").build();
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos")
  public Response postVideos(@FormParam("video_extid") final String videoExtId) {
    return run(array(videoExtId), new Function0<>() {
      @Override
      public Response apply() {
        final Option<MediaPackage> potentialMediaPackage = eas().findMediaPackage(videoExtId);
        if (potentialMediaPackage.isNone()) {
          return BAD_REQUEST;
        }
        final MediaPackage videoMediaPackage = potentialMediaPackage.get();
        if (!eas().hasVideoAccess(videoMediaPackage, ANNOTATE_ACTION)) {
          return FORBIDDEN;
        }

        if (eas().getVideoByExtId(videoExtId).isSome()) {
          return CONFLICT;
        }

        Resource resource = eas().createResource();
        final Video v = eas().createVideo(videoExtId, resource);
        return Response.created(videoLocationUri(v)).entity(VideoDto.toJson.apply(eas(), v).toString()).build();
      }
    });
  }

  @PUT
  @Produces(MediaType.APPLICATION_JSON)
  @Path("/videos")
  public Response putVideo(@FormParam("video_extid") final String videoExtId,
          @FormParam("access") final Integer access) {
    return run(array(videoExtId), new Function0<>() {
      @Override
      public Response apply() {
        final Option<MediaPackage> potentialMediaPackage = eas().findMediaPackage(videoExtId);
        if (potentialMediaPackage.isNone()) {
          return BAD_REQUEST;
        }
        final MediaPackage videoMediaPackage = potentialMediaPackage.get();
        if (!eas().hasVideoAccess(videoMediaPackage, ANNOTATE_ACTION)) {
          return FORBIDDEN;
        }

        return eas().getVideoByExtId(videoExtId).fold(new Option.Match<>() {
          @Override
          public Response some(Video v) {
            if (!eas().hasResourceAccess(v)) {
              return UNAUTHORIZED;
            }

            Resource resource = eas().updateResource(v, Option.none());
            final Video updated = new VideoImpl(v.getId(), videoExtId, resource);
            if (!v.equals(updated)) {
              eas().updateVideo(updated);
              v = updated;
            }
            return Response.ok(VideoDto.toJson.apply(eas(), v).toString()).header(LOCATION, videoLocationUri(v)).build();
          }

          @Override
          public Response none() {
            Resource resource = eas().createResource();
            final Video v = eas().createVideo(videoExtId,
                new ResourceImpl(option(access), resource.getCreatedBy(), resource.getUpdatedBy(), resource.getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(),
                    resource.getTags()));
            return Response.created(videoLocationUri(v)).entity(VideoDto.toJson.apply(eas(), v).toString()).build();
          }
        });
      }
    });
  }

  @Path("/videos/{id}")
  public VideoEndpoint video(@PathParam("id") final long id) {
    return new VideoEndpoint(id, this, eas());
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

  /** Run <code>f</code> doing common exception transformation. */
  static Response run(Object[] mandatoryParams, Function0<Response> f) {
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
        case NOT_FOUND:
          return NOT_FOUND;
        default:
          logger.error("The annotation tool endpoint experienced an unexpected error.", e);
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
}
