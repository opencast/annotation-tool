/**
 *  Copyright 2018, ELAN e.V., Germany
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
 * A simple <code>EventTarget</code> implementation
 * @module event-target
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
define(function () { "use strict";

var EventTarget = function () {
    this.listeners = {};
};

EventTarget.prototype.listeners = null;
EventTarget.prototype.addEventListener = function (type, callback) {
    if (!(type in this.listeners)) {
        this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
};

EventTarget.prototype.removeEventListener = function (type, callback) {
    if (!(type in this.listeners)) {
        return;
    }
    var stack = this.listeners[type];
    for (var i = 0, l = stack.length; i < l; i++) {
        if (stack[i] === callback) {
            stack.splice(i, 1);
            return;
        }
    }
};

EventTarget.prototype.dispatchEvent = function (event) {
    if (!(event.type in this.listeners)) {
        return true;
    }
    var stack = this.listeners[event.type];

    for (var i = 0, l = stack.length; i < l; i++) {
        stack[i].call(this, event);
    }
    return !event.defaultPrevented;
};

return EventTarget;

});
