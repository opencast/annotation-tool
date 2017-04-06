define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "      <div class=\"modal-header\">\n\n        <h3>";
  if (helper = helpers.title) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.title); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n            <span class=\"manage\">\n                <select id=\"scale-id\">\n                </select>\n                <a class=\"btn edit-scale\"><icon class=\"icon-edit\"></i></a>\n                <a class=\"btn create-scale\"><icon class=\"icon-plus-sign\"></i></a>\n            </span>\n        </h3>\n\n      </div>\n      <div class=\"modal-body\"></div>\n\n      <div class=\"modal-footer\">\n        <a id=\"cancel-scale\" href=\"#\" class=\"btn\">Cancel</a>\n        <a id=\"save-scale\" href=\"#\" class=\"btn btn-primary\">Save</a>\n      </div>";
  return buffer;
  })

});