define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"scale-value\">\n    <a class=\"btn order-up\"><i class=\"icon-arrow-up\"></i></a>\n    <a class=\"btn order-down\"><i class=\"icon-arrow-down\"></i></a>\n    <input type=\"text\" class=\"input-small scale-value-name\" value=\"";
  if (helper = helpers.name) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.name); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" /> \n    <input type=\"text\" class=\"input-small scale-value-value\" placeholder=\"Insert a decimal number.\" value=\"";
  if (helper = helpers.value) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.value); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" />\n    <a class=\"btn delete-scale-value\"><i class=\"icon-remove\"></i></a>\n</div>";
  return buffer;
  })

});