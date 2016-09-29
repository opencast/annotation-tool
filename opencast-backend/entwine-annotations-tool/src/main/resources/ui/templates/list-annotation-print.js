define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <span class=\"scaling\">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n        </span>\n        ";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                <span class=\"read-only\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                ";
  return buffer;
  }

function program4(depth0,data) {
  
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

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                    <span class=\"abbreviation\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    <span class=\"label-value print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n                ";
  return buffer;
  }
function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                        <span class=\"scalevalue print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span>\n                    ";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n                    <span class=\"no-label\">";
  if (helper = helpers.text) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.text); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n                ";
  return buffer;
  }

function program11(depth0,data) {
  
  
  return "icon-comment-amount";
  }

function program13(depth0,data) {
  
  
  return "icon-comment";
  }

function program15(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n            <span class=\"comment-amount\">";
  if (helper = helpers.numberOfComments) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.numberOfComments); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n            ";
  return buffer;
  }

function program17(depth0,data) {
  
  
  return "has-duration";
  }

function program19(depth0,data) {
  
  
  return "no-duration";
  }

function program21(depth0,data) {
  
  var stack1;
  return escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.category)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  }

function program23(depth0,data) {
  
  
  return "Textannotation";
  }

  buffer += "<div class=\"";
  if (helper = helpers.state) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.state); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n    <div class=\"left\">\n        \n        ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "         \n        \n        <span class=\"category\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(9, program9, data),fn:self.program(6, program6, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </span>\n    </div>\n\n    <div class=\"right\">\n        <i class=\"";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.numberOfComments), {hash:{},inverse:self.program(13, program13, data),fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" title=\"";
  if (helper = helpers.numberOfComments) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.numberOfComments); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + " Comment(s)\">\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.numberOfComments), {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </i>\n    </div>\n</div>\n\n<div id=\"text-container";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"text-container\">\n    <span class=\"start read-only\">\n        "
    + escapeExpression((helper = helpers.time || (depth0 && depth0.time),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.start), options) : helperMissing.call(depth0, "time", (depth0 && depth0.start), options)))
    + "\n    </span>\n\n    <span class=\"end ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.duration), {hash:{},inverse:self.program(19, program19, data),fn:self.program(17, program17, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " read-only\">\n           "
    + escapeExpression((helper = helpers.end || (depth0 && depth0.end),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.start), (depth0 && depth0.duration), options) : helperMissing.call(depth0, "end", (depth0 && depth0.start), (depth0 && depth0.duration), options)))
    + "\n    </span>\n\n    <div class=\"creator-info\">\n        <span class=\"category-print\">";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(23, program23, data),fn:self.program(21, program21, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>\n        <span class=\"user\">";
  if (helper = helpers.created_by_nickname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.created_by_nickname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n        <span class=\"created\">"
    + escapeExpression((helper = helpers.formatDate || (depth0 && depth0.formatDate),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.created_at), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.created_at), options)))
    + "</span>\n        <span class=\"track\">";
  if (helper = helpers.track) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.track); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n    </div>\n</div>";
  return buffer;
  })

});