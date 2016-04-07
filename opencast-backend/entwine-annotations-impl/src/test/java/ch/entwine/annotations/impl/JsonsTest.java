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

import static ch.entwine.annotations.impl.Jsons.conc;
import static ch.entwine.annotations.impl.Jsons.jO;
import static ch.entwine.annotations.impl.Jsons.p;

import org.json.simple.JSONObject;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class JsonsTest {
  @Test
  public void testComposition() {
    final JSONObject a = conc(jO(p("name", "Karl"),
                                 p("city", "Paris")),
                              jO(p("age", 79)));
    assertTrue(a.containsKey("age"));
    assertTrue(a.containsKey("name"));
    assertTrue(a.containsKey("city"));
    final JSONObject x = jO(p("name", "Karl"),
                            p("city", "Paris"));
    final JSONObject y = jO(p("name", "Peter"));
    final JSONObject z = conc(x, y);
    assertEquals("Karl", x.get("name"));
    assertEquals("Peter", y.get("name"));
    assertEquals("Peter", z.get("name"));
    assertFalse(y.containsKey("city"));
  }
}
