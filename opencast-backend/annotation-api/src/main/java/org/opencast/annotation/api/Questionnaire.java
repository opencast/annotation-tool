package org.opencast.annotation.api;

import org.opencastproject.util.data.Option;

public interface Questionnaire extends Resource {

  /** The video id where the questionnaire is */
  Option<Long> getVideoId();

  /** The questionnaire title */
  String getTitle();

  /** The questionnaire content */
  String getContent();

  /** The questionnaire settings */
  Option<String> getSettings();
}
