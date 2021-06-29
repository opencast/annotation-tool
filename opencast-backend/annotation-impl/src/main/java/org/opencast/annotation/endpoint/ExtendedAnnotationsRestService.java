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

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.impl.videointerface.AdminVideoInterfaceProvider;
import org.opencast.annotation.impl.videointerface.ExternalApiVideoInterfaceProvider;
import org.opencast.annotation.impl.videointerface.UrlSigningAuthorizationVideoInterfaceProvider;
import org.opencast.annotation.impl.videointerface.VideoInterfaceProvider;

import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.urlsigning.verifier.UrlSigningVerifier;
import org.opencastproject.util.UrlSupport;
import org.opencastproject.util.data.Tuple;

import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.ws.rs.Path;

@Component(service = ExtendedAnnotationsRestService.class, property = {
        "opencast.service.type=org.opencast.annotation",
        "opencast.service.path=/extended-annotations"})
@Path("/")
public class ExtendedAnnotationsRestService extends AbstractExtendedAnnotationsRestService {

  // TODO Unify `annotations` vs `annotation`
  private ExtendedAnnotationService extendedAnnotationService;
  // TODO Inject this via OSGi
  private VideoInterfaceProvider videoInterfaceProvider;
  private ExternalApiVideoInterfaceProvider externalApiVideoInterfaceProvider;
  private SecurityService securityService;
  // TODO **WE** should not have this ...
  //   Remember to also remove the OSGi config
  //   when you change this
  private UrlSigningVerifier urlSigningVerifier;
  private String endpointBaseUrl;

  @SuppressWarnings("unused")
  @Activate
  public void activate(ComponentContext cc) {
    final Tuple<String, String> endpointUrl = getEndpointUrl(cc);
    endpointBaseUrl = UrlSupport.concat(endpointUrl.getA(), endpointUrl.getB());

    videoInterfaceProvider = new AdminVideoInterfaceProvider(new UrlSigningAuthorizationVideoInterfaceProvider(
            externalApiVideoInterfaceProvider, urlSigningVerifier), securityService);
  }

  @SuppressWarnings("unused")
  @Reference
  public void setExtendedAnnotationsService(ExtendedAnnotationService extendedAnnotationService) {
    this.extendedAnnotationService = extendedAnnotationService;
  }

  @SuppressWarnings("unused")
  @Reference
  public void setExternalApiVideoInterfaceProvider(ExternalApiVideoInterfaceProvider externalApiVideoInterfaceProvider) {
    this.externalApiVideoInterfaceProvider = externalApiVideoInterfaceProvider;
  }

  @SuppressWarnings("unused")
  @Reference
  public void setSecurityService(SecurityService securityService) {
    this.securityService = securityService;
  }

  @SuppressWarnings("unused")
  @Reference
  public void setUrlSigningVerifier(UrlSigningVerifier urlSigningVerifier) {
    this.urlSigningVerifier = urlSigningVerifier;
  }

  @Override
  protected ExtendedAnnotationService getExtendedAnnotationsService() {
    return extendedAnnotationService;
  }

  @Override
  protected SecurityService getSecurityService() {
    return securityService;
  }

  @Override
  protected VideoInterfaceProvider getVideoInterfaceProvider() {
    return videoInterfaceProvider;
  }

  @Override
  protected String getEndpointBaseUrl() {
    return endpointBaseUrl;
  }
}
