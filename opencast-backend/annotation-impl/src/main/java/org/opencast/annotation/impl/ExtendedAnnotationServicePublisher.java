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
package org.opencast.annotation.impl;

import static org.opencastproject.util.persistence.PersistenceEnvs.persistenceEnvironment;

import org.opencast.annotation.impl.videointerface.ExternalApiVideoInterfaceProvider;
import org.opencast.annotation.impl.videointerface.ExternalApiVideoInterfaceProviderConfiguration;
import org.opencast.annotation.impl.videointerface.VideoInterfaceProvider;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.api.TrustedHttpClient;
import org.opencastproject.security.api.UserDirectoryService;
import org.opencastproject.util.osgi.SimpleServicePublisher;
import org.opencastproject.util.persistence.PersistenceEnv;

import org.osgi.service.cm.ConfigurationException;
import org.osgi.service.component.ComponentContext;

import java.util.Dictionary;

import javax.persistence.EntityManagerFactory;

import org.opencast.annotation.api.ExtendedAnnotationService;

import org.opencast.annotation.impl.persistence.ExtendedAnnotationServiceJpaImpl;

/**
 * Create and register an implementation of {@link org.opencast.annotation.api.ExtendedAnnotationService} .
 */
public class ExtendedAnnotationServicePublisher extends SimpleServicePublisher {

  private EntityManagerFactory emf;
  private SecurityService securityService;
  private UserDirectoryService userDirectoryService;
  private TrustedHttpClient trustedHttpClient;
  private VideoInterfaceProvider videoInterfaceProvider;
  private ExternalApiVideoInterfaceProviderConfiguration externalApiVideoInterfaceProviderConfiguration;

  /** OSGi DI */
  @SuppressWarnings("unused")
  void setEntityManagerFactory(EntityManagerFactory emf) {
    this.emf = emf;
  }

  /**
   * OSGi callback for setting the security service.
   *
   * @param securityService
   *          the security service
   */
  @SuppressWarnings("unused")
  public void setSecurityService(SecurityService securityService) {
    this.securityService = securityService;
  }

  /**
   * OSGi callback for setting the user directory service.
   *
   * @param userDirectoryService
   *          the user directory service
   */
  @SuppressWarnings("unused")
  public void setUserDirectoryService(UserDirectoryService userDirectoryService) {
    this.userDirectoryService = userDirectoryService;
  }

  /**
   * OSGi callback for setting the trusted http client
   *
   * @param trustedHttpClient
   *          the trusted http client
   */
  @SuppressWarnings("unused")
  public void setTrustedHttpClient(TrustedHttpClient trustedHttpClient) {
    this.trustedHttpClient = trustedHttpClient;
  }

  /**
   * OSGi callback for setting the external API video interface provider externalApiVideoInterfaceProviderConfiguration
   *
   * @param externalApiVideoInterfaceProviderConfiguration
   *          the externalApiVideoInterfaceProviderConfiguration
   */
  @SuppressWarnings("unused")
  public void setExternalApiVideoInterfaceProviderConfiguration(ExternalApiVideoInterfaceProviderConfiguration externalApiVideoInterfaceProviderConfiguration) {
    this.externalApiVideoInterfaceProviderConfiguration = externalApiVideoInterfaceProviderConfiguration;
  }

  @Override
  public boolean needConfig() {
    return false;
  }

  @Override
  public ServiceReg registerService(Dictionary properties, ComponentContext cc) throws ConfigurationException {
    final PersistenceEnv penv = persistenceEnvironment(emf);
    videoInterfaceProvider = new ExternalApiVideoInterfaceProvider(externalApiVideoInterfaceProviderConfiguration, securityService, userDirectoryService, trustedHttpClient);
    final ExtendedAnnotationServiceJpaImpl eas = new ExtendedAnnotationServiceJpaImpl(penv, securityService, videoInterfaceProvider);
    return ServiceReg.reg(registerService(cc, eas, ExtendedAnnotationService.class, "Extended Annotation Service"));
  }
}
