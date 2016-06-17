define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "        <form class=\"form-horizontal\">\n            <fieldset>                \n                <div class=\"control-group\">\n                    <label class=\"control-label\" for=\"nickanme\"><b>*</b> Name: </label>\n                    <div class=\"controls\">\n                        <input type=\"text\" class=\"input-xlarge scale-name\" placeholder=\"Insert the category name\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scale)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n                    </div>\n                    <label class=\"control-label\" for=\"nickanme\">Description: </label>\n                    <div class=\"controls\">\n                        <input type=\"text\" class=\"input-xlarge scale-description\" placeholder=\"Insert the category description\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scale)),stack1 == null || stack1 === false ? stack1 : stack1.description)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n                    </div>\n                    <div class=\"controls\">\n                        <a class=\"btn delete-scale\"><i class=\"icon-trash\"></i>Delete</a>\n                    </div>\n\n                </div>\n\n                <div>\n                    <div class=\"header-name\">Name</div>\n                    <div class=\"header-value\">Value</div>\n                </div>\n                <div class=\"control-group list-scale-values\"></div>\n                 <a class=\"btn create-scale-value\"><i class=\"icon-plus-sign\"></i> Add scale value</a>\n\n            </fieldset>\n        </form>";
  return buffer;
  })

});