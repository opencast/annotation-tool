package org.opencast.annotation.impl.videointerface;

import org.osgi.service.cm.ConfigurationException;
import org.osgi.service.cm.ManagedService;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Dictionary;

public class ExternalApiVideoInterfaceProviderConfiguration implements ManagedService {
  private URI externalApiBase;

  public URI getExternalApiBase() {
    return externalApiBase;
  }

  @Override
  public void updated(Dictionary<String, ?> dictionary) throws ConfigurationException {
    if (dictionary == null) {
      throw new ConfigurationException("externalApiBase", "must be set");
    }
    try {
      this.externalApiBase = new URI((String) dictionary.get("externalApiBase"));
    } catch (URISyntaxException e) {
      throw new ConfigurationException("externalApiBase", "must be a valid URI", e);
    } catch (ClassCastException e) {
      throw new ConfigurationException("externalApiBase", "must be a string", e);
    }
  }
}
