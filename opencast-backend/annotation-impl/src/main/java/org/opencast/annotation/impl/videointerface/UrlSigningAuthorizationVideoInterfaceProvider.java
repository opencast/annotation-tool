package org.opencast.annotation.impl.videointerface;

import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.BadVideoInterfaceRequestException;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceException;
import org.opencast.annotation.api.videointerface.VideoTrack;

import org.opencastproject.security.urlsigning.exception.UrlSigningException;
import org.opencastproject.security.urlsigning.verifier.UrlSigningVerifier;
import org.opencastproject.urlsigning.common.ResourceRequest;

import org.apache.http.client.utils.URIBuilder;

import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

// TODO I don't like this design;
//   Checking access and getting tracks
//   should probably be separated.
// TODO JavaDoc
public class UrlSigningAuthorizationVideoInterfaceProvider implements VideoInterfaceProvider {

  private final VideoInterfaceProvider base;
  private UrlSigningVerifier verifier;

  public UrlSigningAuthorizationVideoInterfaceProvider(VideoInterfaceProvider base,
          UrlSigningVerifier verifier) {
    this.base = base;
    this.verifier = verifier;
  }

  @Override
  public VideoInterface getVideoInterface(HttpServletRequest request) throws VideoInterfaceException {
    VideoInterface base = this.base.getVideoInterface(request);
    return new VideoInterface() {
      @Override
      public String getTitle() throws VideoInterfaceException {
        return base.getTitle();
      }

      @Override
      public Access getAccess() throws VideoInterfaceException {
        Access baseAccess = base.getAccess();
        // TODO Should these rules of what can grant more access
        //   really be encoded in here?
        // If the base grants you access, that's good enough for us
        if (baseAccess != Access.NONE) return baseAccess;

        ResourceRequest verification;
        try {
          // TODO Should we check this once in the constructor?!
          // TODO URL en- and decoding?
          String signedUrlString = Requests.getHeaderOrParam(request, "X-Opencast-Annotate-Signed-URL", "signedUrl");

          URL signedUrl = new URL(signedUrlString);

          // Extract the base URL from the signed one
          URIBuilder baseUriBuilder = new URIBuilder(signedUrlString);
          baseUriBuilder.setParameters(baseUriBuilder.getQueryParams()
                  .stream()
                  .filter(param -> !(param.getName().equals("policy")
                          || param.getName().equals("signature")
                          || param.getName().equals("keyId")))
                  .collect(Collectors.toList()));

          final boolean strict = true;
          final String ip = null;
          verification = verifier.verify(signedUrl.getQuery(), ip, baseUriBuilder.toString(), strict);
        } catch (UrlSigningException e) {
          throw new VideoInterfaceException(e);
        } catch (MalformedURLException | URISyntaxException e) {
          return Access.NONE;
        } catch (IllegalArgumentException e) {
          throw new BadVideoInterfaceRequestException(e);
        }

        if (verification.getStatus() == ResourceRequest.Status.Ok) {
          return Access.ANNOTATE;
        } else {
          return Access.NONE;
        }
      }

      @Override
      public Iterable<VideoTrack> getTracks() throws VideoInterfaceException {
        return base.getTracks();
      }

      @Override
      public String getSeries() {
        return base.getSeries();
      }
    };
  }
}
