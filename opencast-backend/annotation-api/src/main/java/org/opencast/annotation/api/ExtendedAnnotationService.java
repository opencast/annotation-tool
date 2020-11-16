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

import org.opencastproject.mediapackage.MediaPackage;
import org.opencastproject.util.data.Option;

import java.util.Date;
import java.util.List;
import java.util.Map;

public interface ExtendedAnnotationService {

  /**
   * Create a new user.
   * 
   * @param extId
   *          the user's external id
   * @param nickname
   *          the user's nickname
   * @param email
   *          the user's email
   * @param resource
   *          the base {@link Resource}
   * @return the created user
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  User createUser(String extId, String nickname, Option<String> email, Resource resource)
          throws ExtendedAnnotationException;

  /**
   * Update an existing user.
   * 
   * @param u
   *          the user to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateUser(User u) throws ExtendedAnnotationException;

  /**
   * Delete a user.
   * 
   * @param u
   *          the user
   * @return true if the user existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteUser(User u) throws ExtendedAnnotationException;

  /**
   * Clear all annotation tables
   * 
   * @return true if all tables could be successfully cleared.
   * @throws ExtendedAnnotationException
   *           if an error occurs while deleting from persistence storage
   */
  boolean clearDatabase() throws ExtendedAnnotationException;

  /**
   * Get a user by id.
   * 
   * @param id
   *          the user's internal id
   * @return the requested user
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<User> getUser(long id) throws ExtendedAnnotationException;

  /**
   * Get all users
   * 
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to annotations modified since the said date
   * @return the user list or an empty list if no user has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<User> getUsers(Option<Integer> offset, Option<Integer> limit, Option<Date> since)
          throws ExtendedAnnotationException;

  /**
   * Get a user by his external id, which is the id he has in the surrounding video portal.
   * 
   * @param id
   *          the user's external id
   * @return the user
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<User> getUserByExtId(String id) throws ExtendedAnnotationException;

  /**
   * Create a new video.
   * 
   * @param extId
   *          the video's id in the surrounding video portal.
   * @param resource
   *          the base {@link Resource}
   * @return the created video
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Video createVideo(String extId, Resource resource) throws ExtendedAnnotationException;

  /**
   * Update a video.
   * 
   * @param v
   *          the video to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateVideo(Video v) throws ExtendedAnnotationException;

  /**
   * Delete a video.
   * 
   * @param v
   *          the video
   * @return true if the video existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteVideo(Video v) throws ExtendedAnnotationException;

  /**
   * Get a video by id.
   * 
   * @param id
   *          the video id
   * @return the video
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Video> getVideo(long id) throws ExtendedAnnotationException;

  /**
   * Get all videos.
   * 
   * @return the video list or an empty list if no videos has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<Video> getVideos() throws ExtendedAnnotationException;

  /**
   * Get a video by its external id, which is the id it has in to surrounding video portal.
   * 
   * @param id
   *          videos external id
   * @return the video
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Video> getVideoByExtId(String id) throws ExtendedAnnotationException;

  /**
   * Create a new track in a given video.
   * 
   * @param videoId
   *          the video id
   * @param name
   *          the name
   * @param description
   *          the description
   * @param settings
   *          the settings
   * @param resource
   *          the base {@link Resource}
   * @return the created track
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Track createTrack(long videoId, String name, Option<String> description, Option<String> settings,
          Resource resource) throws ExtendedAnnotationException;

  /**
   * Create a track with a certain track.
   * 
   * @param track
   *          the track to store
   * @return the stored track
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Track createTrack(Track track) throws ExtendedAnnotationException;

  /**
   * Update a track of a video.
   * 
   * @param track
   *          the track to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateTrack(Track track) throws ExtendedAnnotationException;

  /**
   * Delete a track.
   * 
   * @param track
   *          the track to delete
   * @return true if the track existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteTrack(Track track) throws ExtendedAnnotationException;

  /**
   * Get a track.
   * 
   * @param id
   *          the track id
   * @return the requested track
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Track> getTrack(long id) throws ExtendedAnnotationException;

  /**
   * Get all tracks from a video.
   * 
   * @param videoId
   *          the video id
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to annotations modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the track list or an empty list if no track has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<Track> getTracks(long videoId, Option<Integer> offset, Option<Integer> limit, Option<Date> since,
          Option<Map<String, String>> tagsAnd, Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException;

  /**
   * Annotate a track of a video.
   * 
   * @param trackId
   *          the track id
   * @param start
   *          the annotation entry timepoint in seconds
   * @param duration
   *          the duration of the annotation in seconds
   * @param content
   *          the content of the annotation
   * @param resource
   *          the base {@link Resource}
   * @return the created annotation
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Annotation createAnnotation(long trackId, double start, Option<Double> duration, String content,
          Option<String> settings, Resource resource) throws ExtendedAnnotationException;

  /**
   * Create an annotation with a certain annotation.
   * 
   * @param annotation
   *          the annotation to store
   * @return the stored annotation
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Annotation createAnnotation(Annotation annotation) throws ExtendedAnnotationException;

  /**
   * Update an annotation.
   * 
   * @param annotation
   *          the annotation to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateAnnotation(Annotation annotation) throws ExtendedAnnotationException;

  /**
   * Delete an annotation.
   * 
   * @param annotation
   *          the annotation to delete
   * @return true if the annotation existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteAnnotation(Annotation annotation) throws ExtendedAnnotationException;

  /**
   * Get an annotation.
   * 
   * @param id
   *          the annotation id
   * @return the requested annotation
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Annotation> getAnnotation(long id) throws ExtendedAnnotationException;

  /**
   * Get annotations of a track.
   * 
   * @param trackId
   *          the track id
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to annotations modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the annotation list or an empty list if no annotation has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<Annotation> getAnnotations(long trackId, Option<Double> start, Option<Double> end, Option<Integer> offset,
          Option<Integer> limit, Option<Date> since, Option<Map<String, String>> tagsAnd,
          Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException;

  /**
   * Create a scale
   * 
   * @param videoId
   *          the video id or none if it is a template scale
   * @param name
   *          the scale name
   * @param description
   *          the scale description
   * @return the created scale
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Scale createScale(Option<Long> videoId, String name, Option<String> description, Resource resource)
          throws ExtendedAnnotationException;

  /**
   * Creates a copy of a templates scale
   * 
   * @param videoId
   *          the video id
   * @param templateScale
   *          the template scale to copy
   * @param resource
   *          the resource
   * @return the created scale
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storages
   */
  Scale createScaleFromTemplate(long videoId, long templateScale, Resource resource) throws ExtendedAnnotationException;

  /**
   * Get a scale by id.
   * 
   * @param id
   *          the scale id
   * @param includeDeleted
   *          if <code>true</code> it will find also deleted scales
   * @return the scale
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Scale> getScale(long id, boolean includeDeleted) throws ExtendedAnnotationException;

  /**
   * Get all scales from a video.
   * 
   * @param videoId
   *          the video id
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to annotations modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the scale list or an empty list if no scale has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<Scale> getScales(Option<Long> videoId, Option<Integer> offset, Option<Integer> limit, Option<Date> since,
          Option<Map<String, String>> tagsAnd, Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException;

  /**
   * Update a scale.
   * 
   * @param scale
   *          the scale to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateScale(Scale scale) throws ExtendedAnnotationException;

  /**
   * Delete a scale.
   * 
   * @param scale
   *          the scale to delete
   * @return true if the scale existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteScale(Scale scale) throws ExtendedAnnotationException;

  /**
   * Create a scale value
   * 
   * @param name
   *          the scale name
   * @param value
   *          the scale value
   * @param order
   *          the scale order
   * @param sclaeId
   *          the scaleId
   * @param resource
   *          the resource
   * @return the created scale value
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  ScaleValue createScaleValue(long scaleId, String name, double value, int order, Resource resource)
          throws ExtendedAnnotationException;

  /**
   * Get a scale value by id.
   * 
   * @param id
   *          the scale value id
   * @return the scale value
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<ScaleValue> getScaleValue(long id) throws ExtendedAnnotationException;

  /**
   * Get all scale values from a scale.
   * 
   * @param scaleId
   *          the scale id
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to annotations modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the scale value list or an empty list if no scale values has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<ScaleValue> getScaleValues(long scaleId, Option<Integer> offset, Option<Integer> limit, Option<Date> since,
          Option<Map<String, String>> tagsAnd, Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException;

  /**
   * Update a scale value
   * 
   * @param scaleValue
   *          the scale value to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateScaleValue(ScaleValue scaleValue) throws ExtendedAnnotationException;

  /**
   * Delete a scale value
   * 
   * @param scaleValue
   *          the scale value to delete
   * @return true if the scale value existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteScaleValue(ScaleValue scaleValue) throws ExtendedAnnotationException;

  /**
   * Creates a template category
   * 
   * @param videoId
   *          the video id
   * @param scaleId
   *          the scale that is used for this category
   * @param name
   *          the category name
   * @param description
   *          the category description
   * @param settings
   *          the category settings
   * @param resource
   *          the resource
   * @return the created category
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Category createCategory(Option<Long> videoId, Option<Long> scaleId, String name, Option<String> description,
          Option<String> settings, Resource resource) throws ExtendedAnnotationException;

  /**
   * Creates a category
   * 
   * @param videoId
   *          the video id where the category is
   * @param scaleId
   *          the scale that is used for this category
   * @param name
   *          the category name
   * @param description
   *          the category description
   * @param settings
   *          the category settings
   * @param resource
   *          the resource
   * @return the created category
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Category> createCategoryFromTemplate(long videoId, long templateCategoryId, Resource resource)
          throws ExtendedAnnotationException;

  /**
   * Get a category value by id.
   * 
   * @param id
   *          the category value id
   * @param includeDeleted
   *          if <code>true</code> it will find also deleted categories
   * @return the category
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Category> getCategory(long id, boolean includeDeleted) throws ExtendedAnnotationException;

  /**
   * Get all categories from a video.
   * 
   * @param videoId
   *          the video id
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to annotations modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the category list or an empty list if no categories has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<Category> getCategories(Option<Long> videoId, Option<Integer> offset, Option<Integer> limit, Option<Date> since,
          Option<Map<String, String>> tagsAnd, Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException;

  /**
   * Update a category.
   * 
   * @param category
   *          the category to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateCategory(Category category) throws ExtendedAnnotationException;

  /**
   * Delete a category.
   * 
   * @param category
   *          the category to delete
   * @return true if the category existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteCategory(Category category) throws ExtendedAnnotationException;

  /**
   * Creates a label
   * 
   * @param categoryId
   *          the category id of this label
   * @param value
   *          the label value
   * @param abbreviation
   *          the label abbreviation
   * @param description
   *          the label description
   * @param settings
   *          the label settings
   * @param resource
   *          the resource
   * @return the created label
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Label createLabel(long categoryId, String value, String abbreviation, Option<String> description,
          Option<String> settings, Resource resource) throws ExtendedAnnotationException;

  /**
   * Get a label by id.
   * 
   * @param id
   *          the label id
   * @param includeDeleted
   *          if <code>true</code> it will find also deleted labels
   * @return the label
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  Option<Label> getLabel(long id, boolean includeDeleted) throws ExtendedAnnotationException;

  /**
   * Get all labels from a video.
   * 
   * @param categoryId
   *          the category id
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to lables modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the label list or an empty list if no labels has been found
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  List<Label> getLabels(long categoryId, Option<Integer> offset, Option<Integer> limit, Option<Date> since,
          Option<Map<String, String>> tagsAnd, Option<Map<String, String>> tagsOr) throws ExtendedAnnotationException;

  /**
   * Update a label.
   * 
   * @param label
   *          the label to update
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  void updateLabel(Label label) throws ExtendedAnnotationException;

  /**
   * Delete a label.
   * 
   * @param label
   *          the label to delete
   * @return true if the label existed and could be successfully deleted.
   * @throws ExtendedAnnotationException
   *           if an error occurs while storing/retrieving from persistence storage
   */
  boolean deleteLabel(Label label) throws ExtendedAnnotationException;

  /**
   * Creates a comment
   * 
   * @param annotationId
   *          the annotation id
   * @param replyToId
   *          the id of the comment that the new comment is a reply to
   * @param text
   *          the comment text
   * @param resource
   *          the resource
   * @return the created comment
   */
  Comment createComment(long annotationId, Option<Long> replyToId, String text, Resource resource);

  /**
   * Get a comment by id.
   * 
   * @param id
   *          the comment id
   * @return the comment
   */
  Option<Comment> getComment(long id);

  /**
   * Get all comments from an annotation
   * 
   * @param annotationId
   *          the annotation id
   * @param replyToId
   *          id of the comment to ge the replies to
   * @param offset
   *          pagination offset
   * @param limit
   *          limit the result set to the said amount
   * @param since
   *          limit the result set to comments modified since the said date
   * @param tagsAnd
   *          the tags logical AND Map
   * @param tagsOr
   *          the tags logical OR Map
   * @return the comment list or an empty list if no comments has been found
   */
  List<Comment> getComments(long annotationId, Option<Long> replyToId, Option<Integer> offset, Option<Integer> limit,
          Option<Date> since, Option<Map<String, String>> tagsAnd, Option<Map<String, String>> tagsOr);

  /**
   * Update a comment
   * 
   * @param comment
   *          the comment to update
   */
  void updateComment(Comment comment);

  /**
   * Delete a comment.
   * 
   * @param comment
   *          the comment to delete
   * @return true if the comment existed and could be successfully deleted.
   */
  boolean deleteComment(Comment comment);

  /**
   * Create the base {@link Resource} for logging.
   * 
   * @return the base resource
   */
  Resource createResource();

  /**
   * Create the base {@link Resource} for logging with tags.
   * 
   * @param tags
   *          the tags map
   * 
   * @return the base resource
   */
  Resource createResource(Option<Map<String, String>> tags);

  /**
   * Create the base {@link Resource} for logging with tags and access
   * 
   * @param access
   *          the access level from the resource
   * @param tags
   *          the tags map
   * @return the base resource
   */
  Resource createResource(Option<Integer> access, Option<Map<String, String>> tags);

  /**
   * Update the resource update information
   * 
   * @param resource
   *          the base resource to update
   * @return the updated base resource
   */
  Resource updateResource(Resource resource);

  /**
   * Update the resource update information with tags
   * 
   * @param resource
   *          the base resource to update
   * @param tags
   *          the tags map
   * @return the updated base resource
   */
  Resource updateResource(Resource resource, Option<Map<String, String>> tags);

  /**
   * Update the resource deletion information
   * 
   * @param resource
   *          the base resource to update
   * @return the updated base resource
   */
  Resource deleteResource(Resource resource);

  /**
   * Checks if the current user has access to the given resource
   * 
   * @param resource
   *          the resource to check for access
   * @return true if the current user has access to the resource
   */
  boolean hasResourceAccess(Resource resource);

  /**
   * Checks whether the current user has a certain ACL action on a media package
   * 
   * @param mediaPackage
   *          the media package to check for access
   * @param access
   *          a string representing the ACL action to check for
   * @return true if the user has the given ACL action on the given video
   */
  boolean hasVideoAccess(MediaPackage mediaPackage, String access);

  /** String representing the `annotate` ACL action */
  String ANNOTATE_ACTION = "annotate";
  /** String representing the `annotate-admin` ACL action */
  String ANNOTATE_ADMIN_ACTION = "annotate-admin";

  /**
   * Find the Opencast media package based on its id
   * 
   * @param id
   *          the Opencast-level id of a media package
   * @return the media package corresponding to the given id, if it can be found
   */
  Option<MediaPackage> findMediaPackage(String id);
}
