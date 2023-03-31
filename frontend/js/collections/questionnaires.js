/**
 * A module representing a questionnaires collection.
 * @module collections-questionnaires
 */
define(
    [
        "underscore",
        "models/questionnaire",
        "backbone"
    ],
    function (
        _,
        Questionnaire,
        Backbone
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-questionnaires
         * @alias module:collections-questionnaires.Questionnaires
         */
        var Questionnaires = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection.
             * @alias module:collections-questionnaires.Questionnaires#model
             */
            model: Questionnaire,

            /**
             * Constructor.
             * @alias module:collections-questionnaires.Questionnaires#initialize
             */
            initialize: function (_models, options) {
                this.video = options.video;
            },

            /**
             * Get the URL for this collection.
             * @return {string} The URL of this collection.
             * @alias module:collections-questionnaires.Questionnaires#url
             */
            url: function () {
                return (this.video ? _.result(this.video, "url") : "") + "/questionnaires";
            },

            /**
             * Parse the given data.
             * @param {object} data Object or array containing the data to parse.
             * @return {object} the part of the given data related to the questionnaires.
             * @alias module:collections-questionnaires.Questionnaires#parse
             */
            parse: function (resp) {
                if (resp.questionnaires && _.isArray(resp.questionnaires)) {
                    return resp.questionnaires;
                } else if (_.isArray(resp)) {
                    return resp;
                } else {
                    return null;
                }
            },

            /**
             * Get one questionnaire model.
             * @param {number} id Questionnaire ID
             * @return {object} Questionnaire model
             * @alias module:collections-questionnaires.Questionnaires#getOneById
             */
            getOneById: function (id) {
                return _.first(this.filter(questionnaire => questionnaire.get("id") === +id));
            }
        });

        return Questionnaires;
    }
);
