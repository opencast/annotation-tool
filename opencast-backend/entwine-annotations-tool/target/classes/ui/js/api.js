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
 * A module representing the main view
 * @module views-main
 * @requires jQuery
 */
define(["jquery",
        "backbone"],

    function ($, Backbone) {

        "use strict";

        var ANNO = annotationsTool;

        return {
            //=============================================
            // GETTERs
            //=============================================
            
            /**
             * Get the current tool video
             * @param  {String} id The track Id
             * @return {Object}    The track object or undefined if not found
             */
            getVideo: function () {
                return ANNO.video;
            },

            /**
             * Get the track with the given Id
             * @param  {String} id The track Id
             * @return {Object}    The track object or undefined if not found
             */
            getTrack: function (id) {
                if (_.isUndefined(ANNO.video)) {
                    console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                } else {
                    return this.video.getTrack(id);
                }
            },

            /**
             * Get the annotation with the given Id
             * @param  {String} annotationId The annotation 
             * @param  {String} (trackId)      The track Id (Optional)
             * @return {Object}   The annotation object or undefined if not found
             */
            getAnnotation: function (annotationId, trackId) {
                var track,
                    tmpAnnotation;

                if (!_.isUndefined(trackId)) {
                    // If the track id is given, we only search for the annotation on it
                    
                    track = ANNO.getTrack(trackId);

                    if (_.isUndefined(track)) {
                        console.warn("Not able to find the track with the given Id");
                        return;
                    } else {
                        return track.getAnnotation(annotationId);
                    }
                } else {
                    // If no trackId present, we search through all tracks

                    if (_.isUndefined(ANNO.video)) {
                        console.warn("No video present in the annotations tool. Either the tool is not completely loaded or an error happend during video loading.");
                        return;
                    } else {
                        ANNO.video.get("tracks").each(function (trackItem) {
                            tmpAnnotation = trackItem.getAnnotation(annotationId);
                            if (!_.isUndefined(tmpAnnotation)) {
                                return tmpAnnotation;
                            }
                        }, ANNO);
                        return tmpAnnotation;
                    }
                }
            },

            //=============================================
            // DELETERs
            //=============================================

            /**
             * Delete the annotation with the given id with the track with the given track id
             * @alias   annotationsTool.deleteAnnotation
             * @param {Integer} annotationId The id of the annotation to delete
             * @param {Integer} trackId Id of the track containing the annotation
             */
            deleteAnnotation: function (annotationId, trackId) {
                var annotation;

                if (typeof trackId === "undefined") {
                    ANNO.video.get("tracks").each(function (track) {
                        if (track.get("annotations").get(annotationId)) {
                            trackId = track.get("id");
                        }
                    });
                }

                annotation = ANNO.video.getAnnotation(annotationId, trackId);

                if (annotation) {
                    this.deleteOperation.start(annotation, this.deleteOperation.targetTypes.ANNOTATION);
                } else {
                    console.warn("Not able to find annotation %i on track %i", annotationId, trackId);
                }
            },

            //=============================================
            // IMPORTERs
            //=============================================

            /**
             * Import the given categories in the tool
             * @alias module:views-main.MainView#importCategories
             * @param {PlainObject} imported Object containing the .categories and .scales to insert in the tool
             * @param {PlainObject} defaultCategoryAttributes The default attributes to use to insert the imported categories (like access)
             */
            importCategories: function (imported, defaultCategoryAttributes) {
                var videoCategories = ANNO.video.get("categories"),
                    videoScales = ANNO.video.get("scales"),
                    labelsToAdd,
                    newCat,
                    newScale,
                    scaleValuesToAdd,
                    scaleOldId,
                    scalesIdMap = {};

                if (!imported.categories || imported.categories.length === 0) {
                    return;
                }

                _.each(imported.scales, function (scale) {
                    scaleOldId = scale.id;
                    scaleValuesToAdd = scale.scaleValues;
                    delete scale.id;
                    delete scale.scaleValues;

                    newScale = videoScales.create(scale, {async: false});
                    scalesIdMap[scaleOldId] = newScale.get("id");

                    if (scaleValuesToAdd) {
                        _.each(scaleValuesToAdd, function (scaleValue) {
                            scaleValue.scale = newScale;
                            newScale.get("scaleValues").create(scaleValue);
                        });
                    }
                });

                _.each(imported.categories, function (category) {
                    labelsToAdd = category.labels;
                    category.scale_id = scalesIdMap[category.scale_id];
                    delete category.labels;
                    newCat = videoCategories.create(_.extend(category, defaultCategoryAttributes));

                    if (labelsToAdd) {
                        _.each(labelsToAdd, function (label) {
                            label.category = newCat;
                            newCat.get("labels").create(label);
                        });
                    }
                });
            }
        };
    }
);