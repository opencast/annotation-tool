package org.opencast.annotation.impl.videointerface;

import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceException;
import org.opencast.annotation.api.videointerface.VideoTrack;
import org.opencastproject.security.api.Role;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.User;

import javax.servlet.http.HttpServletRequest;
import java.util.Set;

import static org.opencastproject.security.api.SecurityConstants.GLOBAL_ADMIN_ROLE;

// TODO JavaDoc and Copyright
public class AdminVideoInterfaceProvider implements VideoInterfaceProvider {

  private final VideoInterfaceProvider baseProvider;
  private final SecurityService securityService;

  public AdminVideoInterfaceProvider(VideoInterfaceProvider baseProvider, SecurityService securityService) {
    this.baseProvider = baseProvider;
    this.securityService = securityService;
  }

  @Override
  public VideoInterface getVideoInterface(HttpServletRequest request) throws VideoInterfaceException {
    VideoInterface baseInterface = baseProvider.getVideoInterface(request);
    return new VideoInterface() {
      @Override
      public String getTitle() throws VideoInterfaceException {
        return baseInterface.getTitle();
      }

      @Override
      public Access getAccess() throws VideoInterfaceException {

        User user = securityService.getUser();
        if (user.hasRole(securityService.getOrganization().getAdminRole()) || user.hasRole(GLOBAL_ADMIN_ROLE)) {
          return Access.ADMIN;
        }

        return baseInterface.getAccess();
      }

      @Override
      public Iterable<VideoTrack> getTracks() throws VideoInterfaceException {
        return baseInterface.getTracks();
      }
    };
  }
}
