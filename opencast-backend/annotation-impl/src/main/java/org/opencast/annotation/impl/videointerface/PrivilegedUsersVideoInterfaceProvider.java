package org.opencast.annotation.impl.videointerface;

import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceException;
import org.opencast.annotation.api.videointerface.VideoTrack;
import org.opencastproject.security.api.Role;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.User;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

import static org.opencastproject.security.api.SecurityConstants.GLOBAL_ADMIN_ROLE;

// TODO JavaDoc and Copyright
public class PrivilegedUsersVideoInterfaceProvider implements VideoInterfaceProvider {

  private final VideoInterfaceProvider baseProvider;
  private final SecurityService securityService;

  private final Map<String, String> producerRoles;

  public PrivilegedUsersVideoInterfaceProvider(VideoInterfaceProvider baseProvider, SecurityService securityService) {
    this.baseProvider = baseProvider;
    this.securityService = securityService;

    this.producerRoles = new HashMap<>();
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

        // TODO This check should probably be in it's own provider
        String producerRole = producerRoles.computeIfAbsent(user.getOrganization().getId(),
                // TODO Are these the correct steps to build this role?
                tenant -> "ROLE_GROUP_" + tenant.replace('-', '_').toUpperCase() + "_PRODUCERS");
        String orgAdminRole = securityService.getOrganization().getAdminRole();

        for (Role role : user.getRoles()) {
          String roleName = role.getName();

          if (roleName.equals(producerRole)
                  || roleName.equals(orgAdminRole)
                  || roleName.equals(GLOBAL_ADMIN_ROLE)) {
            return Access.ADMIN;
          }
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
