/*
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

package org.opencast.annotation.endpoint;

import static org.opencastproject.util.RestUtil.getEndpointUrl;

import org.opencast.annotation.api.ExtendedAnnotationService;

import org.opencastproject.util.UrlSupport;
import org.opencastproject.util.data.Tuple;
import org.opencastproject.util.doc.rest.RestService;

import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import javax.ws.rs.Path;

@Path("/extended-annotations")
@RestService(
    name = "extended-annotations",
    title = "Annotation Tool Backend",
    abstractText = "Scientific video annotations on Opencast media..",
    notes = { "The Annotation Tool does not yet provide REST documentation." }
)
@Component(service = ExtendedAnnotationsRestService.class,
        immediate = true,
        property = {
        "opencast.service.type=org.opencast.annotation",
        "opencast.service.path=/extended-annotations"})
@JaxrsResource
public class ExtendedAnnotationsRestService extends AbstractExtendedAnnotationsRestService {

  private ExtendedAnnotationService extendedAnnotationService;
  private String endpointBaseUrl;

  @SuppressWarnings("unused")
  @Activate
  public void activate(ComponentContext cc) {
    final Tuple<String, String> endpointUrl = getEndpointUrl(cc);
    endpointBaseUrl = UrlSupport.concat(endpointUrl.getA(), endpointUrl.getB());
  }

  @SuppressWarnings("unused")
  @Reference
  public void setExtendedAnnotationsService(ExtendedAnnotationService extendedAnnotationService) {
    this.extendedAnnotationService = extendedAnnotationService;
  }

  @Override
  protected ExtendedAnnotationService getExtendedAnnotationsService() {
    return extendedAnnotationService;
  }

  @Override
  protected String getEndpointBaseUrl() {
    return endpointBaseUrl;
  }
}
