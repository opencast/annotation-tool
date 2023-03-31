/**
 * A module representing the questionnaire model.
 * @module models-questionnaire
 */
define(
    [
        "underscore",
        "util",
        "models/resource"
    ],
    function (
        _,
        util,
        Resource
    ) {
        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-questionnaire
         */
        var Questionnaire = Resource.extend({
            /**
             * @see module:models-resource.Resource#administratorCanEditPublicInstances
             */
            administratorCanEditPublicInstances: true,

            /** @override */
            keepDeleted: false,

            /**
             * Default model values.
             * @alias module:models-questionnaire.Questionnaire#defaults
             */
            defaults: function () {
                return _.extend(Resource.prototype.defaults, {
                    content: {}
                });
            },

            /**
             * Constructor.
             * @alias module:models-questionnaire.Questionnaire#initialize
             * @param {object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                Resource.prototype.initialize.apply(this, arguments);

                this.set("settings", _.extend({
                    createdAsMine: !this.isPublic()
                }, this.get("settings")));
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-questionnaire.Questionnaire#parse
             * @param {object} attr Object literal containing the model attribute to parse.
             * @return {object} The object literal with the list of parsed model attribute.
             */
            parse: function (attr) {
                attr = Resource.prototype.parse.call(this, attr);

                if (_.isString(attr.content)) {
                    attr.content = util.parseJSONString(attr.content);
                }

                return attr;
            },

            /**
             * Validate the attribute list passed to the model.
             * @alias module:models-questionnaire.Questionnaire#validate
             * @param {object} attr Object literal containing the model attribute to validate.
             * @return {string} If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.apply(this, arguments);

                if (invalidResource) return invalidResource;

                if (!attr.content instanceof Object) {
                    return "'content' attribute must be an object";
                }

                return undefined;
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @todo CC | Review: Find source for unwanted 'labels' (seems to be added from video.js)
             * @alias module:models-questionnaire.Questionnaire#toJSON
             * @param {object} options The options to control the "JSONification" of this collection.
             * @return {JSON} JSON representation of the instance.
             */
            toJSON: function (options) {
                var json = Resource.prototype.toJSON.call(this, options);

                // Avoid infinite loop
                delete json.labels;

                if (options && options.stringifySub) {
                    json.content = JSON.stringify(json.content);
                }

                return json;
            },

            /**
             * Access an questionnaire's form and schema
             * @alias module:models-questionnaire.Questionnaire#getForm
             * @return {object} JSON form and schema
             */
            getForm: function () {
                const attr = this.get("content");

                return _.pick(attr, "form", "schema");
            },

            /**
             * Generate a `prompt` attribute according to this questionnaire's content items.
             * @alias module:models-questionnaire.Questionnaire#getPromptAttribute
             * @return {string} A string containing the value for the `prompt` attribute.
             */
            getPromptAttribute: function () {
                const obj = _.pick(this.get("content"), "prompt");

                return obj.prompt;
            }
        });

        return Questionnaire;
    }
);
