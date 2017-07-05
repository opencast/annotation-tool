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
 */

/**
 * The about dialog
 * @module views-about
 * @requires version
 * @requires backbone
 * @requires templates/about
 */
define(["version", "backbone", "templates/about"], function (VERSION, Backbone, aboutTemplate) { "use strict";

/**
 * @constructor
 * @see {@link http://www.backbonejs.org/#View}
 * @augments module:Backbone.View
 * @memberOf module:views-about
 * @alias About
 */
var About = Backbone.View.extend({

    el: "#about-dialog",

    /**
     * The template used to render this
     * @alias module:views-about.About#template
     */
    template: aboutTemplate,

    /**
     * Event handlers
     * @alias module:views-about.About#events
     */
    events: {
        "click #close-about": "hide"
    },

    /**
     * Constructor
     * @alias module:views-about.About#initialize
     */
    initialize: function () {
        this.render();
    },

    /**
     * Render the view into the DOM
     * @alias module:views-about.About#render
     */
    render: function () {
        this.$el.html(this.template({ version: VERSION }));
    },


    /**
     * Show the about dialog modally
     * @alias module:views-about.About#show
     */
    show: function () {
        this.$el.modal("show");
    },

    /**
     * Hide the modal about dialog
     * @alias module:views-about.About#hide
     */
    hide: function () {
        this.$el.modal("hide");
    }
});

return About;

});