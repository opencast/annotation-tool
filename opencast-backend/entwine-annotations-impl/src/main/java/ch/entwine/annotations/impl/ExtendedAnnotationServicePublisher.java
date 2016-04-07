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
package ch.entwine.annotations.impl;

import static org.opencastproject.util.data.Collections.list;
import static org.opencastproject.util.persistence.PersistenceUtil.newEntityManagerFactory;
import static org.opencastproject.util.persistence.PersistenceUtil.newPersistenceEnvironment;

import org.opencastproject.security.api.SecurityService;
import org.opencastproject.util.data.Effect0;
import org.opencastproject.util.osgi.SimpleServicePublisher;
import org.opencastproject.util.persistence.PersistenceEnv;

import ch.entwine.annotations.api.ExtendedAnnotationService;
import ch.entwine.annotations.impl.persistence.ExtendedAnnotationServiceJpaImpl;

import org.osgi.framework.ServiceRegistration;
import org.osgi.service.cm.ConfigurationException;
import org.osgi.service.component.ComponentContext;

import java.util.ArrayList;
import java.util.Dictionary;

/**
 * Create and register an implementation of {@link ch.entwine.annotations.api.ExtendedAnnotationService} .
 */
public class ExtendedAnnotationServicePublisher extends SimpleServicePublisher {

  private SecurityService securityService;

  /**
   * OSGi callback for setting the security service.
   * 
   * @param securityService
   *          the security service
   */
  public void setSecurityService(SecurityService securityService) {
    this.securityService = securityService;
  }

  /**
   * @see org.opencastproject.util.osgi.SimpleServicePublisher#needConfig()
   */
  @Override
  public boolean needConfig() {
    return false;
  }

  /**
   * @see org.opencastproject.util.osgi.SimpleServicePublisher#registerService(Dictionary, ComponentContext)
   */
  @Override
  public ServiceReg registerService(Dictionary properties, ComponentContext cc) throws ConfigurationException {
    final PersistenceEnv penv = newPersistenceEnvironment(newEntityManagerFactory(cc,
            "ch.entwine.annotations.impl.persistence"));
    final ExtendedAnnotationServiceJpaImpl eas = new ExtendedAnnotationServiceJpaImpl(penv, securityService);
    final ServiceRegistration sr = registerService(cc, eas, ExtendedAnnotationService.class,
            "Extended Annotation Service");
    ArrayList<Effect0> effects = new ArrayList<Effect0>();
    effects.add(close(eas));
    return ServiceReg.reg(list(sr), effects);
  }
}
