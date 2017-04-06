define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "has-duration";
  }

function program3(depth0,data) {
  
  
  return "no-duration";
  }

function program5(depth0,data) {
  
  
  return "\n        <i class=\"private icon-user\" title=\"You own this annotation\"></i>\n        ";
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <span class=\"scaling\">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n        </span>\n        ";
  return buffer;
  }
function program8(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                <span class=\"read-only\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                ";
  return buffer;
  }

function program10(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "title=\""
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.category)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " - "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")\"";
  return buffer;
  }

function program12(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                    <span class=\"abbreviation\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    <span class=\"label-value print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n                ";
  return buffer;
  }
function program13(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                        <span class=\"scalevalue print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span>\n                    ";
  return buffer;
  }

function program15(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n                    <span class=\"no-label\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n                ";
  return buffer;
  }

function program17(depth0,data) {
  
  
  return "\n        <i class=\"delete icon-trash\" title=\"Delete annotation.\"></i>\n        ";
  }

function program19(depth0,data) {
  
  
  return "\n        <i class=\"toggle-edit icon-pencil\" title=\"Edit annotation.\"></i>\n        ";
  }

function program21(depth0,data) {
  
  
  return "icon-comment-amount";
  }

function program23(depth0,data) {
  
  
  return "icon-comment";
  }

function program25(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n            <span class=\"comment-amount\">";
  if (helper = helpers.numberOfComments) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.numberOfComments); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n            ";
  return buffer;
  }

function program27(depth0,data) {
  
  var buffer = "", stack1;
  buffer += " \n            "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n        ";
  return buffer;
  }

function program29(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += " \n            ";
  if (helper = helpers.textReadOnly) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.textReadOnly); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        ";
  return buffer;
  }

  buffer += "<div class=\"";
  if (helper = helpers.state) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.state); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n    <div class=\"left\">\n        <a href=\"#";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"proxy-anchor\"></a>\n\n        <a class=\"collapse\" title=\"collapse\">\n            <i class=\"icon-chevron-down\"></i>\n        </a>\n\n        <span class=\"start read-only\">\n            "
    + escapeExpression((helper = helpers.time || (depth0 && depth0.time),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.start), options) : helperMissing.call(depth0, "time", (depth0 && depth0.start), options)))
    + "\n        </span>\n\n        <span class=\"end ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.duration), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " read-only\">\n               "
    + escapeExpression((helper = helpers.end || (depth0 && depth0.end),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.start), (depth0 && depth0.duration), options) : helperMissing.call(depth0, "end", (depth0 && depth0.start), (depth0 && depth0.duration), options)))
    + "\n        </span>\n\n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        \n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n        \n        \n        <span class=\"category\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(15, program15, data),fn:self.program(12, program12, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </span>\n    </div>\n\n    <div class=\"right\">\n        ";
  options={hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data}
  if (helper = helpers.canBeDeleted) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.canBeDeleted); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.canBeDeleted) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(19, program19, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        <i class=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.numberOfComments), {hash:{},inverse:self.program(23, program23, data),fn:self.program(21, program21, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" title=\"";
  if (helper = helpers.numberOfComments) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.numberOfComments); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + " Comment(s)\">\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.numberOfComments), {hash:{},inverse:self.noop,fn:self.program(25, program25, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </i>\n    </div>\n</div>\n\n<div id=\"text-container";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text-container\">\n    <div class=\"creator-info\">\n        <span class=\"user\">";
  if (helper = helpers.created_by_nickname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.created_by_nickname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n        <span class=\"created\">"
    + escapeExpression((helper = helpers.formatDate || (depth0 && depth0.formatDate),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.created_at), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.created_at), options)))
    + "</span> \n        <span class=\"track\">";
  if (helper = helpers.track) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.track); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n    </div>\n    <span class=\"text freetext read-only\">\n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(29, program29, data),fn:self.program(27, program27, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </span>\n</div>";
  return buffer;
  })

});