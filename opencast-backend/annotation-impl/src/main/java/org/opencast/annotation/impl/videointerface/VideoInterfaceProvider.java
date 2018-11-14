package org.opencast.annotation.impl.videointerface;

import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceProviderException;

/**
 * The interface between the Opencast Annotation Tool Backend and the rest of the system.
 * This is used to gain access to information about an event given its media package ID.
 */
public interface VideoInterfaceProvider {
  /**
   * @param mediaPackageId the media package ID of an event
   * @return a <code>VideoInterface</code> granting access to information about that event
   */
  VideoInterface getVideoInterface(String mediaPackageId) throws VideoInterfaceProviderException;
}
