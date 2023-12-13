/**
 *  Copyright 2020, ELAN e.V., Germany
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
package org.opencast.annotation;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.util.List;
import java.util.Map;

public final class Annotations {
  private Annotations() {
  }

  public static String textAnnotation(String text) {
    return pack("text", text);
  }

  public static String scalingAnnotation(long labelId, long scalingId) {
    @SuppressWarnings("unchecked")
    Map<String, Long> value = new JSONObject();

    value.put("label", labelId);
    value.put("scaling", scalingId);

    return pack("scaling", value);
  }

  private static String pack(String type, Object value) {
    @SuppressWarnings("unchecked")
    Map<String, Object> contentItem = new JSONObject();
    contentItem.put("type", type);
    contentItem.put("value", value);
    @SuppressWarnings("unchecked")
    List<JSONObject> content = new JSONArray();
    JSONObject contentItemJSON = (JSONObject) contentItem;
    content.add(contentItemJSON);
    return content.toString();
  }
}
