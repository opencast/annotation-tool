define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return "\n<div class=\"comment-header\">\n    <textarea class=\"input-block-level focused create\" id=\"focusedInput\" placeholder=\"Write a comment for this annotation.\"></textarea>\n    <div class=\"button-bar\">\n        <button type=\"button\" class=\"btn cancel-comment\">Cancel</button>\n        <button type=\"submit\" class=\"btn btn-primary add-comment\">Insert</button>\n    </div>\n</div>\n";
  }

  buffer += "<div class=\"title\">Comments</div>\n<div id=\"comment-list";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"comment-list\"></div>\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.addState), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;
  })

});