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

import java.util.Date;
import java.util.Map;

/** A class representing a resource with the base logging of the annotation tool. */
public interface Resource {

  int PRIVATE = 0;
  int PUBLIC = 1;
  int SHARED_WITH_ADMIN = 2;

  /** The id of the resource */
  long getId();

  /** The access to the resource */
  int getAccess();

  /** The id of the video this resource belongs to */
  Option<Long> getVideo(ExtendedAnnotationService eas);

  /** The user id from the creator */
  Option<Long> getCreatedBy();

  /** The user id from the updater */
  Option<Long> getUpdatedBy();

  /** The user id from the deleter */
  Option<Long> getDeletedBy();

  /** The creation date */
  Option<Date> getCreatedAt();

  /** The update date */
  Option<Date> getUpdatedAt();

  /** The deletion date */
  Option<Date> getDeletedAt();

  /** The tags */
  Map<String, String> getTags();

}