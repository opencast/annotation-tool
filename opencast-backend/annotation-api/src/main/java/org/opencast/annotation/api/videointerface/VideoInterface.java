package org.opencast.annotation.api.videointerface;

/**
 * The Opencast Annotation Tool Backend needs some information
 * about the videos it is supposed to annotate.
 * It uses this interface to get it from the rest in the system.
 * How this is done in detail is left to the implementation.
 * Note that every instance of an implementation of this interface
 * refers to a single event as identified by a media package ID,
 * which it gets from somewhere else.
 */
public interface VideoInterface {
  /**
   * @return the title of the relevant event
   */
  String getTitle() throws VideoInterfaceException;

  /**
   * @return the access level the current user has for the relevant event
   */
  Access getAccess() throws VideoInterfaceException;

  /**
   * @return the list of video URLs belonging to the relevant event
   */
  Iterable<VideoTrack> getTracks() throws VideoInterfaceException;

  /**
   * @return the series ID of the event
   */
  String getSeries();
}
