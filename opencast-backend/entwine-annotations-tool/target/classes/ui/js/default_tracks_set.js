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
 *  Default track set
 */
define([], function () {

    "use strict";

    return [
        {
            id: "test1",
            name: "Track1",
            description: "First test track",
            access: 1,
            annotations: [
                {
                    text: "Annotation 1",
                    start: 10
                },
                {
                    text: "Annotation 2",
                    start: 70
                },
                {
                    text: "Annotation 3",
                    start: 30
                },
                {
                    text: "Annotation 4",
                    start: 109
                },
                {
                    text: "Annotation 5",
                    start: 210
                }
            ]
        },
        {
            id: "test2",
            name: "Track2",
            description: "Second test track",
            access: 1,
            annotations: [
                {
                    text: "Annotation 1 on 2",
                    start: 10
                },
                {
                    text: "Annotation 2 on 2",
                    start: 70
                },
                {
                    text: "Annotation 3 on 2",
                    start: 30
                },
                {
                    text: "Annotation 4 on 2",
                    start: 109
                },
                {
                    text: "Annotation 5 on 2",
                    start: 210
                }
            ]
        }
    ];
});