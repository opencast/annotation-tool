define(["handlebars", "underscore", "i18next", "util"], function (Handlebars, _, i18next, util) {

    /**
     * Expose the global annotation tool to the templates to access configuration.
     * @alias module:Handlebars#annotationTool
     * @param {String} key The property to access from the global anntoation tool
     * @return The value of the given property
     */
    Handlebars.registerHelper("annotationTool", function (key) {
        return annotationTool[key];
    });

    Handlebars.registerHelper("greater", function (value1, value2, options) {
        if (value1 > value2) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper("toUpperCase", function (options) {
        return options.fn(this).toUpperCase();
    });

    /**
     * Handlebars helper to display a point in time on the timeline
     * @alias module:Handlebars#time
     * @param {number} start The time to format in seconds
     * @return {string} The formated time
     */
    Handlebars.registerHelper("time", util.formatTime);

    /**
     * Handlebars helper to get user nickname
     * @alias module:Handlebars#nickname
     * @param {User | number} user The user object or its id
     * @return {string} The user nickname
     */
    Handlebars.registerHelper("nickname", function (user) {
        if (_.isNumber(user)) {
            return annotationTool.users.get(user).get("nickname");
        } else {
            return user.nickname;
        }
    });

    /**
     * Handlebars helper to format a date to the configured format
     * @alias module:Handlebars#formatDate
     * @param  {date} date The date to format
     * @return {string} The formated date
     */
    Handlebars.registerHelper("formatDate", util.formatDate);

    /**
     * Translate a string using `i18next`
     * @see module:i18next
     * @alias module:Handlebars#t
     */
    Handlebars.registerHelper("t", function (translationKey, options) {
        return new Handlebars.SafeString(
            i18next.t(translationKey, options.hash)
        );
    });

    /**
     * Trnasform newlines into HTML break tags for display and escape.
     * @alias module:Handlebars#displayRaw
     */
    Handlebars.registerHelper("displayRaw", function (text) {
        return new Handlebars.SafeString(
            _.escape(text).replace(/\n/g, "<br/>")
        );
    });

    /**
     * Encode some data to JSON to store it in `data`-attributes
     * @alias module:Handlebars#data
     */
    Handlebars.registerHelper("data", function (value) {
        return JSON.stringify(value);
    });

    Handlebars.registerHelper('ifeq', function (a, b, options) {
        if (a == b) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    Handlebars.registerHelper("withScaleValue", function (id) {
        var scaleValue = _.findWhere(annotationTool.video.getScaleValues(), { id: id });

        return scaleValue && scaleValue.toJSON();
    });

    Handlebars.registerHelper("withLabel", function (id) {
        var label = _.findWhere(annotationTool.video.getLabels(), { id: id });

        return label && label.toJSON();
    });

    return Handlebars;
});
