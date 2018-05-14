define(["handlebars", "underscore", "i18next", "util", "roles"], function (Handlebars, _, i18next, util, ROLES) {

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
     * Handlebars helper to secure the text field
     * @alias module:Handlebars#time
     * @param  {double} start The start time
     * @return {string}      The formated time
     */
    Handlebars.registerHelper("time", function (start) {
        return annotationTool.getWellFormatedTime(start);
    });

    /**
     * Handlebars helper to display the annotation duration
     * @alias module:Handlebars#end
     * @param  {double} start The start time
     * @param  {double} duration The annotation duration
     * @return {string}      The formated time
     */
    Handlebars.registerHelper("end", function (start, duration) {
        return annotationTool.getWellFormatedTime(start + (duration || 0.0));
    });

    /**
     * Handlebars helper to get user nickname
     * @alias module:Handlebars#nickname
     * @param  {User | integer} user The user object or its id
     * @return {string} The user nickname
     */
    Handlebars.registerHelper("nickname", function (user) {
        if (!_.isObject(user)) {
            return annotationTool.users.get(user).get("nickname");
        } else {
            return user.nickname;
        }
    });

    /**
     * Handlebars helper to format a date to the configured format
     * @alias module:Handlebars#formatDate
     * @param  {date} date The date to format
     * @return {string}      The formated date
     */
    Handlebars.registerHelper("formatDate", function (date) {
        return util.formatDate(date);
    });

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
     * Concatenate strings and possibly variables.
     * Mainly used for nesting helpers.
     * @alias module:Handlebars#concat
     */
    Handlebars.registerHelper("concat", function () {
	return Array.prototype.slice.call(arguments, 0, -1).join('');
    });

    return Handlebars;
});
