define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "style=\"background-color:"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "disabled='disabled'";
  }

function program5(depth0,data) {
  
  var stack1;
  return escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  }

  buffer += "<div class=\"catItem-header\" ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " title=\"";
  if (helper = helpers.name) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.name); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n    <input type=\"text\" value=\"";
  if (helper = helpers.name) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.name); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.notEdit), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "/> \n   <i class=\"icon-pencil scale edit\" title=\"Edit scaling for this category\"></i> \n    <i class=\"icon-trash delete edit\"></i>\n    <div class=\"colorpicker\">\n        <input id=\"color-";
  if (helper = helpers.name) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.name); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" type=\"text\" class=\"colorpicker edit\" value=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.settings), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" /></div>\n    </div>\n</div>\n<div class=\"catItem-labels\" ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "></div>\n<div class=\"catItem-add edit\"><i class=\"icon-plus-sign\"></i>Create a label</div>\n";
  return buffer;
  })

});