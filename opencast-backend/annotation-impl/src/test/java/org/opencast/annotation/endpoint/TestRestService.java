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

import static org.opencastproject.db.DBTestEnv.getDbSessionFactory;
import static org.opencastproject.db.DBTestEnv.newEntityManagerFactory;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.impl.persistence.ExtendedAnnotationServiceJpaImpl;

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.search.api.SearchService;
import org.opencastproject.security.api.AuthorizationService;
import org.opencastproject.security.api.DefaultOrganization;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.UnauthorizedException;
import org.opencastproject.security.api.User;
import org.opencastproject.security.util.SecurityUtil;
import org.opencastproject.util.NotFoundException;

import org.easymock.EasyMock;
import org.junit.Ignore;

import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

@Path("/")
// put @Ignore here to prevent maven surefire from complaining about missing test methods
@Ignore
public class TestRestService extends AbstractExtendedAnnotationsRestService {
  // Declare this dependency static since the TestRestService gets instantiated multiple times.
  // Haven't found out who's responsible forf this but that's the way it is.
  public static final ExtendedAnnotationServiceJpaImpl extendedAnnotationService =
          new ExtendedAnnotationServiceJpaImpl();
  static {
    extendedAnnotationService.setSearchService(getSearchService());
    extendedAnnotationService.setSecurityService(getSecurityService());
    extendedAnnotationService.setAuthorizationService(getAuthorizationService());
    extendedAnnotationService.setEntityManagerFactory(
            newEntityManagerFactory("org.opencast.annotation.impl.persistence"));
    extendedAnnotationService.setDBSessionFactory(getDbSessionFactory());
    extendedAnnotationService.activate();
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

  private static SecurityService getSecurityService() {
    SecurityService securityService = EasyMock.createNiceMock(SecurityService.class);

    User user = SecurityUtil.createSystemUser("admin", new DefaultOrganization());
    EasyMock.expect(securityService.getOrganization()).andReturn(new DefaultOrganization()).anyTimes();
    EasyMock.expect(securityService.getUser()).andReturn(user).anyTimes();
    EasyMock.replay(securityService);
    return securityService;
  }

  private static AuthorizationService getAuthorizationService() {
    AuthorizationService authorizationService = EasyMock.createNiceMock(AuthorizationService.class);
    EasyMock.expect(authorizationService.hasPermission(EasyMock.anyObject(MediaPackage.class),
            EasyMock.anyObject(String.class))).andReturn(true).anyTimes();
    EasyMock.replay(authorizationService);
    return authorizationService;
  }

  private static SearchService getSearchService() {
    MediaPackage mediaPackage = EasyMock.createNiceMock(MediaPackage.class);

    SearchService searchService = EasyMock.createNiceMock(SearchService.class);
    try {
      EasyMock.expect(searchService.get(EasyMock.anyObject(String.class))).andReturn(mediaPackage).anyTimes();
    } catch (UnauthorizedException | NotFoundException e) {
      // Do nothing. We just have to pretend to handle checked exceptions somehow to appease the compiler.
    }
    EasyMock.replay(searchService);
    return searchService;
  }

  @Override
  protected String getEndpointBaseUrl() {
    return ExtendedAnnotationsRestServiceTest.rt.host("/");
  }
}
