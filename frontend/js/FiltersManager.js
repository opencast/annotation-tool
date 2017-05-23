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

/**
 * Module for the filters manager
 * @module filters-manager
 * @requires underscore
 * @requires backbone
 * @requires access
 */
define(["underscore", "backbone", "access"], function (_, Backbone, ACCESS) {

    "use strict";

    /**
     * Filter Manager
     * @alias module:filters-manager.FiltersManager
     * @constructor
     * @param {module:filters-manager.FiltersManager} [master] The main filter manager. If present, the new Filters Manager will be bound with the given one
     */
    var FiltersManager = function (master) {
        _.extend(this, Backbone.Events);

        this._cloneFilters();

        if (master instanceof FiltersManager) {
            this.master = master;
            this.isBindedToMaster = true;
            this.listenTo(master, "switch", this._switchListener);
        } else if (master) {
            console.warn("Parent for FiltersManager is not valid!");
        } else {
            delete this.bindToMaster;
            delete this.unbdindFromMaster;
        }
    };


    FiltersManager.prototype = {

        /**
         * List of filter used for the list elements
         * @type {Object}
         */
        filters: {
            mine: {
                active   : false,
                condition: function (item) {
                    return _.isUndefined(item.model) || item.model.get("isMine");
                },
                filter   : function (list) {
                    return _.filter(list, function (item) {
                        return this.condition(item);
                    }, this);
                }
            },
            public: {
                active   : false,
                condition: function (item) {
                    return _.isUndefined(item.model) || item.model.get("isPublic") || (item.model.get("access") === ACCESS.PUBLIC);
                },
                filter   : function (list) {
                    return _.filter(list, function (item) {
                        return this.condition(item);
                    }, this);
                }
            },
            timerange: {
                active   : false,
                start    : 0,
                end      : 0,
                condition: function (item) {
                    if (!_.isUndefined(item.voidItem)) {
                        return true;
                    } else if (_.isUndefined(item.start) || _.isUndefined(item.end)) {
                        return false;
                    }

                    return (item.start >= this.start && item.start < this.end) ||
                           (item.start <= this.start && item.end >= this.end);
                },
                filter   : function (list) {
                    return _.filter(list, function (item) {
                        return this.condition(item);
                    }, this);
                }
            }
        },

        /**
         * Clone the default filters
         * @return {Object} The cloned filters list
         */
        _cloneFilters: function () {
            var filters = {};

            _.each(this.filters, function (filter, id) {
                filters[id] = _.clone(filter);
            }, this);

            this.filters = filters;

            return filters;
        },

        /**
         * Filter the given with all the active filter
         * @param  {Object} list   The list of elements to filter
         * @params {Object} (filters) The list of filters to use 
         * @return {Object} the filtered list 
         */
        filterAll: function (list, filters) {
            var activeFilters = _.map(_.isUndefined(filters) ? this.filters : filters,
                                            function (item) {return item; },
                                    this),
                filterList = function (item) {
                        var cFilter,
                            i;

                        for (i = 0; i < activeFilters.length; i++) {
                            cFilter = activeFilters[i];
                            if (cFilter.active && !cFilter.condition(item)) {
                                return false;
                            }
                        }

                        return true;
                    };


            return _.filter(list, filterList, this);
        },

        /**
         * Disable all filters
         */
        disableFilters: function () {
            _.each(this.filters, function (filter, index) {
                this.switchFilter(index, false);
            }, this);
        },

        /**
         * Switch the filter with the given id. If the manager is bound to a master, it will switch it on the master.
         * @param  {string} id     Filter id
         * @param  {boolean} active Define if the filter must be active or not
         */
        switchFilter: function (id, active) {
            if (this.isBindedToMaster) {
                this.master.switchFilter(id, active);
            } else {
                this._switchFilterLocally(id, active);
            }
        },

        /**
         * Switch the filter with the given id for this instance
         * @param  {string} id     Filter id
         * @param  {boolean} active Define if the filter must be active or not
         */
        _switchFilterLocally: function (id, active) {
            if (_.isUndefined(this.filters[id])) {
                return;
            }
            
            this.filters[id].active = active;
            this.trigger("switch", {id: id, active: active});
        },

        /**
         * Listener for the update on the master filters
         * @inner
         * @param  {object} attr The filter attribute
         */
        _switchListener: function (attr) {
            if (this.isBindedToMaster) {
                this._switchFilterLocally(attr.id, attr.active);
            }
        },

        /**
         * Get the filters from this manager. If bound to a master, the ones from the master will be returned.
         */
        getFilters: function () {
            if (this.isBindedToMaster) {
                return this.master.filters;
            } else {
                return this.filters;
            }
        },

        /**
         * Bind this instance to its master
         */
        bindToMaster: function () {
            this.isBindedToMaster = true;
        },

        /**
         * Unbind this instance from its master
         */
        unbdindFromMaster: function () {
            this.isBindedToMaster = false;
        }
    };

    return FiltersManager;

});