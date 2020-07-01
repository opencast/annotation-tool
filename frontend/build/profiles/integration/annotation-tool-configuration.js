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
 * Module containing the tool configuration
 * @module annotation-tool-configuration
 */
define(["jquery",
        "underscore",
        "backbone",
        "util",
        "models/user",
        "roles",
        "player_adapter_HTML5",
        "xlsx",
        "localstorage"
        // Add the files (PlayerAdapter, ...) required for your configuration here
        ],

    function ($, _, Backbone, util, User, ROLES, HTML5PlayerAdapter, XLSX) {

        "use strict";

        var backboneSync = Backbone.sync;

        /**
         * Synchronize models with an annotation tool backend
         */
        Backbone.sync = function (method, model, options) {

            // The backend expects `application/x-www-form-urlencoded data
            // with anything nested deeper than one level transformed to a JSON string
            options.processData = true;

            options.data = options.attrs || model.toJSON(options);

            // Some models (marked with `mPOST`) need to always be `PUT`, i.e. never be `POST`ed
            if (model.noPOST && method === "create") {
                method = "update";
            }

            options.beforeSend = function () {
                this.url = "../../extended-annotations" + this.url;
            };

            return backboneSync.call(this, method, model, options);
        };

        // Initiate loading the video metadata from Opencast
        var mediaPackageId = util.queryParameters.id;
        $.support.cors = true;
        var searchResult = $.ajax({
            url: "/search/episode.json",
            crossDomain: true,
            data: "id=" + mediaPackageId + "&limit=1",
            dataType: "json"
        }).then(function (data) {
            return data["search-results"].result;
        });
        // TODO Error handling!
        var mediaPackage = searchResult.then(function (result) {
            return result.mediapackage;
        });
        // Get user data from Opencast
        var user = $.ajax({
            url: "/info/me.json",
            dataType: "json"
        });
        // Find out which roles should have admin rights
        var adminRoles = mediaPackage.then(function (mediaPackage) {
            // First we need to find the proper XACML file
            var attachments = util.array(mediaPackage.attachments.attachment);
            var selectedXACML = function () {
                var seriesXACML;
                for (var i = 0; i < attachments.length; i++) {
                    var attachment = attachments[i];
                    if (attachment.type === "security/xacml+episode") {
                        // Immediately return an XACML belonging to this specific episode
                        return attachment;
                    }
                    if (attachment.type === "security/xacml+series") {
                        // Remember any series XACML on the way,
                        //   so we can return that as a fallback
                        seriesXACML = attachment;
                    }
                }
                return seriesXACML;
            }();
            // TODO What if nothing was found?!
            return $.ajax({
                url: selectedXACML.url,
                crossDomain: true,
                dataType: "xml"
            });
        }).then(function (xacmlData) {
            // Then we need to extract the appropriate rules
            return $(xacmlData).find("Rule").filter(function (index, rule) {
                return $(rule).find("Action AttributeValue").text() === "annotate-admin";
            }).map(function (index, rule) {
                return $(rule).find("Condition AttributeValue").text();
            }).toArray();
        });

        /**
         * Annotations tool configuration object
         * @alias module:annotation-tool-configuration.Configuration
         */
        var Configuration = {
            /**
             * The minmal duration used for annotation representation on timeline
             * @alias module:annotation-tool-configuration.Configuration.MINIMAL_DURATION
             * @memberOf module:annotation-tool-configuration.Configuration
             * @type {Object}
             */
            MINIMAL_DURATION: 1,

            /**
             * Define the number of categories per tab in the annotate box.
             * The bigger this number, the thinner the columns for the categories.
             * @alias module:annotation-tool-configuration.Configuration.CATEGORIES_PER_TAB
             * @memberOf module:annotation-tool-configuration.Configuration
             * @type {Number}
             */
            CATEGORIES_PER_TAB: 7,

            /**
             * Define if the localStorage should be used or not
             * @alias module:annotation-tool-configuration.Configuration.localStorage
             * @type {boolean}
             * @readOnly
             */
            localStorage: false,

            /**
             * Offer the user a spreadsheet version of the annotations for download.
             * @alias module:annotation-tool-configuration.Configuration.export
             * @param {Video} video The video to export
             * @param {Track[]} tracks The tracks to include in the export
             * @param {Category[]} categories The tracks to include in the export
             * @param {Boolean} freeText Should free-text annotations be exported?
             */
            export: function (video, tracks, categories, freeText) {
                var parameters = new URLSearchParams();
                _.each(tracks, function (track) {
                    parameters.append("track", track.id);
                });
                _.each(categories, function (category) {
                    parameters.append("category", category.id);
                });
                parameters.append("freetext", freeText);
                window.location.href =
                    "../extended-annotations/videos/" +
                    video.id +
                    "/export.csv?" +
                    parameters;
            },

            /**
             * Offer the user an excel version of the annotations for download.
             * @alias module:annotation-tool-configuration.Configuration.export
             * @param {Video} video The video to export
             * @param {Track[]} tracks The tracks to include in the export
             * @param {Category[]} categories The tracks to include in the export
             * @param {Boolean} freeText Should free-text annotations be exported?
             */
            export_xlxs: function (video, tracks, categories, freeText) {
                var bookData = [];
                var header = [];
                addResourceHeaders(header);
                header.push("Track name");
                header.push("Leadin");
                header.push("Leadout");
                header.push("Duration");
                header.push("Text");
                header.push("Category name");
                header.push("Label name");
                header.push("Label abbreviation");
                header.push("Scale name");
                header.push("Scale value name");
                header.push("Scale value value");
                addResourceHeaders(header, "comment");
                header.push("Comment text");
                header.push("Comment replies to");
                bookData.push(header);

                _.each(tracks, function (track) {
                    _.each(annotationTool.getAnnotations(track.id), function (annotation) {
                        var line = [];

                        let label = annotation.attributes.label;
                        // No idea what this check is good for tbh
                        if (label) {
                            if (categories && !categories.map(category => category.id).includes(label.category.id)) return;
                        } else {
                            if (!freeText) return;
                        }
                        
                        addResource(line, annotation)
                        line.push(track.attributes.name);

                        line.push(util.formatTime(annotation.attributes.start));
                        line.push(util.formatTime(annotation.attributes.start + annotation.attributes.duration));
                        line.push(util.formatTime(annotation.attributes.duration));
                        line.push(annotation.attributes.text);

                        if (label) {
                            line.push(label.category.name)
                            line.push(label.value)
                            line.push(label.abbreviation)
                        } else {
                            line.push("")
                            line.push("")
                            line.push("")
                        }
                        
                        // What the heck is the difference between 'scalevalue' and 'scaleValue'?
                        // They seem to contain the exact same data
                        if(annotation.attributes.scalevalue) {
                            line.push(annotation.attributes.scalevalue.scale.name);
                            line.push(annotation.attributes.scalevalue.name);
                            line.push(annotation.attributes.scalevalue.value);
                        } else {
                            line.push("")
                            line.push("")
                            line.push("")
                        }

                        bookData.push(line);

                        // Get comments by user
                        if (!annotation.areCommentsLoaded()) {
                            annotation.fetchComments();
                        }

                        _.each(annotation.attributes.comments.models, function (comment) {
                            addCommentLine(line, comment);
                            
                            if(comment.replies.length > 0) {
                                comment_replies(line, comment.replies.models)
                            }
                        });

                    });  
                });

                function addResourceHeaders(header, presuffix = "") {
                    let prefix = ""
                    let suffix = ""
                    if(presuffix) {
                        prefix = presuffix + " "
                        suffix = " of " + presuffix
                    }
                    header.push(util.capitalize(prefix + "ID"));
                    header.push(util.capitalize(prefix + "Creation date"));
                    header.push(util.capitalize("Last update" + suffix));
                    header.push(util.capitalize(prefix + "Author nickname"));
                    header.push(util.capitalize(prefix + "Author mail"));
                }

                function addResource(line, resource) {
                    line.push(resource.id);
                    line.push(resource.attributes.created_at.toISOString());
                    line.push(resource.attributes.updated_at.toISOString());
                    line.push(resource.attributes.created_by_nickname);
                    line.push(resource.attributes.created_by_email);
                }

                function addCommentLine(line, comment) {
                    let commentLine = []
                    Array.prototype.push.apply(commentLine, line)
                    
                    addResource(commentLine, comment);

                    commentLine.push(comment.attributes.text);
                    if (comment.collection.replyTo) {
                        commentLine.push(comment.collection.replyTo.id);
                    } else {
                        commentLine.push("");
                    }

                    bookData.push(commentLine);
                }

                function comment_replies(line, replies) {
                    _.each(replies, function (comment) {
                        addCommentLine(line, comment);

                        comment_replies(line, comment.attributes.replies)
                    });
                }

                // Generate workbook
                var wb = XLSX.utils.book_new();
                wb.SheetNames.push("Sheet 1");

                // Generate worksheet
                var ws = XLSX.utils.aoa_to_sheet(bookData)

                // Scale column width to content (which is apparently non built-in in SheetJS)
                let objectMaxLength = []

                bookData.map(arr => {
                  Object.keys(arr).map(key => {
                    let value = arr[key] === null ? '' : arr[key]
                
                    //if (typeof value === 'number')
                    //{
                    //  return objectMaxLength[key] = 10
                    //}
                
                    objectMaxLength[key] = objectMaxLength[key] >= value.length ? objectMaxLength[key]  : value.length
                  })
                })
                
                let worksheetCols = objectMaxLength.map(width => {
                  return {
                    width
                  }
                })
                
                ws["!cols"] = worksheetCols;

                // Put worksheet
                wb.Sheets["Sheet 1"] = ws;

                // Export workbook
                var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
                function s2ab(s) { 
                    var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
                    var view = new Uint8Array(buf);  //create uint8array as viewer
                    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
                    return buf;    
                }

                saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'export.xlsx');
            },

            /**
             * Define if the structured annotations are or not enabled
             * @alias module:annotation-tool-configuration.Configuration.isStructuredAnnotationEnabled
             * @return {boolean} True if this feature is enabled
             */
            isStructuredAnnotationEnabled: function () {
                return true;
            },

            /**
             * Define if the free text annotations are or not enabled
             * @alias module:annotation-tool-configuration.Configuration.isFreeTextEnabled
             * @return {boolean} True if this feature is enabled
             */
            isFreeTextEnabled: function () {
                return true;
            },

            /**
             * Get the current video id (video_extid)
             * @alias module:annotation-tool-configuration.Configuration.getVideoExtId
             * @return {Promise.<string>} video external id
             */
            getVideoExtId: function () {
                return $.when(mediaPackageId);
            },

            /**
             * Returns the time interval between each timeupdate event to take into account.
             * It can improve a bit the performance if the amount of annotations is important.
             * @alias module:annotation-tool-configuration.Configuration.getTimeupdateIntervalForTimeline
             * @return {number} The interval
             */
            getTimeupdateIntervalForTimeline: function () {
                // TODO Check if this function should be linear
                return Math.max(500, this.getAnnotations().length * 3);

            },

            /**
             * Get the external parameters related to video. The supported parameters are now the following:
             *     - title: The title of the video
             *     - src_owner: The owner of the video in the system
             *     - src_creation_date: The date of the course, when the video itself was created.
             * @alias module:annotation-tool-configuration.Configuration.getVideoParameters
             * @example
             * {
             *     video_extid: 123, // Same as the value returned by getVideoExtId
             *     title: "Math lesson 4", // The title of the video
             *     src_owner: "Professor X", // The owner of the video in the system
             *     src_creation_date: "12-12-1023" // The date of the course, when the video itself was created.
             * }
             * @return {Object} The literal object containing all the parameters described in the example.
             */
            getVideoParameters: function () {
                return searchResult.then(function (result) {
                    return {
                        title: result.dcTitle,
                        src_owner: result.dcCreator,
                        src_creaton_date: result.dcCreated
                    };
                });
            },

            /**
             * Maps a list of roles of the external user to a corresponding user role
             * @alias module:annotation-tool-configuration.Configuration.getUserRoleFromExt
             * @param {string[]} roles The roles of the external user
             * @return {Promise.<ROLE>} The corresponding user role in the annotations tool
             */
            getUserRoleFromExt: function (roles) {
                return adminRoles.then(function (adminRoles) {
                    if (_.some(adminRoles.concat(['ROLE_ADMIN']), function (adminRole) {
                        return _.contains(roles, adminRole);
                    })) {
                        return ROLES.ADMINISTRATOR;
                    } else {
                        return ROLES.USER;
                    }
                });
            },

            /**
             * Authenticate the user
             * @alias module:annotation-tool-configuration.Configuration.authenticate
             */
            authenticate: function () {
                user.then(function (userData) {
                    return $.when(userData.user, this.getUserRoleFromExt(userData.roles));
                }.bind(this)).then(function (user, role) {
                    this.user = new User({
                        user_extid: user.username,
                        nickname: user.username,
                        email: user.email,
                        role: role
                    });
                    return this.user.save();
                }.bind(this)).then(function () {
                    this.trigger(this.EVENTS.USER_LOGGED);
                }.bind(this));
            },

            /**
             * Log out the current user
             * @alias module:annotation-tool-configuration.Configuration.logout
             */
            logout: function () {
                window.location = "/j_spring_security_logout";
            },

            /**
             * Function to load the video
             * @alias module:annotation-tool-configuration.Configuration.loadVideo
             * @param {HTMLElement} container The container to create the video player in
             */
            loadVideo: function (container) {
                mediaPackage.then(function (mediaPackage) {
                    var videos = util.array(mediaPackage.media.track)
                        .filter(_.compose(
                            RegExp.prototype.test.bind(/application\/.*|video\/.*/),
                            _.property("mimetype")
                        ));
                    videos.sort(
                        util.lexicographic([
                            util.firstWith(_.compose(
                                RegExp.prototype.test.bind(/presenter\/.*/),
                                _.property("type")
                            )),
                            util.firstWith(_.compose(
                                RegExp.prototype.test.bind(/presentation\/.*/),
                                _.property("type")
                            ))
                        ])
                    );

                    var videoElement = document.createElement("video");
                    container.appendChild(videoElement);
                    this.playerAdapter = new HTML5PlayerAdapter(
                        videoElement,
                        videos.map(function (track) {
                            return {
                                src: track.url,
                                type: track.mimetype
                            };
                        })
                    );
                    this.trigger(this.EVENTS.VIDEO_LOADED);
                }.bind(this));
            }
        };

        return Configuration;
    }
);
