/**
 *  Copyright 2017, ELAN e.V., Germany
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
package org.opencast.annotation.endpoint.util;

import static org.opencastproject.util.data.functions.Strings.asStringNull;

import org.json.simple.JSONObject;

import javax.ws.rs.core.Response;

/** Utilities to make responding simpler. */
public class Responses {
  private Responses() {}

  /**
   * Generates a <tt>200 OK</tt> response with a JSON body.
   *
   * @param o the JSON body of the response
   * @return the generated {@link Response}
   */
  public static Response buildOk(final JSONObject o) {
    return Response.ok(asStringNull().apply(o)).build();
  }
}
