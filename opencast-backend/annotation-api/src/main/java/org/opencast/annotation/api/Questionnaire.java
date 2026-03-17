package org.opencast.annotation.api;

import org.opencast.annotation.util.data.Option;

public interface Questionnaire extends Resource {

  /**
   * The video id where the questionnaire is
   */
  long getVideoId();

  /** The questionnaire title */
  String getTitle();

  /** The questionnaire content */
  String getContent();

  /** The questionnaire settings */
  Option<String> getSettings();
}
