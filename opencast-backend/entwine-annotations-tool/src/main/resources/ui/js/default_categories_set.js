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
 *  Default categories set
 */
define([],function(){
    return [
        {name: "Socials",
         labels: [
            {value: "Group", abbreviation: "Gp"},
            {value: "Recluse", abbreviation: "Re"}
         ],
         settings: {color:"red"}
         },
        {name: "Actions",
         labels: [
            {value: "Eat", abbreviation: "Ea"},
            {value: "Sleep", abbreviation: "Sl"},
            {value: "Dance", abbreviation: "Da"},
            {value: "Play", abbreviation: "Pl"},
            {value: "Run", abbreviation: "Rn"}
         ],
         settings: {color:"darkcyan"}
         },
        {name: "Feelings",
         labels: [
            {value: "Sadness", abbreviation: "Sn"},
            {value: "Happiness", abbreviation: "Hn"},
            {value: "Despair", abbreviation: "Dp"},
            {value: "Anger", abbreviation: "Ag"}
         ],
         settings: {color:"blue"}
         },
        {name: "Locations",
         labels: [
            {value: "Parking", abbreviation: "Pk"},
            {value: "Airport", abbreviation: "Ap"},
            {value: "School", abbreviation: "Sc"},
            {value: "Mall", abbreviation: "Ml"},
            {value: "Bar", abbreviation: "Br"}
         ],
         settings: {color:"green"}
         },
    ];
});