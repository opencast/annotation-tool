define(["handlebars", "roles"], function (Handlebars, ROLES) {
    
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

    return Handlebars;
});