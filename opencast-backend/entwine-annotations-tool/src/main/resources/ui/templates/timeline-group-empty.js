define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var helper, options;
  return escapeExpression((helper = helpers.secure || (depth0 && depth0.secure),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.description), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.description), options)));
  }

function program3(depth0,data) {
  
  
  return "No description";
  }

  buffer += "<div class=\"timeline-group\">\n    <div class=\"track-id\">";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n    <a id=\"track";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"\n       class=\"content-overlay\"\n       title=\""
    + escapeExpression((helper = helpers.secure || (depth0 && depth0.secure),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\"\n       rel=\"popover\"\n       data-content=\"<p>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.description), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\"\n      >\n        <div class=\"content empty\">\n            "
    + escapeExpression((helper = helpers.secure || (depth0 && depth0.secure),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\n        </div>\n    </a>\n</div>\n";
  return buffer;
  })

});