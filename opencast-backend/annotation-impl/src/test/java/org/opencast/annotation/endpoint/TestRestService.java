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
import org.opencast.annotation.impl.persistence.ExtendedAnnotationServiceJpaImpl;

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.search.api.SearchQuery;
import org.opencastproject.search.api.SearchResult;
import org.opencastproject.search.api.SearchResultItem;
import org.opencastproject.search.api.SearchService;
import org.opencastproject.security.api.AuthorizationService;
import org.opencastproject.security.api.DefaultOrganization;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.User;
import org.opencastproject.security.util.SecurityUtil;

import org.easymock.EasyMock;
import org.junit.Ignore;

import java.net.URL;

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
    extendedAnnotationService.setSearchService(getSearchService());
    extendedAnnotationService.setSecurityService(getSecurityService());
    extendedAnnotationService.setAuthorizationService(getAuthorizationService());
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

    SearchResultItem searchResultItem = EasyMock.createNiceMock(SearchResultItem.class);
    EasyMock.expect(searchResultItem.getMediaPackage()).andReturn(mediaPackage).anyTimes();
    EasyMock.replay(searchResultItem);

    SearchResult searchResult = EasyMock.createNiceMock(SearchResult.class);
    EasyMock.expect(searchResult.getItems()).andReturn(new SearchResultItem[]{searchResultItem}).anyTimes();
    EasyMock.replay(searchResult);

    SearchService searchService = EasyMock.createNiceMock(SearchService.class);
    EasyMock.expect(searchService.getByQuery(EasyMock.anyObject(SearchQuery.class)))
            .andReturn(searchResult).anyTimes();
    EasyMock.replay(searchService);
    return searchService;
  }

  @Override
  protected String getEndpointBaseUrl() {
    return BASE_URL.toString();
  }
}
