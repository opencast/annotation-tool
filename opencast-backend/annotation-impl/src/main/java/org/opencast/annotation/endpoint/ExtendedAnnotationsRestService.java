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

import static org.opencastproject.util.RestUtil.getEndpointUrl;

import org.opencastproject.util.UrlSupport;
import org.opencastproject.util.data.Tuple;

import org.opencastproject.search.api.SearchService;
import org.opencastproject.security.api.AuthorizationService;

import org.opencast.annotation.api.ExtendedAnnotationService;

import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.Path;

@Path("/")
public class ExtendedAnnotationsRestService extends AbstractExtendedAnnotationsRestService {
  private static final Logger logger = LoggerFactory.getLogger(ExtendedAnnotationsRestService.class);

  private ExtendedAnnotationService eas;
  private AuthorizationService authorizationService;
  private SearchService searchService;
  private String endpointBaseUrl;

  /** OSGi callback. */
  public void activate(ComponentContext cc) {
    logger.info("Start");
    final Tuple<String, String> endpointUrl = getEndpointUrl(cc);
    endpointBaseUrl = UrlSupport.concat(endpointUrl.getA(), endpointUrl.getB());
  }

  /** OSGi callback. */
  public void deactivate() {
    logger.info("Stop");
  }

  /** OSGi callback. */
  public void setExtendedAnnotationsService(ExtendedAnnotationService eas) {
    this.eas = eas;
  }

  /** OSGi callback */
  public void setAuthorizationService(AuthorizationService authorizationService) {
    this.authorizationService = authorizationService;
  }

  /** OSGi callback. */
  public void setSearchService(SearchService searchService) {
    this.searchService = searchService;
  }

  @Override
  protected ExtendedAnnotationService getExtendedAnnotationsService() {
    return eas;
  }

  @Override
  protected AuthorizationService getAuthorizationService() {
    return authorizationService;
  }

  protected SearchService getSearchService() {
    return searchService;
  }

  @Override
  protected String getEndpointBaseUrl() {
    return endpointBaseUrl;
  }

}
