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

/** A class representing a scale value of the annotation tool. */
public interface ScaleValue extends Resource {

  /** The scale value id */
  long getId();

  /** The scale that is used for this scale value */
  long getScaleId();

  /** The scale value name */
  String getName();

  /** The scale value as decimal */
  double getValue();

  /** The order of the scale value in the scale values list */
  int getOrder();

}
