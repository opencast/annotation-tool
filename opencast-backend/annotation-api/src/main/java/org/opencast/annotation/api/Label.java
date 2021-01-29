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

package org.opencast.annotation.api;

import org.opencastproject.util.data.Option;

/** A class representing a label of the annotation tool. */
public interface Label extends Resource {

  /** The category that is used for this label. */
  long getCategoryId();

  /** The label value */
  String getValue();

  /** The label abbreviation */
  String getAbbreviation();

  /** The label description */
  Option<String> getDescription();

  /** The id of the original label this is a copy from */
  Option<Long> getSeriesLabelId();

  /** The label settings */
  Option<String> getSettings();

}
