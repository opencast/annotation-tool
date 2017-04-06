define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " (double-click to edit)";
  }

function program3(depth0,data) {
  
  
  return " ";
  }

function program5(depth0,data) {
  
  
  return "disabled";
  }

function program7(depth0,data) {
  
  
  return "has-duration";
  }

function program9(depth0,data) {
  
  
  return "no-duration";
  }

function program11(depth0,data) {
  
  
  return "\n        <i class=\"private icon-user\" title=\"You own this annotation\"></i>\n        ";
  }

function program13(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <span class=\"scaling\">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n        </span>\n        ";
  return buffer;
  }
function program14(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                <select>\n                        ";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.scalevalues), {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n                </select>\n                ";
  return buffer;
  }
function program15(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                        <option value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSelected), {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n                        ";
  return buffer;
  }
function program16(depth0,data) {
  
  
  return "selected=\"selected\"";
  }

function program18(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                <span class=\"read-only\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                ";
  return buffer;
  }

function program20(depth0,data) {
  
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

function program22(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                    <span class=\"abbreviation\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    <span class=\"label-value print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(23, program23, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n                ";
  return buffer;
  }
function program23(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                        <span class=\"scalevalue print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span>\n                    ";
  return buffer;
  }

function program25(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n                    <span class=\"no-label\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n                ";
  return buffer;
  }

function program27(depth0,data) {
  
  
  return "\n        <i class=\"delete icon-trash\" title=\"Delete annotation.\"></i>\n        ";
  }

function program29(depth0,data) {
  
  
  return "\n        <i class=\"toggle-edit icon-pencil\" title=\"Edit annotation.\"></i>\n        ";
  }

function program31(depth0,data) {
  
  
  return "icon-comment-amount";
  }

function program33(depth0,data) {
  
  
  return "icon-comment";
  }

function program35(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n            <span class=\"comment-amount\">";
  if (helper = helpers.numberOfComments) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.numberOfComments); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n            ";
  return buffer;
  }

function program37(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += " \n<div id=\"text-container";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"in text-container\">\n    <span class=\"text\">\n            <span class=\"freetext\">\n                <textarea placeholder=\"free text...\" style=\"height: ";
  if (helper = helpers.textHeight) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.textHeight); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "px\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n            </span>\n            <div class=\"button-bar\">\n                <button type=\"button\" class=\"btn\">Cancel</button>\n                <button type=\"submit\" class=\"btn btn-primary\">OK</button>\n            </div>\n    </span>\n</div>\n";
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
    + "\" class=\"proxy-anchor\"></a>\n\n        <a class=\"collapse\" title=\"collapse\">\n            <i class=\"icon-chevron-down\"></i>\n        </a>\n\n        <button class=\"btn in\" title=\"Set the video playhead as start point.\">IN</button>\n        <span class=\"start\">\n                <input title=\"Start time";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" id=\"start-";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"start-value\" type=\"text\" value=\""
    + escapeExpression((helper = helpers.time || (depth0 && depth0.time),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.start), options) : helperMissing.call(depth0, "time", (depth0 && depth0.start), options)))
    + "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isEditEnable), {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "></input>\n        </span>\n\n        <span class=\"end ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.duration), {hash:{},inverse:self.program(9, program9, data),fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n                <input title=\"End time";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" id=\"end-";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"end-value\" type=\"text\" value=\""
    + escapeExpression((helper = helpers.end || (depth0 && depth0.end),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.start), (depth0 && depth0.duration), options) : helperMissing.call(depth0, "end", (depth0 && depth0.start), (depth0 && depth0.duration), options)))
    + "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isEditEnable), {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "></input>\n        </span>\n        <button class=\"btn out\" title=\"Set the video playhead as end point.\">OUT</button>\n\n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalues), {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n        \n        <span class=\"category\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(25, program25, data),fn:self.program(22, program22, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </span>\n    </div>\n\n    <div class=\"right\">\n        ";
  options={hash:{},inverse:self.noop,fn:self.program(27, program27, data),data:data}
  if (helper = helpers.canBeDeleted) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.canBeDeleted); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.canBeDeleted) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(27, program27, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(29, program29, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n        <i class=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.numberOfComments), {hash:{},inverse:self.program(33, program33, data),fn:self.program(31, program31, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" title=\"";
  if (helper = helpers.numberOfComments) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.numberOfComments); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + " Comment(s)\">\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.numberOfComments), {hash:{},inverse:self.noop,fn:self.program(35, program35, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </i>\n    </div>\n</div>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(37, program37, data),fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  })

});