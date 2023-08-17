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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.opencastproject.db.DBTestEnv.getDbSessionFactory;
import static org.opencastproject.db.DBTestEnv.newEntityManagerFactory;
import static org.opencastproject.util.data.Option.none;
import static org.opencastproject.util.data.Option.some;

import org.opencast.annotation.api.Annotation;
import org.opencast.annotation.api.Category;
import org.opencast.annotation.api.Comment;
import org.opencast.annotation.api.ExtendedAnnotationException;
import org.opencast.annotation.api.ExtendedAnnotationException.Cause;
import org.opencast.annotation.api.ExtendedAnnotationService;
import org.opencast.annotation.api.Label;
import org.opencast.annotation.api.Resource;
import org.opencast.annotation.api.Scale;
import org.opencast.annotation.api.ScaleValue;
import org.opencast.annotation.api.Track;
import org.opencast.annotation.api.User;
import org.opencast.annotation.api.Video;
import org.opencast.annotation.impl.persistence.ExtendedAnnotationServiceJpaImpl;

import org.opencastproject.search.api.SearchService;
import org.opencastproject.security.api.AuthorizationService;
import org.opencastproject.security.api.DefaultOrganization;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.security.util.SecurityUtil;
import org.opencastproject.util.data.Effect0;
import org.opencastproject.util.data.Option;

import org.easymock.EasyMock;
import org.junit.Before;
import org.junit.Test;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ExtendedAnnotationServiceJpaImplTest {

  private Option<Map<String, String>> tags;

  @Before
  public void setUp() {
    Map<String, String> tagsMap = new HashMap<>();
    tagsMap.put("channel", "7832");
    tagsMap.put("room", "B1");
    tags = Option.some(tagsMap);
  }

  @Test
  public void testCreateAndFindUser() throws Exception {
    ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);
    final User u = eas.createUser("k_dall", "Karl Dall", none(), resource);
    eas.createUser("k_dall2", "Karl Dall2", none(), resource);
    eas.createUser("k_dall3", "Karl Dall3", none(), resource);
    assertEquals("k_dall", u.getExtId());
    assertEquals("Karl Dall", u.getNickname());
    assertEquals(none(), u.getEmail());
    assertTrue(eas.getUser(u.getId()).isSome());
    assertEquals("k_dall", eas.getUser(u.getId()).get().getExtId());
    assertTrue(eas.getUserByExtId(u.getExtId()).isSome());
    assertEquals("Karl Dall", eas.getUserByExtId(u.getExtId()).get().getNickname());
    assertEquals(tags.get(), u.getTags());

    assertEquals(3, eas.getUsers(none(), none(), none()).size());
    assertEquals(2, eas.getUsers(some(1), none(), none()).size());
    assertEquals(1, eas.getUsers(some(1), some(1), none()).size());

    // get all since
    Thread.sleep(10);
    assertEquals(0, eas.getUsers(none(), none(), some(new Date())).size());
    Calendar c = Calendar.getInstance();
    c.add(Calendar.MINUTE, -1);
    assertEquals(3, eas.getUsers(none(), none(), some(c.getTime())).size());
  }

  @Test
  public void testCreateDuplicateUser() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    eas.createUser("jsbach", "J.S. Bach", none(), resource);
    expectCause(Cause.DUPLICATE, new Effect0() {
      @Override
      protected void run() {
        eas.createUser("jsbach", "J.S. Bach", none(), resource);
      }
    });
  }

  @Test
  public void testUpdateUser() {
    ExtendedAnnotationService eas = newExtendedAnnotationService();
    Resource resource = eas.createResource();
    final User u = eas.createUser("jsbach", "J.S. Bach", some("js@bach.de"), resource);
    assertTrue(eas.getUser(u.getId()).isSome());
    assertEquals(some("js@bach.de"), eas.getUser(u.getId()).get().getEmail());

    resource = eas.updateResource(resource, tags);
    eas.updateUser(new UserImpl(u.getId(), u.getExtId(), "Bach", none(), resource));
    assertEquals("Bach", eas.getUser(u.getId()).get().getNickname());
    assertEquals(none(), eas.getUser(u.getId()).get().getEmail());
    assertEquals(tags.get(), eas.getUser(u.getId()).get().getTags());
  }

  @Test
  public void testUpdateNonExistingUser() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateUser(new UserImpl(999, "klaus", "Klaus", none(), resource));
      }
    });
  }

  @Test
  public void testDeleteUser() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create
    final User u = eas.createUser("deletuser", "J.S. Bach", some("js@bach.de"), resource);
    assertTrue(eas.getUser(u.getId()).isSome());
    // delete
    eas.deleteUser(u);
    assertTrue(eas.getUser(u.getId()).isNone());
  }

  @Test
  public void testCreateFindAndDeleteVideo() {
    ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);
    final Video v = eas.createVideo("lecture1", resource);
    assertTrue(eas.getVideo(v.getId()).isSome());
    assertTrue(eas.getVideoByExtId("lecture1").isSome());
    assertEquals(tags.get(), v.getTags());
    eas.deleteVideo(v);
    assertTrue(eas.getUserByExtId("lecture1").isNone());
  }

  @Test
  public void testCreateDuplicateVideo() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    eas.createVideo("lecture", resource);
    expectCause(Cause.DUPLICATE, new Effect0() {
      @Override
      protected void run() {
        eas.createVideo("lecture", resource);
      }
    });
  }

  @Test
  public void testUpdateVideo() {
    ExtendedAnnotationService eas = newExtendedAnnotationService();
    Resource resource = eas.createResource();
    final Video v = eas.createVideo("lecture", resource);
    assertTrue(eas.getVideo(v.getId()).isSome());
    assertEquals("lecture", eas.getVideo(v.getId()).get().getExtId());

    resource = eas.updateResource(resource, tags);
    eas.updateVideo(new VideoImpl(v.getId(), "talk", resource));
    assertEquals("talk", eas.getVideo(v.getId()).get().getExtId());
    assertEquals(tags.get(), eas.getVideo(v.getId()).get().getTags());
  }

  @Test
  public void testUpdateNonExistingVideo() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateVideo(new VideoImpl(999, "lecture", resource));
      }
    });
  }

  @Test
  public void testTrack() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(some(Resource.PUBLIC), tags);
    final Video v = eas.createVideo("lecture1", resource);
    final Track t = eas.createTrack(v.getId(), "track1", none(), none(), resource);
    // try adding a track to a non existing video
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.createTrack(999, "track1", none(), none(), resource);
      }
    });
    // add another video
    eas.createTrack(v.getId(), "track2", none(), none(), resource);
    eas.createTrack(v.getId(), "track3", none(), none(), resource);

    assertTrue(eas.getTrack(3478813).isNone());
    assertTrue(eas.getTrack(t.getId()).isSome());
    assertEquals("track1", eas.getTrack(t.getId()).get().getName());
    assertEquals(tags.get(), t.getTags());
    // update track
    String updatedSettings = "new settings";
    eas.updateTrack(new TrackImpl(t.getId(), t.getVideoId(), t.getName(), t.getDescription(), some(updatedSettings),
            resource));
    assertEquals(updatedSettings, eas.getTrack(t.getId()).get().getSettings().get());
    // get all/non existing track
    assertTrue(eas.getTracks(12345, none(), none(), none(), Option.none(), Option.none()).isEmpty());
    // get all
    assertEquals(
            3,
            eas.getTracks(v.getId(), none(), none(), none(), Option.none(), Option.none()).size());
    assertEquals(
            2,
            eas.getTracks(v.getId(), some(1), none(), none(), Option.none(), Option.none()).size());
    assertEquals(
            1,
            eas.getTracks(v.getId(), some(1), some(1), none(), Option.none(), Option.none()).size());
  }

  @Test
  public void testTrackWithSettings() {
    ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    final Video v = eas.createVideo("lecture", resource);
    final Track t = eas.createTrack(v.getId(), "track1", none(), some("{color:blue, url:http://localhost}"), resource);
    assertTrue(eas.getTrack(t.getId()).isSome());
    assertEquals("{color:blue, url:http://localhost}", eas.getTrack(t.getId()).get().getSettings().get());
  }

  @Test
  public void testDeleteTrack() {
    ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    final Video v = eas.createVideo("lecture", resource);
    final Track t = eas.createTrack(v.getId(), "track99", none(), some("{color:blue, url:http://localhost}"), resource);
    assertTrue(eas.getTrack(t.getId()).isSome());
    eas.deleteTrack(t);
    assertTrue(eas.getTrack(t.getId()).isNone());
  }

  @Test
  public void testCreateAndFindAnnotation() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(some(Resource.PUBLIC), tags);
    final Video v = eas.createVideo("lecture", resource);
    final Track t = eas.createTrack(v.getId(), "track1", none(), none(), resource);
    // create
    final Annotation a = eas.createAnnotation(t.getId(), some("cool video"), 20.0D, some(10.0D), none(), none(), none(),
            resource);
    eas.createAnnotation(t.getId(), some("nice!"), 30.0D, some(3.0D), none(), none(), none(), resource);
    eas.createAnnotation(t.getId(), some("look at this"), 40.0D, some(5.0D), none(), none(), none(), resource);
    // get
    assertTrue(eas.getAnnotation(a.getId()).isSome());
    assertEquals(some("cool video"), eas.getAnnotation(a.getId()).get().getText());
    assertEquals(tags.get(), a.getTags());
    // get all/non existing track
    assertTrue(eas.getAnnotations(12345, none(), none(), none(), none(), none(), Option.none(), Option.none())
            .isEmpty());
    // get all
    assertEquals(
            3,
            eas.getAnnotations(t.getId(), none(), none(), none(), none(), none(), Option.none(), Option.none()).size());
    assertEquals(
            2,
            eas.getAnnotations(t.getId(), none(), none(), some(1), none(), none(), Option.none(), Option.none()).size());
    assertEquals(
            1,
            eas.getAnnotations(t.getId(), none(), none(), some(1), some(1), none(), Option.none(), Option.none())
                    .size());
    // get all since
    // Thread.sleep(10);
    // assertEquals(0, eas.getAnnotations(t.getId(), none(), none(), none(), none(), some(new Date())).size());
    // Calendar c = Calendar.getInstance();
    // c.add(Calendar.MINUTE, -1);
    // assertEquals(3, eas.getAnnotations(t.getId(), none(), none(), none(), none(), some(c.getTime())).size());
  }

  @Test
  public void testUpdateAnnotation() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    final Video v = eas.createVideo("lecture", resource);
    final Track t = eas.createTrack(v.getId(), "track", none(), none(), resource);
    // update/non existing
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateAnnotation(new AnnotationImpl(12345, 12345, some("not cool"), 21.0D, some(10.0D), none(), none(),
                none(), resource));
      }
    });
    // create
    final Annotation a = eas.createAnnotation(t.getId(), some("cool video"), 20.0D, some(10.0D), none(), none(), none(),
            resource);
    assertEquals(some("cool video"), eas.getAnnotation(a.getId()).get().getText());

    Resource updatedResource = eas.updateResource(a, tags);
    eas.updateAnnotation(new AnnotationImpl(a.getId(), t.getId(), some("not cool"), 22.0D, some(5.0D), none(), none(),
            none(), updatedResource));
    assertEquals(some("not cool"), eas.getAnnotation(a.getId()).get().getText());
    assertEquals(tags.get(), eas.getAnnotation(a.getId()).get().getTags());
  }

  @Test
  public void testDeleteAnnotation() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    final Video v = eas.createVideo("lecture", resource);
    final Track t = eas.createTrack(v.getId(), "track", none(), none(), resource);
    // create
    final Annotation a = eas.createAnnotation(t.getId(), some("cool video"), 20.0D, some(10.0D), none(), none(), none(),
            resource);
    assertTrue(eas.getAnnotation(a.getId()).isSome());
    // delete
    eas.deleteAnnotation(a);
    assertTrue(eas.getAnnotation(a.getId()).isNone());
  }

  @Test
  public void testCreateCategory() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);

    final Scale s = eas.createScale(Option.none(), "test scale", some("test description"), resource);

    final Category categoryTemplate = eas.createCategory(none(), none(), none(), some(s.getId()), "Sozialform",
            some("description Sozialform"), some("sozial form settings"), resource);
    eas.createLabel(categoryTemplate.getId(), "Bla", "Test", none(), none(), resource);

    final Category c = eas.createCategory(some("seriesId"), none(), some(3L), some(32L), "Verhalten", some("verhalten "),
            some("settings"), resource);
    assertEquals(tags.get(), c.getTags());
    Option<Category> cCopy = eas.createCategoryFromTemplate(categoryTemplate.getId(), "SeriesId", 1337L, 20, resource);
    assertTrue(eas.getCategory(categoryTemplate.getId(), false).isSome());
    assertTrue(eas.getCategory(c.getId(), false).isSome());
    assertTrue(cCopy.isSome());
    assertEquals(tags.get(), cCopy.get().getTags());
    assertTrue(eas.getCategory(cCopy.get().getId(), false).isSome());
    assertTrue(categoryTemplate.getVideoId().isNone());
    assertEquals(categoryTemplate.getName(), cCopy.get().getName());
    assertEquals(categoryTemplate.getDescription(), cCopy.get().getDescription());
    assertEquals(categoryTemplate.getSettings(), cCopy.get().getSettings());
    assertNotEquals(categoryTemplate.getScaleId(), cCopy.get().getScaleId());
    assertEquals(Long.valueOf(20), cCopy.get().getVideoId().get());
    Option<Scale> copyScale = eas.getScale(cCopy.get().getScaleId().get(), false);
    assertTrue(copyScale.isSome());
    assertEquals(cCopy.get().getVideoId(), copyScale.get().getVideoId());
    List<Label> labels = eas.getLabels(cCopy.get().getId(), some(0), some(0), none(), Option.none(), Option.none());
    assertEquals(1, labels.size());
    assertEquals(cCopy.get().getId(), labels.get(0).getCategoryId());
  }

  @Test
  public void testUpdateCategory() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    String name = "Sozialform";

    // update/non existing
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateCategory(new CategoryImpl(1212, some("seriesId"), none(), some(323L), some(32L), "bla", none(), none(),
                resource));
      }
    });
    // create
    final Category c = eas.createCategory(some("seriesId"), none(), none(), none(), name, some("description Sozialform"),
            some("sozial form settings"), resource);
    assertEquals(name, eas.getCategory(c.getId(), false).get().getName());

    final Resource updatedResource = eas.updateResource(resource, tags);
    eas.updateCategory(new CategoryImpl(c.getId(), some("seriesId"), none(), some(323L), some(32L), "name2", none(),
            none(), updatedResource));
    assertEquals("name2", eas.getCategory(c.getId(), false).get().getName());
    assertEquals(tags.get(), eas.getCategory(c.getId(), false).get().getTags());
  }

  @Test
  public void testDeleteCategory() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create
    final Category c = eas.createCategory(some("seriesId"), none(), none(), none(), "Sozialform",
            some("description Sozialform"), some("sozial form settings"), resource);
    assertTrue(eas.getCategory(c.getId(), false).isSome());
    // delete
    eas.deleteCategory(c);
    assertTrue(eas.getAnnotation(c.getId()).isNone());
  }

  @Test
  public void testCreateScale() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);

    final Scale scaleTemplate = eas.createScale(none(), "test template scale", some("hallo"), resource);
    eas.createScaleValue(scaleTemplate.getId(), "test", 1.5D, 2, resource);

    final Scale s = eas.createScale(some(23L), "test scale", some("test description"), resource);
    final Scale sCopy = eas.createScaleFromTemplate(12, scaleTemplate.getId(), resource);

    assertEquals(tags.get(), s.getTags());
    assertEquals(tags.get(), sCopy.getTags());
    assertEquals("test template scale", sCopy.getName());

    List<ScaleValue> scaleValues = eas.getScaleValues(sCopy.getId(), some(0), some(0), none(),
            Option.none(), Option.none());
    assertEquals(1, scaleValues.size());
    assertEquals(sCopy.getId(), scaleValues.get(0).getScaleId());
    assertEquals(1.5D, scaleValues.get(0).getValue(), 0D);

    Option<Scale> scale = eas.getScale(s.getId(), false);
    assertTrue(scale.isSome());
    assertEquals(some(23L), scale.get().getVideoId());
    assertEquals("test scale", scale.get().getName());
    assertEquals(some("test description"), scale.get().getDescription());
  }

  @Test
  public void testUpdateScale() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();

    // update/non existing
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateScale(new ScaleImpl(323, some(323L), "test", some("xyz"), resource));
      }
    });
    // create
    final Scale s = eas.createScale(some(23L), "test scale", some("test description"), resource);
    assertEquals("test scale", eas.getScale(s.getId(), false).get().getName());

    final Resource updatedResource = eas.updateResource(resource, tags);
    eas.updateScale(new ScaleImpl(s.getId(), some(222L), "new", none(), updatedResource));
    assertEquals("new", eas.getScale(s.getId(), false).get().getName());
    assertEquals(tags.get(), eas.getScale(s.getId(), false).get().getTags());
  }

  @Test
  public void testDeleteScale() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create
    final Scale s = eas.createScale(some(23L), "test scale", some("test description"), resource);
    assertTrue(eas.getScale(s.getId(), false).isSome());
    // delete
    eas.deleteScale(s);
    assertTrue(eas.getScale(s.getId(), false).isNone());
  }

  @Test
  public void testCreateScaleValue() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);

    final ScaleValue s = eas.createScaleValue(23, "test", 1.5D, 2, resource);
    Option<ScaleValue> scaleValue = eas.getScaleValue(s.getId());

    assertTrue(scaleValue.isSome());
    assertEquals(tags.get(), scaleValue.get().getTags());
    assertEquals(23, scaleValue.get().getScaleId());
    assertEquals("test", scaleValue.get().getName());
    assertEquals(1.5D, scaleValue.get().getValue(), 0D);
    assertEquals(2, scaleValue.get().getOrder());
  }

  @Test
  public void testUpdateScaleValue() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();

    // update/non existing
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateScaleValue(new ScaleValueImpl(323, 29, "cool", 3D, 1, resource));
      }
    });
    // create
    final ScaleValue s = eas.createScaleValue(23, "test", 1.5D, 2, resource);
    assertEquals("test", eas.getScaleValue(s.getId()).get().getName());

    final Resource updatedResource = eas.updateResource(resource, tags);
    eas.updateScaleValue(new ScaleValueImpl(s.getId(), 33, "bad", 2D, 2, updatedResource));
    assertEquals("bad", eas.getScaleValue(s.getId()).get().getName());
    assertEquals(2D, eas.getScaleValue(s.getId()).get().getValue(), 0D);
    assertEquals(2, eas.getScaleValue(s.getId()).get().getOrder());
    assertEquals(tags.get(), eas.getScaleValue(s.getId()).get().getTags());
  }

  @Test
  public void testDeleteScaleValue() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create
    final ScaleValue s = eas.createScaleValue(23, "test", 1.5D, 2, resource);
    assertTrue(eas.getScaleValue(s.getId()).isSome());
    // delete
    eas.deleteScaleValue(s);
    assertTrue(eas.getScaleValue(s.getId()).isNone());
  }

  @Test
  public void testCreateLabel() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);

    final Label l = eas.createLabel(32, "Good", "abbreviation3", some("cool"), some("no settings"), resource);
    Option<Label> label = eas.getLabel(l.getId(), false);

    assertTrue(label.isSome());
    assertEquals(tags.get(), label.get().getTags());
    assertEquals(32, label.get().getCategoryId());
    assertEquals("Good", label.get().getValue());
    assertEquals("abbreviation3", label.get().getAbbreviation());
    assertEquals(some("cool"), label.get().getDescription());
    assertEquals(some("no settings"), label.get().getSettings());
  }

  @Test
  public void testUpdateLabel() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();

    // update/non existing
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateLabel(new LabelImpl(323, none(), 29, "test", "i dont know", none(), none(), resource));
      }
    });
    // create
    final Label l = eas.createLabel(32, "Good", "abbreviation3", none(), none(), resource);
    assertEquals("Good", eas.getLabel(l.getId(), false).get().getValue());

    final Resource updatedResource = eas.updateResource(resource, tags);
    eas.updateLabel(new LabelImpl(l.getId(), none(), 11, "test", "i dont know", none(), none(), updatedResource));
    assertEquals("test", eas.getLabel(l.getId(), false).get().getValue());
    assertEquals(tags.get(), eas.getLabel(l.getId(), false).get().getTags());
  }

  @Test
  public void testDeleteLabel() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create
    final Label l = eas.createLabel(32, "Good", "abbreviation3", none(), none(), resource);
    assertTrue(eas.getLabel(l.getId(), false).isSome());
    // delete
    eas.deleteLabel(l);
    assertTrue(eas.getLabel(l.getId(), false).isNone());
  }

  @Test
  public void testCreateComment() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource(tags);

    final Comment c = eas.createComment(32, none(), "New comment", resource);
    Option<Comment> comment = eas.getComment(c.getId());

    assertTrue(comment.isSome());
    assertEquals(tags.get(), comment.get().getTags());
    assertEquals(32, comment.get().getAnnotationId());
    assertEquals("New comment", comment.get().getText());
  }

  @Test
  public void testUpdateComment() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();

    // update/non existing
    expectCause(Cause.NOT_FOUND, new Effect0() {
      @Override
      protected void run() {
        eas.updateComment(new CommentImpl(323, 29, "comment", none(), resource));
      }
    });
    // create
    final Comment c = eas.createComment(32, none(), "New comment", resource);
    assertEquals("New comment", eas.getComment(c.getId()).get().getText());

    final Resource updatedResource = eas.updateResource(resource, tags);
    eas.updateComment(new CommentImpl(c.getId(), 11, "new text", none(), updatedResource));
    assertEquals(32, eas.getComment(c.getId()).get().getAnnotationId());
    assertEquals("new text", eas.getComment(c.getId()).get().getText());
    assertEquals(tags.get(), eas.getComment(c.getId()).get().getTags());
  }

  @Test
  public void testDeleteComment() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create
    final Comment c = eas.createComment(32, none(), "New comment", resource);
    assertTrue(eas.getComment(c.getId()).isSome());
    // delete
    eas.deleteComment(c);
    assertTrue(eas.getComment(c.getId()).isNone());
  }

  @Test
  public void testClearTables() {
    final ExtendedAnnotationService eas = newExtendedAnnotationService();
    final Resource resource = eas.createResource();
    // create resources
    final User u = eas.createUser("jsbach", "J.S. Bach", some("js@bach.de"), resource);
    final Video v = eas.createVideo("lecture", resource);
    final Track t = eas.createTrack(v.getId(), "track", none(), none(), resource);
    final Annotation a = eas.createAnnotation(t.getId(), some("cool video"), 20.0D, some(10.0D), none(), none(), none(),
            resource);
    assertTrue(eas.getUser(u.getId()).isSome());
    assertTrue(eas.getVideo(v.getId()).isSome());
    assertTrue(eas.getTrack(t.getId()).isSome());
    assertTrue(eas.getAnnotation(a.getId()).isSome());
    // clear
    eas.clearDatabase();
    assertFalse(eas.getUser(u.getId()).isSome());
    assertFalse(eas.getVideo(v.getId()).isSome());
    assertFalse(eas.getTrack(t.getId()).isSome());
    assertFalse(eas.getAnnotation(a.getId()).isSome());
  }

  // --

  private static void expectCause(Cause c, Effect0 e) {
    try {
      e.apply();
      fail("should throw an exception");
    } catch (ExtendedAnnotationException ex) {
      assertEquals(c, ex.getCauseCode());
    }
  }

  private static ExtendedAnnotationService newExtendedAnnotationService() {
    SecurityService securityService = EasyMock.createNiceMock(SecurityService.class);

    org.opencastproject.security.api.User user = SecurityUtil.createSystemUser("admin", new DefaultOrganization());
    EasyMock.expect(securityService.getOrganization()).andReturn(new DefaultOrganization()).anyTimes();
    EasyMock.expect(securityService.getUser()).andReturn(user).anyTimes();
    EasyMock.replay(securityService);

    AuthorizationService authorizationService = EasyMock.createNiceMock(AuthorizationService.class);
    SearchService searchService = EasyMock.createNiceMock(SearchService.class);

    ExtendedAnnotationServiceJpaImpl extendedAnnotationService = new ExtendedAnnotationServiceJpaImpl();
    extendedAnnotationService.setSecurityService(securityService);
    extendedAnnotationService.setSearchService(searchService);
    extendedAnnotationService.setAuthorizationService(authorizationService);
    extendedAnnotationService.setEntityManagerFactory(newEntityManagerFactory("org.opencast.annotation.impl.persistence"));
    extendedAnnotationService.setDBSessionFactory(getDbSessionFactory());
    extendedAnnotationService.activate();
    return extendedAnnotationService;
  }
}
