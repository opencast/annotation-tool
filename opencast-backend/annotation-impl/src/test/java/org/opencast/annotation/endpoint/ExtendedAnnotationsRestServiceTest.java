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
package org.opencast.annotation.endpoint;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.iterableWithSize;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.opencast.annotation.Annotations.scalingAnnotation;
import static org.opencast.annotation.Annotations.textAnnotation;
import static org.opencast.annotation.endpoint.ExtendedAnnotationsRestServiceTest.RegexMatcher.regex;
import static org.opencastproject.test.rest.RestServiceTestEnv.testEnvForClasses;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.some;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.impl.AnnotationImpl;
import org.opencast.annotation.impl.ResourceImpl;

import org.opencastproject.test.rest.RestServiceTestEnv;

import io.restassured.http.ContentType;

import org.hamcrest.Description;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import java.util.Date;
import java.util.HashMap;
import java.util.regex.Pattern;

import javax.ws.rs.core.Response;

public class ExtendedAnnotationsRestServiceTest {

  private static final int BAD_REQUEST = Response.Status.BAD_REQUEST.getStatusCode();
  private static final int OK = Response.Status.OK.getStatusCode();
  private static final int CREATED = Response.Status.CREATED.getStatusCode();
  private static final int NOT_FOUND = Response.Status.NOT_FOUND.getStatusCode();
  private static final int NO_CONTENT = Response.Status.NO_CONTENT.getStatusCode();
  private static final int CONFLICT = Response.Status.CONFLICT.getStatusCode();
  private static final String LOCATION = "Location";

  @After
  public void tearDown() {
    given().expect().statusCode(NO_CONTENT).when().delete(host("/reset"));
  }

  @Test
  public void testUser() {
    // put/malformed
    given().formParam("user_extid", "admin").expect().statusCode(BAD_REQUEST).when().put(host("/users"));
    // put
    final String id = extractLocationId(given().formParam("user_extid", "admin").formParam("nickname", "klausi")
            .expect().statusCode(CREATED).header(LOCATION, regex(host("/users/[0-9]+")))
            .body("nickname", equalTo("klausi")).when().post(host("/users")));
    // get
    given().pathParam("id", id).expect().statusCode(OK).body("user_extid", equalTo("admin"))
            .body("nickname", equalTo("klausi")).when().get(host("/users/{id}"));
    // update
    given().formParam("user_extid", "admin").formParam("nickname", "santa").expect().statusCode(OK)
            .body("nickname", equalTo("santa")).when().put(host("/users"));
    given().pathParam("id", id).expect().statusCode(OK).body("nickname", equalTo("santa")).when()
            .get(host("/users/{id}"));
    // post/another one
    given().formParam("user_extid", "klaus2").formParam("nickname", "klausi2").expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/users/[0-9]+"))).body("nickname", equalTo("klausi2")).when()
            .put(host("/users"));
    // post duplicated
    given().formParam("user_extid", "klaus2").formParam("nickname", "klausi2").expect().statusCode(CONFLICT).when()
            .post(host("/users"));
  }

  @Test
  public void testVideo() {
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect()
            .body("user_extid", equalTo("admin")).when().put(host("/users"));
    // put/create
    final String id = extractLocationId(given().formParam("video_extid", "lecture")
            .expect().statusCode(CREATED).header(LOCATION, startsWith(host("/videos/")))
            .body("video_extid", equalTo("lecture")).when().post(host("/videos")));
    // put/update
    given().formParam("video_extid", "lecture").expect().statusCode(OK).body("video_extid", equalTo("lecture")).when()
            .put(host("/videos"));
    // put/create/malformed
    given().contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when().put(host("/videos"));
    given().formParam("video_extid", "").expect().statusCode(BAD_REQUEST).when().put(host("/videos"));
    // get
    given().pathParam("id", id).expect().statusCode(OK).body("video_extid", equalTo("lecture")).when()
            .get(host("/videos/{id}"));
    // post duplicated
    given().formParam("video_extid", "lecture").expect().statusCode(CONFLICT).when().post(host("videos"));
    // delete
    given().pathParam("id", 12345).expect().statusCode(NOT_FOUND).when().delete(host("/videos/{id}"));
    given().pathParam("id", id).expect().statusCode(NO_CONTENT).when().delete(host("/videos/{id}"));
    given().pathParam("id", id).expect().statusCode(NOT_FOUND).when().get(host("/videos/{id}"));
  }

  @Test
  public void testTrack() {
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect()
            .body("user_extid", equalTo("admin")).when().put(host("/users"));
    // put/create
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .header(LOCATION, startsWith(host("/videos"))).body("video_extid", equalTo("lecture")).when()
            .put(host("/videos")));
    // post/malformed video does not exist
    given().pathParam("videoId", 12345).formParam("name", "track").formParam("settings", "{\"type\":\"lecture\"}")
            .expect().statusCode(BAD_REQUEST).when().post(host("/videos/{videoId}/tracks"));
    // post/create
    final String trackId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "track")
            .formParam("settings", "{\"type\":\"lecture\"}").formParam("description", "just a track")
            .expect().statusCode(CREATED).header(LOCATION, startsWith(host("/videos/")))
            .body("description", equalTo("just a track")).when().post(host("/videos/{videoId}/tracks")));
    // post/create with same name
    given().pathParam("videoId", videoId).formParam("name", "track").formParam("settings", "{\"type\":\"lecture\"}")
            .expect().statusCode(CREATED).body("name", equalTo("track")).when().post(host("/videos/{videoId}/tracks"));
    // get/not found
    given().expect().statusCode(NOT_FOUND).when().get(host("/videos/abc/tracks/1"));
    // get
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).expect().statusCode(OK)
            .body("name", equalTo("track")).body("description", equalTo("just a track"))
            .when().get(host("/videos/{videoId}/tracks/{trackId}"));
    // put
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).formParam("name", "track2").expect()
            .statusCode(OK).body("name", equalTo("track2")).when().put(host("/videos/{videoId}/tracks/{trackId}"));

    // get all
    given().pathParam("videoId", videoId).expect().statusCode(OK).body("tracks", iterableWithSize(2)).when()
            .get(host("/videos/{videoId}/tracks"));
    // delete
    given().pathParam("videoId", 12345).pathParam("id", 12345).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{id}"));
    given().pathParam("videoId", videoId).pathParam("id", 12345).expect().statusCode(NOT_FOUND).when()
            .delete(host("/videos/{videoId}/tracks/{id}"));
    given().pathParam("videoId", videoId).pathParam("id", trackId).expect().statusCode(NO_CONTENT).when()
            .delete(host("/videos/{videoId}/tracks/{id}"));
    given().pathParam("videoId", videoId).pathParam("id", trackId).expect().statusCode(NOT_FOUND).when()
            .get(host("/videos/{videoId}/tracks/{id}"));
  }

  @Test
  public void testEqualsIgnoreTimestamp() throws Exception {
    Resource resource = new ResourceImpl(some(Resource.PRIVATE), none(), none(), none(), some(new Date()), none(),
            none(), new HashMap<>());
    final Annotation a = new AnnotationImpl(1, 1, 10D, some(20D), textAnnotation("a text"),
            0, some("the settings"), resource);
    Thread.sleep(10);
    final Annotation b = new AnnotationImpl(1, 1, 10D, some(20D), textAnnotation("a text"),
            0, some("the settings"),
            new ResourceImpl(some(Resource.PRIVATE), none(), none(), none(), some(new Date()), none(), none(),
                    new HashMap<>()));
    final Annotation c = new AnnotationImpl(1, 2, 10D, some(10D), textAnnotation("a text"),
            0, some("the settings"), resource);
    final Annotation d = new AnnotationImpl(1, 1, 10D, some(20D), textAnnotation("another text"),
            0, some("other settings"), resource);
    assertEquals(a, b);
    assertNotEquals(a, c);
    assertNotEquals(a, d);
  }

  @Test
  public void testAnnotation() {
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect()
            .body("user_extid", equalTo("admin")).when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture5").expect().statusCode(CREATED)
            .header(LOCATION, startsWith(host("/videos/"))).when().put(host("/videos")));
    final String trackId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "track")
            .formParam("settings", "{\"type\":\"lecture\"}").formParam("description", "just a track").expect()
            .statusCode(CREATED).header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+"))).when()
            .post(host("/videos/{videoId}/tracks")));
    // post/malformed video does not exist
    given().formParam("content", textAnnotation("cool video")).expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/12345/tracks/12345/annotations"));
    // post
    final String id = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .formParam("content", textAnnotation("cool video")).formParam("start", 40)
            .formParam("settings", "{\"type\":\"test\"}").expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+")))
            .body("content", equalTo(textAnnotation("cool video"))).body("settings", equalTo("{\"type\":\"test\"}"))
            .when().post(host("/videos/{videoId}/tracks/{trackId}/annotations")));
    // get
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("id", id).expect().statusCode(OK)
            .body("content", equalTo(textAnnotation("cool video"))).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).expect().statusCode(OK)
            .body("annotations", iterableWithSize(1)).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations"));
    // post/another one
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).formParam("content", textAnnotation("nice"))
            .formParam("start", 50).expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+")))
            .body("content", equalTo(textAnnotation("nice"))).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).expect().statusCode(OK)
            .body("annotations", iterableWithSize(2)).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations"));
    // delete
    given().pathParam("videoId", 12345).pathParam("trackId", 12345).pathParam("id", 12345).expect()
            .statusCode(BAD_REQUEST).when().delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
    given().pathParam("videoId", 12345).pathParam("trackId", trackId).pathParam("id", 12345).expect()
            .statusCode(BAD_REQUEST).when().delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 12345).pathParam("id", 12345).expect()
            .statusCode(BAD_REQUEST).when().delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("id", 12345).expect()
            .statusCode(NOT_FOUND).when().delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("id", id).expect()
            .statusCode(NO_CONTENT).when().delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("id", id).expect()
            .statusCode(NOT_FOUND).when().get(host("/videos/{videoId}/tracks/{trackId}/annotations/{id}"));
  }

  @Test
  public void testCategory() {
    // create user and video
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect().when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .when().post(host("/videos")));

    given().pathParam("videoId", 333).formParam("name", "categoryName").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/categories"));

    // post
    final String id = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "categoryName")
            .expect().statusCode(CREATED).body("name", equalTo("categoryName")).when()
            .post(host("/videos/{videoId}/categories")));
    // put
    given().pathParam("videoId", videoId).pathParam("categoryId", id).formParam("name", "newName")
            .expect().statusCode(OK).body("name", equalTo("newName")).when()
            .put(host("/videos/{videoId}/categories/{categoryId}"));
    given().pathParam("videoId", 212).pathParam("categoryId", id).contentType(ContentType.URLENC).expect()
            .statusCode(BAD_REQUEST).when().put(host("/videos/{videoId}/categories/{categoryId}"));
    // get
    given().pathParam("videoId", videoId).pathParam("categoryId", id).expect().statusCode(OK)
            .body("name", equalTo("newName")).when().get(host("/videos/{videoId}/categories/{categoryId}"));
    given().pathParam("videoId", 342).pathParam("categoryId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/categories/{categoryId}"));
    // get all
    given().pathParam("videoId", videoId).expect().statusCode(OK)
            .body("categories", iterableWithSize(1)).when().get(host("/videos/{videoId}/categories"));
  }

  @Test
  public void testScale() {
    // create user and video
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect().when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .when().post(host("/videos")));
    // post
    given().pathParam("videoId", 333).formParam("name", "scaleName").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/scales"));

    final String id = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "scaleName")
            .expect().statusCode(CREATED).body("name", equalTo("scaleName"))
            .when().post(host("/videos/{videoId}/scales")));

    // put
    given().pathParam("videoId", 212).pathParam("scaleId", id).contentType(ContentType.URLENC).expect()
            .statusCode(BAD_REQUEST).when().put(host("/videos/{videoId}/scales/{scaleId}"));

    given().pathParam("videoId", videoId).pathParam("scaleId", id).formParam("name", "newName")
            .expect().statusCode(OK).body("name", equalTo("newName")).when()
            .put(host("/videos/{videoId}/scales/{scaleId}"));
    // get
    given().pathParam("videoId", videoId).pathParam("scaleId", id).expect().statusCode(OK)
            .body("name", equalTo("newName")).when().get(host("/videos/{videoId}/scales/{scaleId}"));
    given().pathParam("videoId", 342).pathParam("scaleId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/scales/{scaleId}"));
    // get all
    given().pathParam("videoId", videoId).expect().statusCode(OK)
            .body("scales", iterableWithSize(1)).when().get(host("/videos/{videoId}/scales"));
    // delete
    given().pathParam("scaleId", 12345).expect().statusCode(NOT_FOUND).when().delete(host("/scales/{scaleId}"));
    given().pathParam("videoId", "3290").pathParam("scaleId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/scales/{scaleId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", 32342).expect().statusCode(NOT_FOUND).when()
            .delete(host("/videos/{videoId}/scales/{scaleId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", id).expect().statusCode(OK).when()
            .delete(host("/videos/{videoId}/scales/{scaleId}"));
  }

  @Test
  public void testScaleValue() {
    // create user, video and scale
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect().when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .when().post(host("/videos")));
    final String scaleId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "scaleName")
            .expect().body("name", equalTo("scaleName")).when().post(host("/videos/{videoId}/scales")));
    // post
    given().pathParam("videoId", 333).pathParam("scaleId", scaleId).formParam("name", "scaleName").expect()
            .statusCode(BAD_REQUEST).when().post(host("/videos/{videoId}/scales/{scaleId}/scalevalues"));

    final String id = extractLocationId(given().pathParam("videoId", videoId).pathParam("scaleId", scaleId)
            .formParam("name", "scaleValueName").expect().statusCode(CREATED).body("name", equalTo("scaleValueName"))
            .when().post(host("/videos/{videoId}/scales/{scaleId}/scalevalues")));
    // put
    given().pathParam("videoId", 212).pathParam("scaleId", scaleId).pathParam("scaleValueId", id)
            .contentType(ContentType.URLENC).expect() .statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));

    given().pathParam("videoId", videoId).pathParam("scaleId", scaleId).pathParam("scaleValueId", id)
            .formParam("name", "newName").expect().statusCode(OK).body("name", equalTo("newName")).when()
            .put(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    // get
    given().pathParam("videoId", videoId).pathParam("scaleId", scaleId).pathParam("scaleValueId", 323).expect()
            .statusCode(NOT_FOUND).when().get(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", scaleId).pathParam("scaleValueId", id).expect()
            .statusCode(OK).body("name", equalTo("newName")).when()
            .get(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    given().pathParam("videoId", 342).pathParam("scaleId", scaleId).pathParam("scaleValueId", id).expect()
            .statusCode(BAD_REQUEST).when().get(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", 323).pathParam("scaleValueId", id).expect()
            .statusCode(BAD_REQUEST).when().get(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    // get all
    given().pathParam("videoId", videoId).pathParam("scaleId", scaleId).expect().statusCode(OK)
            .body("scaleValues", iterableWithSize(1)).when()
            .get(host("/videos/{videoId}/scales/{scaleId}/scalevalues"));
    // delete
    given().pathParam("videoId", "3290").pathParam("scaleId", scaleId).pathParam("scaleValueId", id).expect()
            .statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", 322).pathParam("scaleValueId", id).expect()
            .statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", scaleId).pathParam("scaleValueId", 12345).expect()
            .statusCode(NOT_FOUND).when().delete(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
    given().pathParam("videoId", videoId).pathParam("scaleId", scaleId).pathParam("scaleValueId", id).expect()
            .statusCode(OK).when().delete(host("/videos/{videoId}/scales/{scaleId}/scalevalues/{scaleValueId}"));
  }

  @Test
  public void testLabel() {
    // create user, video and scale
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect().when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .when().post(host("/videos")));
    final String categoryId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "categoryName")
            .expect().statusCode(CREATED).when().post(host("/videos/{videoId}/categories")));
    // post
    String id = extractLocationId(given().pathParam("videoId", videoId).pathParam("categoryId", categoryId)
            .formParam("value", "testValue").formParam("abbreviation", "testAbbreviation").expect()
            .statusCode(CREATED).body("abbreviation", equalTo("testAbbreviation")).when()
            .post(host("/videos/{videoId}/categories/{categoryId}/labels")));
    given().pathParam("videoId", videoId).pathParam("categoryId", 3232).formParam("value", "testValue")
            .formParam("abbreviation", "testAbbreviation").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/categories/{categoryId}/labels"));
    given().pathParam("videoId", 333).pathParam("categoryId", categoryId).formParam("value", "testValue")
            .formParam("abbreviation", "testAbbreviation").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/categories/{categoryId}/labels"));
    // put
    given().pathParam("videoId", 212).pathParam("categoryId", categoryId).pathParam("labelId", id)
            .contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", videoId).pathParam("categoryId", categoryId).pathParam("labelId", id)
            .formParam("value", "newValue").formParam("abbreviation", "newAbbreviation")
            .expect().statusCode(OK).body("abbreviation", equalTo("newAbbreviation")).when()
            .put(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    // get
    given().pathParam("videoId", videoId).pathParam("categoryId", categoryId).pathParam("labelId", id).expect()
            .statusCode(OK).body("abbreviation", equalTo("newAbbreviation")).when()
            .get(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", videoId).pathParam("categoryId", categoryId).pathParam("labelId", 323).expect()
            .statusCode(NOT_FOUND).when().get(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", 342).pathParam("categoryId", categoryId).pathParam("labelId", id).expect()
            .statusCode(BAD_REQUEST).when().get(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", videoId).pathParam("categoryId", 323).pathParam("labelId", id).expect()
            .statusCode(BAD_REQUEST).when().get(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    // get all
    given().pathParam("videoId", videoId).pathParam("categoryId", categoryId).expect().statusCode(OK)
            .body("labels", iterableWithSize(1)).when()
            .get(host("/videos/{videoId}/categories/{categoryId}/labels"));
    // delete
    given().pathParam("videoId", "3290").pathParam("categoryId", categoryId).pathParam("labelId", id).expect()
            .statusCode(BAD_REQUEST).when().delete(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", videoId).pathParam("categoryId", 322).pathParam("labelId", id).expect()
            .statusCode(BAD_REQUEST).when().delete(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", videoId).pathParam("categoryId", categoryId).pathParam("labelId", 12345).expect()
            .statusCode(NOT_FOUND).when().delete(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
    given().pathParam("videoId", videoId).pathParam("categoryId", categoryId).pathParam("labelId", id).expect()
            .statusCode(OK).when().delete(host("/videos/{videoId}/categories/{categoryId}/labels/{labelId}"));
  }

  @Test
  public void testComment() {
    // create user, video and scale
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect().when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .when().post(host("/videos")));
    final String trackId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "track")
            .formParam("settings", "{\"type\":\"lecture\"}").formParam("description", "just a track").expect()
            .statusCode(CREATED).header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+"))).when()
            .post(host("/videos/{videoId}/tracks")));
    final String annotationId = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .formParam("content", textAnnotation("cool video")).formParam("start", 40).formParam("settings", "{\"type\":\"test\"}")
            .expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+")))
            .body("content", equalTo(textAnnotation("cool video"))).body("settings", equalTo("{\"type\":\"test\"}")).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations")));

    // post
    final String id = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).formParam("text", "New comment")
            .expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+/comments/[0-9]+")))
            .body("text", equalTo("New comment")).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments")));
    given().pathParam("videoId", 323233).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .formParam("text", "New comment").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments"));
    given().pathParam("videoId", videoId).pathParam("trackId", 242332).pathParam("annotationId", annotationId)
            .formParam("text", "New comment").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 4232423)
            .formParam("text", "New comment").expect().statusCode(BAD_REQUEST).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments"));

    // put
    given().pathParam("videoId", 323233).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 32423234).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 32323)
            .pathParam("commentId", id).contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));

    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).formParam("text", "Updated comment").expect().statusCode(OK)
            .body("text", equalTo("Updated comment")).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));

    // get
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(OK).body("text", equalTo("Updated comment")).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", 42323).expect().statusCode(NOT_FOUND).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", 3232).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 5567).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 8542)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));

    // get all
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .formParam("text", "Second comment").expect().statusCode(CREATED).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments"));

    given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).expect().statusCode(OK)
            .body("comments", iterableWithSize(2)).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments"));

    // delete
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", 42323).expect().statusCode(NOT_FOUND).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(NO_CONTENT).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", 67243).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 5252).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 5472)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
  }

  @Test
  public void testAnnotationResponseHeredity() {
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect()
            .body("user_extid", equalTo("admin")).when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture5").expect().statusCode(CREATED)
            .header(LOCATION, startsWith(host("/videos/"))).when().put(host("/videos")));
    final String trackId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "track")
            .formParam("settings", "{\"type\":\"lecture\"}").formParam("description", "just a track").expect()
            .statusCode(CREATED).header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+"))).when()
            .post(host("/videos/{videoId}/tracks")));
    final String scaleId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "scaleName")
            .expect().when().post(host("/videos/{videoId}/scales")));
    final String scaleValueId = extractLocationId(given().pathParam("videoId", videoId).pathParam("scaleId", scaleId)
            .formParam("name", "scaleValueName").expect().statusCode(CREATED).when()
            .post(host("/videos/{videoId}/scales/{scaleId}/scalevalues")));
    final String categoryId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "categoryName")
            .expect().statusCode(CREATED).when().post(host("/videos/{videoId}/categories")));
    final String labelId = extractLocationId(given().pathParam("videoId", videoId).pathParam("categoryId", categoryId)
            .formParam("value", "testValue").formParam("abbreviation", "testAbbreviation").expect().statusCode(CREATED)
            .when().post(host("/videos/{videoId}/categories/{categoryId}/labels")));

    // post
    given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .formParam("content", scalingAnnotation(Long.parseLong(labelId), Long.parseLong(scaleValueId)))
            .formParam("start", 40).formParam("settings", "{\"type\":\"test\"}")
            .expect().statusCode(CREATED)
            .body("content", equalTo(scalingAnnotation(Long.parseLong(labelId), Long.parseLong(scaleValueId))))
            .when().post(host("/videos/{videoId}/tracks/{trackId}/annotations"));
  }

  @Test
  public void testReply() {
    // create user, video, annotation and comment
    given().formParam("user_extid", "admin").formParam("nickname", "klausi").expect().when().put(host("/users"));
    final String videoId = extractLocationId(given().formParam("video_extid", "lecture").expect().statusCode(CREATED)
            .when().post(host("/videos")));
    final String trackId = extractLocationId(given().pathParam("videoId", videoId).formParam("name", "track")
            .formParam("settings", "{\"type\":\"lecture\"}").formParam("description", "just a track").expect()
            .statusCode(CREATED).header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+"))).when()
            .post(host("/videos/{videoId}/tracks")));
    final String annotationId = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .formParam("content", textAnnotation("cool video")).formParam("start", 40).formParam("settings", "{\"type\":\"test\"}")
            .expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+")))
            .body("content", equalTo(textAnnotation("cool video"))).body("settings", equalTo("{\"type\":\"test\"}")).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations")));

    final String commentId = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).formParam("text", "New comment")
            .expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+/comments/[0-9]+")))
            .body("text", equalTo("New comment")).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments")));

    // post
    final String id = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).pathParam("commentId", commentId).formParam("text", "New reply")
            .expect().statusCode(CREATED)
            .header(LOCATION, regex(host("/videos/[0-9]+/tracks/[0-9]+/annotations/[0-9]+/comments/[0-9]+")))
            .body("text", equalTo("New reply")).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies")));
    given().pathParam("videoId", 323233).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", commentId).formParam("text", "New reply").expect().statusCode(BAD_REQUEST)
            .when().post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));
    given().pathParam("videoId", videoId).pathParam("trackId", 242332).pathParam("annotationId", annotationId)
            .pathParam("commentId", commentId).formParam("text", "New reply").expect().statusCode(BAD_REQUEST)
            .when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 4232423)
            .pathParam("commentId", commentId).formParam("text", "New reply").expect().statusCode(BAD_REQUEST)
            .when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));

    // put
    given().pathParam("videoId", 323233).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 32423234).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 32323)
            .pathParam("commentId", id).contentType(ContentType.URLENC).expect().statusCode(BAD_REQUEST).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));

    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).formParam("text", "Updated reply").expect().statusCode(OK)
            .body("text", equalTo("Updated reply")).when()
            .put(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));

    // get
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(OK).body("text", equalTo("Updated reply"))
            .when().get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", 42323).expect().statusCode(NOT_FOUND).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", 3232).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 5567).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 8542)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));

    // get all comments from annotation, excluding replies
    final String commentId2 = extractLocationId(given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).formParam("text", "Second comment").expect()
            .statusCode(CREATED).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments")));

    given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).expect().statusCode(OK)
            .body("comments", iterableWithSize(2)).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments"));

    // get all replies to a comment
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", commentId).formParam("text", "Another reply").expect().statusCode(CREATED).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", commentId2).formParam("text", "Reply to second comment").expect()
            .statusCode(CREATED).when()
            .post(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));

    given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).pathParam("commentId", commentId).expect().statusCode(OK)
            .body("comments", iterableWithSize(2)).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId)
            .pathParam("annotationId", annotationId).pathParam("commentId", commentId2).expect().statusCode(OK)
            .body("comments", iterableWithSize(1)).when()
            .get(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}/replies"));

    // delete
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", 42323).expect().statusCode(NOT_FOUND).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(NO_CONTENT).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", 67243).pathParam("trackId", trackId).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", 5252).pathParam("annotationId", annotationId)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
    given().pathParam("videoId", videoId).pathParam("trackId", trackId).pathParam("annotationId", 5472)
            .pathParam("commentId", id).expect().statusCode(BAD_REQUEST).when()
            .delete(host("/videos/{videoId}/tracks/{trackId}/annotations/{annotationId}/comments/{commentId}"));
  }

  // --

  static final RestServiceTestEnv rt = testEnvForClasses(TestRestService.class);

  @BeforeClass
  public static void setUp() {
    rt.setUpServer();
  }

  @AfterClass
  public static void tearDownAfterClass() {
    rt.tearDownServer();
  }

  // shortcut to testEnv.host
  public static String host(String path) {
    return rt.host(path);
  }

  private static String extractLocationId(io.restassured.response.Response r) {
    String[] segments = r.header(LOCATION).split("/");
    return segments[segments.length - 1];
  }

  static class RegexMatcher extends org.hamcrest.BaseMatcher<String> {
    private final Pattern p;

    RegexMatcher(String pattern) {
      p = Pattern.compile(pattern);
    }

    static RegexMatcher regex(String pattern) {
      return new RegexMatcher(pattern);
    }

    @Override
    public boolean matches(Object item) {
      return item != null && p.matcher(item.toString()).matches();
    }

    @Override
    public void describeTo(Description description) {
      description.appendText("regex [" + p.pattern() + "]");
    }
  }
}
