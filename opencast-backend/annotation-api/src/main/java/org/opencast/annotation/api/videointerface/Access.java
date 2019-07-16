package org.opencast.annotation.api.videointerface;

/**
 * The different levels of access the tool provides to annotators of the videos of an event.
 */
public enum Access {
  /** No access because the event could not be found. */
  NOT_FOUND,
  /** The event was found but the current user is not allowed to annotate it. */
  NONE,
  /** The current user may annotate the described event. */
  ANNOTATE,
  /** The current user may perform administrative functions in the context of the annotation tool. */
  ADMIN
}
