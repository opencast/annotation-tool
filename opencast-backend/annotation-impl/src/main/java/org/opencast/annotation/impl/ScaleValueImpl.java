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
package org.opencast.annotation.impl;

import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.ScaleValue;

import org.opencastproject.util.EqualsUtil;
import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Option;

/**
 * The business model implementation of {@link org.opencast.annotation.api.ScaleValue}.
 */
public class ScaleValueImpl extends ResourceImpl implements ScaleValue {

  private final long id;
  private final long scaleId;
  private final String name;
  private final double value;
  private final int order;

  public ScaleValueImpl(long id, long scaleId, String name, double value, int order, Resource resource) {
    super(Option.option(resource.getAccess()), resource.getCreatedBy(), resource.getUpdatedBy(), resource
            .getDeletedBy(), resource.getCreatedAt(), resource.getUpdatedAt(), resource.getDeletedAt(), resource
            .getTags());
    this.id = id;
    this.scaleId = scaleId;
    this.name = name;
    this.value = value;
    this.order = order;
  }

  @Override
  public long getId() {
    return id;
  }

  @Override
  public Option<Long> getVideo(final ExtendedAnnotationService eas) {
    boolean includeDeleted = true;
    return eas.getScale(scaleId, includeDeleted).bind(new Function<Scale, Option<Long>>() {
      @Override
      public Option<Long> apply(Scale scale) {
        return scale.getVideo(eas);
      }
    });
  }

  @Override
  public long getScaleId() {
    return scaleId;
  }

  @Override
  public String getName() {
    return name;
  }

  @Override
  public double getValue() {
    return value;
  }

  @Override
  public int getOrder() {
    return order;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    ScaleValue scaleValue = (ScaleValue) o;
    return id == scaleValue.getId() && scaleId == scaleValue.getScaleId() && name.equals(scaleValue.getName())
            && value == scaleValue.getValue() && order == scaleValue.getOrder()
            && getTags().equals(scaleValue.getTags());
  }

  @Override
  public int hashCode() {
    return EqualsUtil.hash(id, scaleId, name, value, order, getTags());
  }

}
