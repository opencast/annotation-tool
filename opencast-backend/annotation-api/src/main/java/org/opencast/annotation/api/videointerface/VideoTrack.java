package org.opencast.annotation.api.videointerface;

import org.opencastproject.util.MimeType;

import java.net.URL;

/**
 * Representation of a single video track for consumption by a frontend video player.
 */
public class VideoTrack {
  private final URL url;
  private final MimeType type;

  /**
   * Class constructor.
   * @param url the URL of the track
   * @param type the MIME type of the track. This should probably match <code>video/*</code>,
   *             although this is not enforced.
   */
  public VideoTrack(URL url, MimeType type) {
    this.url = url;
    this.type = type;
  }

  /**
   * @return the URL of the track
   */
  public URL getUrl() {
    return url;
  }

  /**
   * @return the MIME type of the track
   */
  public MimeType getType() {
    return type;
  }
}
