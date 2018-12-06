package org.opencast.annotation.impl.videointerface;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceProviderException;
import org.opencast.annotation.api.videointerface.VideoTrack;
import org.opencastproject.security.api.Role;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.TrustedHttpClient;
import org.opencastproject.security.api.User;
import org.opencastproject.security.api.UserDirectoryService;
import org.opencastproject.util.MimeTypes;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Map;
import java.util.Objects;

/**
 * Provide access to video information by using the external API.
 *
 * Note that this implementation makes all the necessary requests to answer the queries
 * that {@link VideoInterface} exposes in its constructor. Calls to these query methods
 * on the constructed object do not incur any further requests to aid performance
 * and return consistent, though potentially stale results.
 */
public class ExternalApiVideoInterfaceProvider implements VideoInterfaceProvider {
  private final TrustedHttpClient client;
  private final SecurityService securityService;
  private final UserDirectoryService userDirectoryService;
  private final ExternalApiVideoInterfaceProviderConfiguration configuration;

  public ExternalApiVideoInterfaceProvider(ExternalApiVideoInterfaceProviderConfiguration configuration,
          SecurityService securityService, UserDirectoryService userDirectoryService, TrustedHttpClient client) {
    this.configuration = configuration;
    this.securityService = securityService;
    this.userDirectoryService = userDirectoryService;
    this.client = client;
  }

  @Override
  public VideoInterface getVideoInterface(HttpServletRequest request) throws VideoInterfaceProviderException {

    User originalUser = securityService.getUser();
    User annotateUser = userDirectoryService.loadUser("annotate");
    securityService.setUser(annotateUser);

    String mediaPackageId = request.getParameter("id");

    HttpResponse response = null;
    try {
      HttpGet apiRequest = new HttpGet(new URIBuilder(configuration.getExternalApiBase())
              .setPath("/api/events/" + mediaPackageId)
              .addParameter("withacl", Boolean.toString(true))
              .addParameter("withpublications", Boolean.toString(true))
              .addParameter("sign", Boolean.toString(true))
              .build());
      apiRequest.setHeader("Accept", "application/v1.0.0+json");
      response = client.execute(apiRequest);

      if (response.getStatusLine().getStatusCode() == 404) {
        return NOT_FOUND;
      }

      JSONParser jsonParser = new JSONParser();
      JSONObject event = (JSONObject) jsonParser.parse(new InputStreamReader(response.getEntity().getContent()));

      return new VideoInterface() {
        @Override
        public String getTitle() {
          return (String) event.get("title");
        }

        @Override
        public Access getAccess() {
          boolean canRead = false;
          boolean canAnnotate = false;

          @SuppressWarnings("unchecked")
          ArrayList<JSONObject> acl = (ArrayList<JSONObject>) event.get("acl");
          if (acl == null) return Access.NONE;

          for (JSONObject ace: acl) {
            Boolean allow = (Boolean) ace.get("allow");
            if (allow == null || !allow) continue;

            String action = (String) ace.get("action");
            if (action == null || !(action.equals("read") || action.equals("cast-annotate"))) continue;

            String role = (String) ace.get("role");
            if (role == null || !applies(role)) continue;

            if (action.equals("read")) {
              canRead = true;
            } else if (action.equals("cast-annotate")) {
              canAnnotate = true;
            }
          }

          return canRead && canAnnotate ? Access.ANNOTATE : Access.NONE;
        }

        @Override
        public Iterable<VideoTrack> getTracks() {
          @SuppressWarnings("unchecked")
          ArrayList<JSONObject> publications = (ArrayList<JSONObject>) event.get("publications");
          if (publications == null) return Collections::emptyIterator;
          return publications.stream()
                  .flatMap(publication -> ((ArrayList<JSONObject>) publication.get("media"))
                          .stream()
                          .filter(Objects::nonNull)
                          .map(medium -> new AbstractMap.SimpleEntry<>((String) publication.get("channel"), medium)))
                  .filter(entry -> {
                    String mediaType = (String) entry.getValue().get("mediatype");
                    return mediaType != null && mediaType.matches("^video/.*$");
                  })
                  .sorted(Comparator.comparing(
                          (Map.Entry<String, JSONObject> entry) -> "switchcast-player".equals(entry.getKey()))
                          .thenComparing(entry -> {
                            String flavor = (String) entry.getValue().get("flavor");
                            return flavor != null && flavor.matches("^delivery/.*$");
                          })
                          .reversed())
                  .map(Map.Entry::getValue)
                  .map(medium -> {
                    try {
                      return new VideoTrack(
                              new URL((String) medium.get("url")),
                              MimeTypes.parseMimeType((String) medium.get("mediatype")));
                    } catch (MalformedURLException | IllegalArgumentException e) {
                      return null;
                    }
                  })
                  .filter(Objects::nonNull)
                  ::iterator;
        }
      };
    } catch (URISyntaxException e) {
      // `URISyntaxException` is already caught by the configuration
      // `ParseException` should only occur if something is majorly broken;
      // **we** can't really recover from it.
      throw new AssertionError(e);
    } catch (ParseException | IOException e) {
      throw new VideoInterfaceProviderException(e);
    } finally {
      client.close(response);
      securityService.setUser(originalUser);
    }
  }

  /**
   * @param role the name of an Opencast role
   * @return <code>true</code> when the current Opencast user has this role, <code>false</code> otherwise
   */
  private boolean applies(String role) {
    return securityService.getUser()
            .getRoles()
            .stream()
            .map(Role::getName)
            .anyMatch(role::equals);
  }

  private static final VideoInterface NOT_FOUND = new VideoInterface() {
    @Override
    public String getTitle() {
      return null;
    }

    @Override
    public Access getAccess() {
      return Access.NOT_FOUND;
    }

    @Override
    public Iterable<VideoTrack> getTracks() {
      return null;
    }
  };
}
