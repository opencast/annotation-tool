/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

package org.opencast.annotation.impl.persistence.util;

import static org.opencastproject.util.data.Option.option;

import org.opencastproject.util.data.Function;
import org.opencastproject.util.data.Option;
import org.opencastproject.util.data.Tuple;

import org.joda.time.base.AbstractInstant;

import java.util.Date;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.persistence.TemporalType;
import javax.persistence.TypedQuery;

/** JPA query constructors. */
// CHECKSTYLE:OFF
public final class Queries {
  private Queries() {
  }

  /** {@link javax.persistence.EntityManager#find(Class, Object)} as a function wrapping the result into an Option. */
  public static <A> Function<EntityManager, Option<A>> find(final Class<A> clazz, final Object primaryKey) {
    return new Function<EntityManager, Option<A>>() {
      @Override public Option<A> apply(EntityManager em) {
        return option(em.find(clazz, primaryKey));
      }
    };
  }

  /** {@link javax.persistence.EntityManager#persist(Object)} as a function. */
  public static <A> Function<EntityManager, A> persist(final A a) {
    return new Function<EntityManager, A>() {
      @Override public A apply(EntityManager em) {
        em.persist(a);
        return a;
      }
    };
  }

  /**
   * Set a list of named parameters on a query.
   *
   * Values of type {@link java.util.Date} and {@link org.joda.time.base.AbstractInstant}
   * are recognized and set as a timestamp ({@link javax.persistence.TemporalType#TIMESTAMP}.
   */
  public static <A extends Query> A setParams(A q, Tuple<String, ?>... params) {
    for (Tuple<String, ?> p : params) {
      final Object value = p.getB();
      if (value instanceof Date) {
        q.setParameter(p.getA(), (Date) value, TemporalType.TIMESTAMP);
      }
      if (value instanceof AbstractInstant) {
        q.setParameter(p.getA(), ((AbstractInstant) value).toDate(), TemporalType.TIMESTAMP);
      } else {
        q.setParameter(p.getA(), p.getB());
      }
    }
    return q;
  }

  // -------------------------------------------------------------------------------------------------------------------

  /** Named queries with support for named parameters. */
  public static final TypedQueriesBase<Tuple<String, ?>> named = new TypedQueriesBase<Tuple<String, ?>>() {
    @Override public Query query(EntityManager em, String q, Tuple<String, ?>... params) {
      return setParams(em.createNamedQuery(q), params);
    }

    @Override
    public <A> TypedQuery<A> query(EntityManager em, String q, Class<A> type, Tuple<String, ?>... params) {
      return setParams(em.createNamedQuery(q, type), params);
    }
  };

  // -------------------------------------------------------------------------------------------------------------------

  public static abstract class TypedQueriesBase<P> extends QueriesBase<P> {
    protected TypedQueriesBase() {
    }

    /**
     * Create a typed query from <code>q</code> with a list of parameters.
     * Values of type {@link java.util.Date} are recognized
     * and set as a timestamp ({@link javax.persistence.TemporalType#TIMESTAMP}.
     */
    public abstract <A> TypedQuery<A> query(EntityManager em,
            String queryName,
            Class<A> type,
            Tuple<String, ?>... params);
  }

  // -------------------------------------------------------------------------------------------------------------------

  public static abstract class QueriesBase<P> {
    protected QueriesBase() {
    }

    /**
     * Create a query from <code>q</code> with a list of parameters.
     * Values of type {@link java.util.Date} are recognized
     * and set as a timestamp ({@link javax.persistence.TemporalType#TIMESTAMP}.
     */
    public abstract Query query(EntityManager em, String q, P... params);

    /** Run an update (UPDATE or DELETE) query and ensure that at least one row got affected. */
    public boolean update(EntityManager em, String q, P... params) {
      return query(em, q, params).executeUpdate() > 0;
    }

    /** {@link #update(EntityManager, String, Object[])} as a function. */
    public Function<EntityManager, Boolean> update(final String q, final P... params) {
      return new Function<EntityManager, Boolean>() {
        @Override public Boolean apply(EntityManager em) {
          return update(em, q, params);
        }
      };
    }
  }
}
