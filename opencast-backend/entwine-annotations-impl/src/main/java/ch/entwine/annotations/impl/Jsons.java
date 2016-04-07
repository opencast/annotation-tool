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
package ch.entwine.annotations.impl;

import static org.opencastproject.util.data.Tuple.tuple;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Monadics;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.Tuple;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** JSON builder based on json-simple. */
// CHECKSTYLE:OFF
public class Jsons {
  public static final Tuple<String, Object> ZERO = Tuple.<String, Object> tuple("", "");

  /** Create a JSON object. The tuples are key/value. */
  public static JSONObject jO(Tuple<String, Object>... ps) {
    final JSONObject j = new JSONObject();
    for (Tuple<String, Object> p : ps) {
      if (!ZERO.equals(p))
        j.put(p.getA(), p.getB());
    }
    return j;
  }

  /** Create a JSON object from a key value Map */
  public static JSONObject jOTags(Map<String, String> map) {
    final JSONObject tags = new JSONObject();
    JSONObject a = new JSONObject();
    a.putAll(map);
    tags.put("tags", a);
    return tags;
  }

  /** Create a JSON array. */
  public static JSONArray jA(Object... vs) {
    final JSONArray a = new JSONArray();
    for (Object v : vs) {
      a.add(v);
    }
    return a;
  }

  /** Create a JSON array. */
  public static JSONArray jA(List<Object> vs) {
    final JSONArray a = new JSONArray();
    a.addAll(vs);
    return a;
  }

  /** Create a JSON array. */
  public static JSONArray jA(Monadics.ListMonadic vs) {
    final JSONArray a = new JSONArray();
    a.addAll(vs.value());
    return a;
  }

  /** Create a property of a JSON object. */
  public static Tuple<String, Object> p(String key, Object value) {
    return tuple(key, value);
  }

  /** Create an optional property of a JSON object. If <code>value</code> is none the property is not added. */
  public static <A> Tuple<String, Object> p(String key, Option<A> value) {
    return value.map(Jsons.<A> tupleize(key)).getOrElse(ZERO);
  }

  private static <A> Function<A, Tuple<String, Object>> tupleize(final String key) {
    return new Function<A, Tuple<String, Object>>() {
      @Override
      public Tuple<String, Object> apply(A value) {
        return Tuple.<String, Object> tuple(key, value);
      }
    };
  }

  /** Concatenate a list of JSON objects (merging). */
  public static JSONObject conc(JSONObject... js) {
    final JSONObject j = new JSONObject();
    for (JSONObject a : js)
      add(j, a);
    return j;
  }

  private static void add(JSONObject j, JSONObject a) {
    for (Map.Entry e : (Set<Map.Entry>) a.entrySet()) {
      j.put(e.getKey(), e.getValue());
    }
  }
}
