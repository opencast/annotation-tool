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

import static org.opencastproject.test.rest.RestServiceTestEnv.localhostRandomPort;
import static org.opencastproject.util.persistence.PersistenceUtil.newTestEntityManagerFactory;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.videointerface.Access;
import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceException;
import org.opencast.annotation.impl.persistence.ExtendedAnnotationServiceJpaImpl;
import org.opencast.annotation.impl.videointerface.VideoInterfaceProvider;

import org.opencastproject.security.api.DefaultOrganization;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.User;
import org.opencastproject.security.util.SecurityUtil;

import org.easymock.EasyMock;
import org.junit.Ignore;

import java.net.URL;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

@Path("/")
// put @Ignore here to prevent maven surefire from complaining about missing test methods
@Ignore
public class TestRestService extends AbstractExtendedAnnotationsRestService {
  public static final URL BASE_URL = localhostRandomPort();

  // Declare this dependency static since the TestRestService gets instantiated multiple times.
  // Haven't found out who's responsible for this but that's the way it is.
  public static final ExtendedAnnotationServiceJpaImpl extendedAnnotationService =
          new ExtendedAnnotationServiceJpaImpl();
  static {
    extendedAnnotationService.setSecurityService(getStaticSecurityService());
    extendedAnnotationService.setEntityManagerFactory(
            newTestEntityManagerFactory("org.opencast.annotation.impl.persistence"));
  }

  @Override
  protected ExtendedAnnotationService getExtendedAnnotationsService() {
    return extendedAnnotationService;
  }

  @DELETE
  @Path("/reset")
  public Response reset() {
    extendedAnnotationService.clearDatabase();
    return Response.noContent().build();
  }

  private static SecurityService getStaticSecurityService() {
    SecurityService securityService = EasyMock.createNiceMock(SecurityService.class);

    User user = SecurityUtil.createSystemUser("admin", new DefaultOrganization());
    EasyMock.expect(securityService.getOrganization()).andReturn(new DefaultOrganization()).anyTimes();
    EasyMock.expect(securityService.getUser()).andReturn(user).anyTimes();
    EasyMock.replay(securityService);
    return securityService;
  }

  @Override
  protected SecurityService getSecurityService() {
    return getStaticSecurityService();
  }

  @Override
  protected VideoInterfaceProvider getVideoInterfaceProvider() {
    VideoInterface videoInterface = EasyMock.createNiceMock(VideoInterface.class);
    try {
      EasyMock.expect(videoInterface.getAccess())
              .andReturn(Access.ANNOTATE)
              .anyTimes();
    } catch (VideoInterfaceException e) {
    }
    EasyMock.replay(videoInterface);

    VideoInterfaceProvider videoInterfaceProvider = EasyMock.createNiceMock(VideoInterfaceProvider.class);
    try {
      EasyMock.expect(videoInterfaceProvider.getVideoInterface(EasyMock.anyObject(HttpServletRequest.class)))
              .andReturn(videoInterface)
              .anyTimes();
    } catch (VideoInterfaceException e) {
    }
    EasyMock.replay(videoInterfaceProvider);
    return videoInterfaceProvider;
  }

  @Override
  protected String getEndpointBaseUrl() {
    return BASE_URL.toString();
  }
}
