define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var buffer = "", helper, options;
  buffer += " and modified on "
    + escapeExpression((helper = helpers.formatDate || (depth0 && depth0.formatDate),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.updateddate), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.updateddate), options)));
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "<i class=\"delete-comment icon-trash\" title=\"Delete comment\"></i>";
  }

function program5(depth0,data) {
  
  
  return "<i class=\"edit-comment icon-pencil\" title=\"Edit comment\"></i>";
  }

  buffer += "<span class=\"comments header\">\n	<span class=\"caption print\">Comment</span>\n	<span class=\"username\">";
  if (helper = helpers.creator) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.creator); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n	<span class=\"date\">on "
    + escapeExpression((helper = helpers.formatDate || (depth0 && depth0.formatDate),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.creationdate), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.creationdate), options)));
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.updateddate), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>\n</span>\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.canEdit), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.canEdit), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<span class=\"comment\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>\n";
  return buffer;
  })

});