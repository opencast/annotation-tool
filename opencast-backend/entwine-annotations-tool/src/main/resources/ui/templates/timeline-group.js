define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " mine";
  }

function program3(depth0,data) {
  
  var stack1, helper;
  if (helper = helpers.timelineMaxLevel) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.timelineMaxLevel); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  return escapeExpression(stack1);
  }

function program5(depth0,data) {
  
  
  return "0";
  }

function program7(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "onclick=\"annotationsTool.views.timeline.onTrackSelected(event,'";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "');\" ondblclick=\"annotationsTool.views.timeline.initTrackUpdate(event,'";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "');\"";
  return buffer;
  }

function program9(depth0,data) {
  
  var helper, options;
  return escapeExpression((helper = helpers.secure || (depth0 && depth0.secure),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.description), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.description), options)));
  }

function program11(depth0,data) {
  
  
  return "No description";
  }

function program13(depth0,data) {
  
  
  return "\n        <i class=\"private icon-user\" title=\"You own this track\"></i>\n    ";
  }

function program15(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n        <div class=\"group-edit\">\n            <i onclick=\"annotationsTool.views.timeline.onDeleteTrack(event,'";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "');\" class=\"delete icon-trash\" title=\"Delete  track\"></i>\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </div>\n    ";
  return buffer;
  }
function program16(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "<i onclick=\"annotationsTool.views.timeline.initTrackUpdate(event,'";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "');\" class=\"update  icon-pencil\" title=\"Update  track\"></i>";
  return buffer;
  }

function program18(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "<span class=\"visibility\" \n                  onmouseup=\"";
  options={hash:{},inverse:self.program(21, program21, data),fn:self.program(19, program19, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.program(21, program21, data),fn:self.program(19, program19, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\"\n                  onmousedown=\"";
  options={hash:{},inverse:self.program(25, program25, data),fn:self.program(23, program23, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.program(25, program25, data),fn:self.program(23, program23, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" \n                  title=\"";
  options={hash:{},inverse:self.program(29, program29, data),fn:self.program(27, program27, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.program(29, program29, data),fn:self.program(27, program27, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n                    <i class=\"icon-dark-grey ";
  options={hash:{},inverse:self.program(34, program34, data),fn:self.program(32, program32, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.program(34, program34, data),fn:self.program(32, program32, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\"></i> ";
  options={hash:{},inverse:self.program(39, program39, data),fn:self.program(37, program37, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.program(39, program39, data),fn:self.program(37, program37, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>";
  return buffer;
  }
function program19(depth0,data) {
  
  var buffer = "";
  return buffer;
  }

function program21(depth0,data) {
  
  
  return "$(this).parent().parent().popover('show');";
  }

function program23(depth0,data) {
  
  
  return "\n                                      annotationsTool.alertWarning('Public tracks have been disallowed for this video.');\n                              ";
  }

function program25(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n                                      annotationsTool.views.timeline.onUpdateTrack(event,'";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "');\n                              ";
  return buffer;
  }

function program27(depth0,data) {
  
  
  return "No public track allowed in private-only mode!";
  }

function program29(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "Make ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isPublic), {hash:{},inverse:self.noop,fn:self.program(30, program30, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "visible to others";
  return buffer;
  }
function program30(depth0,data) {
  
  
  return "in";
  }

function program32(depth0,data) {
  
  
  return "icon-private";
  }

function program34(depth0,data) {
  
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isPublic), {hash:{},inverse:self.program(32, program32, data),fn:self.program(35, program35, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  }
function program35(depth0,data) {
  
  
  return "icon-public";
  }

function program37(depth0,data) {
  
  
  return "Private";
  }

function program39(depth0,data) {
  
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isPublic), {hash:{},inverse:self.program(37, program37, data),fn:self.program(40, program40, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  }
function program40(depth0,data) {
  
  
  return "Public";
  }

  buffer += "<div class=\"timeline-group";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " track-max-level-";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.timlineMaxLevel), {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" data-id=\"";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n    <a id=\"track";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"\n       class=\"content-overlay\"\n       ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n       title=\""
    + escapeExpression((helper = helpers.secure || (depth0 && depth0.secure),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\" \n       rel=\"popover\"\n       data-trigger=\"manual\" \n       data-content=\"<p>";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.description), {hash:{},inverse:self.program(11, program11, data),fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p> <p><b>Owner:</b> ";
  if (helper = helpers.created_by_nickname) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.created_by_nickname); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</p>\"\n       onmouseleave=\"$('div.popover.fade.right.in').remove();\"\n       onmouseenter=\"$(this).popover('show');\">\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        <div class=\"content\">\n            "
    + escapeExpression((helper = helpers.secure || (depth0 && depth0.secure),options={hash:{},data:data},helper ? helper.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\n        </div>\n    ";
  options={hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data}
  if (helper = helpers.canBeDeleted) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.canBeDeleted); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.canBeDeleted) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </a>\n</div>\n";
  return buffer;
  })

});