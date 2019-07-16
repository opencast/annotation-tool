// TODO Copyright header?!
package org.opencast.annotation.impl.videointerface;

import javax.servlet.http.HttpServletRequest;

// TODO JavaDoc
public class Requests {
  public static String getHeaderOrParam(HttpServletRequest request, String name) {
    return getHeaderOrParam(request, name, name);
  }

  public static String getHeaderOrParam(HttpServletRequest request, String headerName, String paramName) {
    String result = request.getHeader(headerName);
    if (result != null) return result;
    result = request.getParameter(paramName);
    // TODO Is this really how you want to report this?
    //   Especially in levels higher up?
    if (result == null) throw new IllegalArgumentException(String.format(
            "parameter not found in request as header %s or query parameter %s", headerName, paramName));
    return result;
  }
}
