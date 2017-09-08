define(["handlebars", "underscore", "i18next", "roles"], function (Handlebars, _, i18next, ROLES) {

    /**
     * Handlebars helper to check if the annotations-tool is in private-only mode.
     * @alias module:Handlebars#isPrivateOnly
     * @return {boolean}    True if the the tool is in private-only mode.
     */
    Handlebars.registerHelper("isPrivateOnly", function (options) {
        if (annotationsTool.isPrivateOnly()) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    /**
     * Handlebars helper to know if the current user can deleted the current model.
     * @alias module:Handlebars#canBeDeleted
     * @return {boolean}    True if the current user can deleted the current model.
     */
    Handlebars.registerHelper("canBeDeleted", function (options) {
        if (this.isMine || ROLES.ADMINISTRATOR === annotationsTool.getUserRole()) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper("greater", function (value1, value2, options) {
        console.log(value1 + " type " + typeof value1);
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
        return annotationsTool.getWellFormatedTime(start);
    });

    /**
     * Handlebars helper to display the annotation duration
     * @alias module:Handlebars#end
     * @param  {double} start The start time
     * @param  {double} duration The annotation duration
     * @return {string}      The formated time
     */
    Handlebars.registerHelper("end", function (start, duration) {
        return annotationsTool.getWellFormatedTime(start + (duration || 0.0));
    });

    /**
     * Handlebars helper to get user nickname
     * @alias module:Handlebars#nickname
     * @param  {User | integer} user The user object of its id
     * @return {string}      The user nickname
     */
    Handlebars.registerHelper("nickname", function (user) {
        if (!_.isObject(user)) {
            return annotationsTool.users.get(user).get("nickname");
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
        return annotationsTool.formatDate(date);
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

    return Handlebars;
});
