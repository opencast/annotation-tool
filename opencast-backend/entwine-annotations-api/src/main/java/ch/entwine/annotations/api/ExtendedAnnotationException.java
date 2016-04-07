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

package ch.entwine.annotations.api;

/**
 * Class representing an exception that occurs while storing/retrieving a {@link Resource} from the persistence storage.
 */
public class ExtendedAnnotationException extends RuntimeException {

  /** UUID */
  private static final long serialVersionUID = -4426601487995304459L;

  /**
   * Possible causes
   */
  public enum Cause {
    DUPLICATE, UNAUTHORIZED, NOT_FOUND, SERVER_ERROR
  }

  /** The cause of the exception */
  private final Cause cause;

  /**
   * Create exception with {@link Cause}
   * 
   * @param cause
   *          the cause
   */
  public ExtendedAnnotationException(Cause cause) {
    this.cause = cause;
  }

  /**
   * Create exception with {@link Cause} and throwable
   * 
   * @param cause
   *          the cause
   * @param throwable
   *          the throwable
   */
  public ExtendedAnnotationException(Cause cause, Throwable throwable) {
    super(throwable);
    this.cause = cause;
  }

  /**
   * Return the {@link Cause} of the exception
   * 
   * @return the cause
   */
  public Cause getCauseCode() {
    return cause;
  }
}
