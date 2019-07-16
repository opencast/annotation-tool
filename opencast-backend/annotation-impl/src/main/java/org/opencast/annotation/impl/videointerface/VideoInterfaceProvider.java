package org.opencast.annotation.impl.videointerface;

import org.opencast.annotation.api.videointerface.VideoInterface;
import org.opencast.annotation.api.videointerface.VideoInterfaceException;

import javax.servlet.http.HttpServletRequest;

/**
 * The interface between the Opencast Annotation Tool Backend and the rest of the system.
 * This is used to gain access to information about an event given its media package ID.
 */
public interface VideoInterfaceProvider {
  /**
   * @param request the request wanting to gain access to information from Opencast
   * @return a video interface to get information about the event the {@code request} is about.
   *         Note that the way the event is encoded in {@code request} is implementation defined!
   */
  VideoInterface getVideoInterface(HttpServletRequest request) throws VideoInterfaceException;
}
