define(['handlebars'], function(Handlebars) {

this["JST"] = this["JST"] || {};

this["JST"]["templates/alert-modal.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"modal\" id=\"modal-alert\">\n      <div class=\"modal-body\">\n            <div class=\"alert ";
  if (stack1 = helpers['class']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0['class']); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + " alert-block\">\n                  <h4>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.title); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h4>\n\n                  ";
  if (stack1 = helpers.message) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.message); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n            </div>\n      </div>\n      <div class=\"modal-footer\">\n            <a id=\"confirm-alert\" href=\"#\" class=\"btn btn-primary\">Ok</a>\n      </div>\n</div>";
  return buffer;
  });

this["JST"]["templates/annotate-category.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

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
  stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " title=\"";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.name); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">\n    <input type=\"text\" value=\"";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.name); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.notEdit), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "/> \n   <i class=\"icon-pencil scale edit\" title=\"Edit scaling for this category\"></i> \n    <i class=\"icon-trash delete edit\"></i>\n    <div class=\"colorpicker\">\n        <input id=\"color-";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.name); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" type=\"text\" class=\"colorpicker edit\" value=\"";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.settings), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" /></div>\n    </div>\n</div>\n<div class=\"catItem-labels\" ";
  stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "></div>\n<div class=\"catItem-add edit\"><i class=\"icon-plus-sign\"></i>Create a label</div>\n";
  return buffer;
  });

this["JST"]["templates/annotate-label.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return "disabled='disabled'";
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<li value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" title=\""
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" >"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</li>\n";
  return buffer;
  }

  buffer += "<span class=\"item-abbreviation read-only\" title=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.value); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.abbreviation) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.abbreviation); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n<input class=\"item-abbreviation edit\" maxlength=\"3\" type=\"text\" value=\"";
  if (stack1 = helpers.abbreviation) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.abbreviation); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.notEdit), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "/> \n<input class=\"item-value edit\" type=\"text\" value=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.value); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" placeholder=\"Label value...\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.notEdit), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "/> \n<span class=\"item-icon\">";
  if (stack1 = helpers.icon) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.icon); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n<i class=\"icon-trash delete edit\"></i>\n<ul class=\"scaling\">\n";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.scaleValues), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n\n";
  return buffer;
  });

this["JST"]["templates/annotate-tab-title.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<li class='tab-button'>\n    <a href='#labelTab-";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "'>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n        <i class='icon-upload import edit' title=\"Upload categories\" ></i>\n        <input class=\"file\" type=\"file\" id=\"file-";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n        <i class='icon-download export edit' title=\"Download categories\" ></i>\n        <i class='icon-plus-sign add edit'></i>\n</a></li>\"";
  return buffer;
  });

this["JST"]["templates/annotate-tab.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<!-- Carousel nav -->\n<div class=\"controls\">\n	<div class=\"pagination pagination-centered\" style=\"display:none\">\n  	<ul>\n    	<li><a href=\"#\" id=\"carousel-prev\">&lt;</a></li>\n    	<li><a href=\"#\" id=\"carousel-next\">&gt;</a></li>\n  	</ul>\n	</div>\n</div>\n\n\n<div id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"carousel slide\">\n  <!-- Carousel items -->\n  <div class=\"carousel-inner\">\n\n  </div>\n\n</div>\n\n";
  return buffer;
  });

this["JST"]["templates/categories-legend.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n	<div class=\"category-legend print\">\n		<div>\n			<span class=\"name\">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n			";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.scale), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		</div>\n\n		";
  stack2 = helpers.each.call(depth0, (depth0 && depth0.labels), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n			<span class=\"scale\"> - rating-scale "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scale)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ": ";
  stack2 = helpers.each.call(depth0, ((stack1 = (depth0 && depth0.scale)),stack1 == null || stack1 === false ? stack1 : stack1.scaleValues), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</span>\n			";
  return buffer;
  }
function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<span class=\"scale-value\">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = (depth0 && depth0.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span>";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<div class=\"label\">\n			<span class=\"abbreviation\">"
    + escapeExpression(((stack1 = (depth0 && depth0.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n			<span class=\"value\">"
    + escapeExpression(((stack1 = (depth0 && depth0.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n		</div>\n		";
  return buffer;
  }

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["JST"]["templates/comment.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "	and modified on the ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.formatDate || (depth0 && depth0.formatDate)),stack1 ? stack1.call(depth0, (depth0 && depth0.updateddate), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.updateddate), options)));
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "<i class=\"delete-comment icon-trash\" title=\"Delete comment\"></i>";
  }

function program5(depth0,data) {
  
  
  return "<i class=\"edit-comment icon-pencil\" title=\"Edit comment\"></i>";
  }

  buffer += "<span class=\"comments header\">\n	<span class=\"caption print\">Comment</span>\n	<span class=\"username\">";
  if (stack1 = helpers.creator) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.creator); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n	<span class=\"date\">added on the ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.formatDate || (depth0 && depth0.formatDate)),stack1 ? stack1.call(depth0, (depth0 && depth0.creationdate), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.creationdate), options)));
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.updateddate), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</span>\n</span>\n";
  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};
  if (stack2 = helpers.canBeDeleted) { stack2 = stack2.call(depth0, options); }
  else { stack2 = (depth0 && depth0.canBeDeleted); stack2 = typeof stack2 === functionType ? stack2.call(depth0, options) : stack2; }
  if (!helpers.canBeDeleted) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.canEdit), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n<span class=\"text\">";
  if (stack2 = helpers.text) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.text); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</span>\n";
  return buffer;
  });

this["JST"]["templates/comments-container.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"comment-header\">\n	<span class=\"add-comment\"><a href=\"#\" class=\"add-comment\">add comment</a></span>\n	<textarea style=\"display: none;\" class=\"input-block-level focused hide\" id=\"focusedInput\" placeholder=\"Write a comment for this annotation.\"></textarea>\n	<div class=\"button-bar\">\n		<button type=\"button\" class=\"btn hide\">Cancel</button>\n		<button type=\"submit\" class=\"btn btn-primary hide\">Insert</button>\n	</div>\n</div>\n\n<div id=\"comment-list";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"comment-list\"></div>";
  return buffer;
  });

this["JST"]["templates/delete-modal.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"modal\" id=\"modal-delete\">\n	  <div class=\"modal-header\">\n	    <h3>Delete</h3>\n	  </div>\n	  <div class=\"modal-body\">\n	  </div>\n	  <div class=\"modal-footer\">\n            <a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n	    <a id=\"confirm-delete\" href=\"#\" class=\"btn btn-primary\">Delete</a>\n	  </div>\n</div>";
  });

this["JST"]["templates/delete-warning-content.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "Do really want to delete the ";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.type); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + " <i>";
  if (stack1 = helpers.content) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.content); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</i>?";
  return buffer;
  });

this["JST"]["templates/edit-comment.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<textarea class=\"input-block-level focused hide\" id=\"focusedInput\">";
  if (stack1 = helpers.text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.text); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n<div class=\"button-bar\">\n	<button type=\"button\" class=\"btn\">Cancel</button>\n	<button type=\"submit\" class=\"btn btn-primary\">Save</button>	\n</div>";
  return buffer;
  });

this["JST"]["templates/list-annotation.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "style=\"background-color:"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.category)),stack1 == null || stack1 === false ? stack1 : stack1.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " - "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program5(depth0,data) {
  
  var stack1;
  if (stack1 = helpers.text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.text); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  return escapeExpression(stack1);
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <i class=\"icon-info-sign\" title=\"added by ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.created_by_nickname), {hash:{},inverse:self.program(10, program10, data),fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " on ";
  if (stack1 = helpers.track) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.track); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></i>\n        ";
  return buffer;
  }
function program8(depth0,data) {
  
  var stack1;
  if (stack1 = helpers.created_by_nickname) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.created_by_nickname); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  return escapeExpression(stack1);
  }

function program10(depth0,data) {
  
  var stack1, options;
  options = {hash:{},data:data};
  return escapeExpression(((stack1 = helpers.nickname || (depth0 && depth0.nickname)),stack1 ? stack1.call(depth0, (depth0 && depth0.created_by), options) : helperMissing.call(depth0, "nickname", (depth0 && depth0.created_by), options)));
  }

function program12(depth0,data) {
  
  
  return "\n        <i class=\"toggle-edit icon-pencil\" title=\"Edit annotation.\"></i>\n        ";
  }

function program14(depth0,data) {
  
  
  return "\n        <i class=\"delete icon-trash\" title=\"Delete annotation.\"></i>\n    ";
  }

function program16(depth0,data) {
  
  
  return "icon-chevron-right";
  }

function program18(depth0,data) {
  
  
  return "icon-chevron-down";
  }

function program20(depth0,data) {
  
  
  return " (double-click to edit)";
  }

function program22(depth0,data) {
  
  
  return " ";
  }

function program24(depth0,data) {
  
  
  return "disabled";
  }

function program26(depth0,data) {
  
  
  return "has-duration";
  }

function program28(depth0,data) {
  
  
  return "no-duration";
  }

function program30(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <span class=\"scaling\">\n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(31, program31, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n                ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(35, program35, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " \n        </span>\n        ";
  return buffer;
  }
function program31(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                <select class=\"edit\">\n                        ";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.scalevalues), {hash:{},inverse:self.noop,fn:self.program(32, program32, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n                </select>\n                ";
  return buffer;
  }
function program32(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n                        <option value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isSelected), {hash:{},inverse:self.noop,fn:self.program(33, program33, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n                        ";
  return buffer;
  }
function program33(depth0,data) {
  
  
  return "selected=\"selected\"";
  }

function program35(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                <span class=\"read-only\" title=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                ";
  return buffer;
  }

function program37(depth0,data) {
  
  
  return "\n        <i class=\"private icon-user\" title=\"You own this annotation\"></i>\n        ";
  }

function program39(depth0,data) {
  
  var stack1;
  return escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.category)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  }

function program41(depth0,data) {
  
  
  return "Free-text";
  }

function program43(depth0,data) {
  
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

function program45(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n                    <span class=\"abbreviation\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    <span class=\"label-value print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n                    ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.scalevalue), {hash:{},inverse:self.noop,fn:self.program(46, program46, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " \n                ";
  return buffer;
  }
function program46(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                        <span class=\"scalevalue print\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " ("
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scalevalue)),stack1 == null || stack1 === false ? stack1 : stack1.value)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ")</span>\n                    ";
  return buffer;
  }

function program48(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                    <span class=\"no-label\">";
  if (stack1 = helpers.text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.text); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n                ";
  return buffer;
  }

function program50(depth0,data) {
  
  
  return "collapse";
  }

function program52(depth0,data) {
  
  
  return "in";
  }

function program54(depth0,data) {
  
  var buffer = "", stack1;
  buffer += " \n        <span class=\"text\">\n                <span class=\"freetext\">\n                    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(55, program55, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n                    <span class=\"read-only\">";
  if (stack1 = helpers.textReadOnly) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.textReadOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>\n                </span>\n        </span>\n        ";
  return buffer;
  }
function program55(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                    <textarea class=\"edit\" placeholder=\"free text...\">";
  if (stack1 = helpers.text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.text); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</textarea>\n                    ";
  return buffer;
  }

  buffer += "<a href=\"#";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"proxy-anchor\"></a>\n<div class=\"header-container\" ";
  stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.category), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " title=\"";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\">\n    <div class=\"right\">\n        <i class=\"icon-comment-amount\" title=\"";
  if (stack2 = helpers.numberOfComments) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.numberOfComments); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + " Comment(s)\"><span class=\"comment-amount\">";
  if (stack2 = helpers.numberOfComments) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.numberOfComments); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "</span></i>\n\n        ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.created_by), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n        ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    \n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data};
  if (stack2 = helpers.canBeDeleted) { stack2 = stack2.call(depth0, options); }
  else { stack2 = (depth0 && depth0.canBeDeleted); stack2 = typeof stack2 === functionType ? stack2.call(depth0, options) : stack2; }
  if (!helpers.canBeDeleted) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n    </div>\n    <div class=\"left\">\n        <a class=\"collapse\" title=\"collapse\">\n         <i class=\"";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.collapsed), {hash:{},inverse:self.program(18, program18, data),fn:self.program(16, program16, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\"></i>\n        </a>\n        <button class=\"btn in edit\" title=\"Set the video playhead as start point.\">IN</button>\n        <span class=\"start\">\n                <input title=\"Start time";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" id=\"start-";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.id); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" class=\"start-value\" type=\"text\" value=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.time || (depth0 && depth0.time)),stack1 ? stack1.call(depth0, (depth0 && depth0.start), options) : helperMissing.call(depth0, "time", (depth0 && depth0.start), options)))
    + "\" ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isEditEnable), {hash:{},inverse:self.program(24, program24, data),fn:self.program(22, program22, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "></input>\n        </span>\n\n        <span class=\"end ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.duration), {hash:{},inverse:self.program(28, program28, data),fn:self.program(26, program26, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\">\n                <input title=\"End time";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" id=\"end-";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.id); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" class=\"end-value\" type=\"text\" value=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.end || (depth0 && depth0.end)),stack1 ? stack1.call(depth0, (depth0 && depth0.start), (depth0 && depth0.duration), options) : helperMissing.call(depth0, "end", (depth0 && depth0.start), (depth0 && depth0.duration), options)))
    + "\" ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isEditEnable), {hash:{},inverse:self.program(24, program24, data),fn:self.program(22, program22, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "></input>\n        </span>\n        <button class=\"btn out edit\" title=\"Set the video playhead as end point.\">OUT</button>\n\n        ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.scalevalues), {hash:{},inverse:self.noop,fn:self.program(30, program30, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " \n        \n        ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(37, program37, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n        <span class=\"category-print print\">";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(41, program41, data),fn:self.program(39, program39, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</span>\n\n        <div class=\"creator\">";
  if (stack2 = helpers.created_by_nickname) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.created_by_nickname); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "</div>\n\n        <div class=\"creation-date print\">";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.formatDate || (depth0 && depth0.formatDate)),stack1 ? stack1.call(depth0, (depth0 && depth0.created_at), options) : helperMissing.call(depth0, "formatDate", (depth0 && depth0.created_at), options)))
    + "</div>\n        \n        <span class=\"category\" ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.noop,fn:self.program(43, program43, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">\n                ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(48, program48, data),fn:self.program(45, program45, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n        </span>\n    </div>\n</div>\n<div id=\"text-container";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.id); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" class=\"";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.collapsed), {hash:{},inverse:self.program(52, program52, data),fn:self.program(50, program50, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " text-container\">\n        ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.program(54, program54, data),fn:self.program(22, program22, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</div>\n<!--<button id=\"stopduration\">Stop duration</button>-->";
  return buffer;
  });

this["JST"]["templates/loop-control.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"window\" id=\"loop\">\n    <div class=\"controls stop-fields\">\n        <label class=\"checkbox inline\">\n            <input id=\"enableLoop\" type=\"checkbox\" value=\"enable\"> Loop\n        </label>\n\n        <input type=\"text\" class=\"span2\" id=\"slider\" value=\"0\"\n                data-slider-orientation=\"horizontal\"\n                data-slider-selection=\"after\"\n                data-slider-tooltip=\"show\" />\n\n        <input id=\"loop-length\"></input><span>s</span>\n\n        <div class=\"btn-group\">\n            <a class=\"btn previous\" href=\"#\" title=\"Move to previous loop\"><i class=\"icon-chevron-left\"></i></a>\n            <a class=\"btn next\" href=\"#\" title=\"Move to next loop\"><i class=\"icon-chevron-right\"></i></a>\n      </div>\n    </div>\n</div>";
  });

this["JST"]["templates/scale-editor-content.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "        <form class=\"form-horizontal\">\n            <fieldset>                \n                <div class=\"control-group\">\n                    <label class=\"control-label\" for=\"nickanme\"><b>*</b> Name: </label>\n                    <div class=\"controls\">\n                        <input type=\"text\" class=\"input-xlarge scale-name\" placeholder=\"Insert the category name\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scale)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n                    </div>\n                    <label class=\"control-label\" for=\"nickanme\">Description: </label>\n                    <div class=\"controls\">\n                        <input type=\"text\" class=\"input-xlarge scale-description\" placeholder=\"Insert the category description\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.scale)),stack1 == null || stack1 === false ? stack1 : stack1.description)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n                    </div>\n                    <div class=\"controls\">\n                        <a class=\"btn delete-scale\"><i class=\"icon-trash\"></i>Delete</a>\n                    </div>\n\n                </div>\n\n                <div>\n                    <div class=\"header-name\">Name</div>\n                    <div class=\"header-value\">Value</div>\n                </div>\n                <div class=\"control-group list-scale-values\"></div>\n                 <a class=\"btn create-scale-value\"><i class=\"icon-plus-sign\"></i> Add scale value</a>\n\n            </fieldset>\n        </form>";
  return buffer;
  });

this["JST"]["templates/scale-editor-select.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n<option value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isSelected), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">"
    + escapeExpression(((stack1 = (depth0 && depth0.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</option>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return "selected=\"selected\"";
  }

  stack1 = helpers.each.call(depth0, (depth0 && depth0.scales), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["JST"]["templates/scale-editor.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "      <div class=\"modal-header\">\n\n        <h3>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.title); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n            <span class=\"manage\">\n                <select id=\"scale-id\">\n                </select>\n                <a class=\"btn edit-scale\"><icon class=\"icon-edit\"></i></a>\n                <a class=\"btn create-scale\"><icon class=\"icon-plus-sign\"></i></a>\n            </span>\n        </h3>\n\n      </div>\n      <div class=\"modal-body\"></div>\n\n      <div class=\"modal-footer\">\n        <a id=\"cancel-scale\" href=\"#\" class=\"btn\">Cancel</a>\n        <a id=\"save-scale\" href=\"#\" class=\"btn btn-primary\">Save</a>\n      </div>";
  return buffer;
  });

this["JST"]["templates/scale-value-editor.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"scale-value\">\n    <a class=\"btn order-up\"><i class=\"icon-arrow-up\"></i></a>\n    <a class=\"btn order-down\"><i class=\"icon-arrow-down\"></i></a>\n    <input type=\"text\" class=\"input-small scale-value-name\" value=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /> \n    <input type=\"text\" class=\"input-small scale-value-value\" placeholder=\"Insert a decimal number.\" value=\"";
  if (stack1 = helpers.value) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.value); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n    <a class=\"btn delete-scale-value\"><i class=\"icon-remove\"></i></a>\n</div>";
  return buffer;
  });

this["JST"]["templates/timeline-group-empty.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", self=this;

function program1(depth0,data) {
  
  var stack1, options;
  options = {hash:{},data:data};
  return escapeExpression(((stack1 = helpers.secure || (depth0 && depth0.secure)),stack1 ? stack1.call(depth0, (depth0 && depth0.description), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.description), options)));
  }

function program3(depth0,data) {
  
  
  return "No description";
  }

  buffer += "<div class=\"timeline-group\">\n    <div class=\"track-id\">";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\n    <a id=\"track";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"\n       class=\"content-overlay\"\n       title=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.secure || (depth0 && depth0.secure)),stack1 ? stack1.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\"\n       rel=\"popover\"\n       data-content=\"<p>";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.description), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</p>\"\n      >\n        <div class=\"content empty\">\n            ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.secure || (depth0 && depth0.secure)),stack1 ? stack1.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\n        </div>\n    </a>\n</div>\n";
  return buffer;
  });

this["JST"]["templates/timeline-group.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return " mine";
  }

function program3(depth0,data) {
  
  var stack1;
  if (stack1 = helpers.timelineMaxLevel) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.timelineMaxLevel); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  return escapeExpression(stack1);
  }

function program5(depth0,data) {
  
  
  return "0";
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "onclick=\"$(window).trigger('selectTrack', ['";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "'])\" ondblclick=\"$(window).trigger('updateTrack', ['";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "'])\"";
  return buffer;
  }

function program9(depth0,data) {
  
  var stack1, options;
  options = {hash:{},data:data};
  return escapeExpression(((stack1 = helpers.secure || (depth0 && depth0.secure)),stack1 ? stack1.call(depth0, (depth0 && depth0.description), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.description), options)));
  }

function program11(depth0,data) {
  
  
  return "No description";
  }

function program13(depth0,data) {
  
  
  return "\n        <i class=\"private icon-user\" title=\"You own this track\"></i>\n    ";
  }

function program15(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <div class=\"group-edit\">\n            <i onclick=\"$(window).trigger('deleteTrack', ['";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "'])\" class=\"delete icon-trash\" title=\"Delete  track\"></i>\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n            ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </div>\n    ";
  return buffer;
  }
function program16(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<i onclick=\"$(window).trigger('updateTrack', ['";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "'])\" class=\"update  icon-pencil\" title=\"Update  track\"></i>";
  return buffer;
  }

function program18(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "<span class=\"visibility\" \n                  onmouseup=\"";
  options = {hash:{},inverse:self.program(21, program21, data),fn:self.program(19, program19, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\"\n                  onmousedown=\"";
  options = {hash:{},inverse:self.program(25, program25, data),fn:self.program(23, program23, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" \n                  title=\"";
  options = {hash:{},inverse:self.program(29, program29, data),fn:self.program(27, program27, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n                    <i class=\"icon-dark-grey ";
  options = {hash:{},inverse:self.program(34, program34, data),fn:self.program(32, program32, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\"></i> ";
  options = {hash:{},inverse:self.program(39, program39, data),fn:self.program(37, program37, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
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
  
  var buffer = "", stack1;
  buffer += "\n                                      $(window).trigger('updateTrackAccess', ['";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "'])\n                              ";
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
  buffer += "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n    <div class=\"track-id\">";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\n    <a id=\"track";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.id); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"\n       class=\"content-overlay\"\n       ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n       title=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.secure || (depth0 && depth0.secure)),stack1 ? stack1.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\" \n       rel=\"popover\"\n       data-trigger=\"manual\" \n       data-content=\"<p>";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.description), {hash:{},inverse:self.program(11, program11, data),fn:self.program(9, program9, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "</p> <p><b>Owner:</b> ";
  if (stack2 = helpers.created_by_nickname) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.created_by_nickname); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "</p>\"\n       onmouseleave=\"$('div.popover.fade.right.in').remove();\"\n       onmouseenter=\"$(this).popover('show');\">\n    ";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.isMine), {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n        <div class=\"content\">\n            ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.secure || (depth0 && depth0.secure)),stack1 ? stack1.call(depth0, (depth0 && depth0.name), options) : helperMissing.call(depth0, "secure", (depth0 && depth0.name), options)))
    + "\n        </div>\n    ";
  options = {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data};
  if (stack2 = helpers.canBeDeleted) { stack2 = stack2.call(depth0, options); }
  else { stack2 = (depth0 && depth0.canBeDeleted); stack2 = typeof stack2 === functionType ? stack2.call(depth0, options) : stack2; }
  if (!helpers.canBeDeleted) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    </a>\n</div>\n";
  return buffer;
  });

this["JST"]["templates/timeline-item.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return "at-end";
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += ";background-color: "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.category)),stack1 == null || stack1 === false ? stack1 : stack1.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<b>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.label)),stack1 == null || stack1 === false ? stack1 : stack1.abbreviation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</b>";
  return buffer;
  }

  buffer += "<div title=\"";
  if (stack1 = helpers.text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.text); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"timeline-item ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.atEnd), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" style=\"";
  stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = (depth0 && depth0.category)),stack1 == null || stack1 === false ? stack1 : stack1.settings)),stack1 == null || stack1 === false ? stack1 : stack1.color), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" onclick=\"annotationsTool.onClickSelectionById([{id:'";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.id); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "',trackId:'";
  if (stack2 = helpers.track) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.track); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "'}], true, true)\">\n    <span>";
  stack2 = helpers['if'].call(depth0, (depth0 && depth0.label), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " ";
  if (stack2 = helpers.text) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.text); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "</span>\n    <i class=\"delete icon-remove\" title=\"Delete  annotation\" onclick=\"annotationsTool.trigger('deleteAnnotation', ";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.id); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + ", ";
  if (stack2 = helpers.track) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.track); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + ")\"></i>\n    <div class='annotation-id'>";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.id); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "</div>\n    <div class='track-id'>";
  if (stack2 = helpers.track) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = (depth0 && depth0.track); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
  buffer += escapeExpression(stack2)
    + "</div>\n</div>";
  return buffer;
  });

this["JST"]["templates/timeline-modal-add-group.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "disabled=\"disabled\"";
  }

function program3(depth0,data) {
  
  
  return "\n							<span class=\"alert alert-warning\">Public tracks have been disallowed for this video.</span>\n						";
  }

  buffer += "<div class=\"modal\" id=\"modal-add-group\">\n	  <div class=\"modal-header\">\n	    <h3>Add new track</h3>\n	  </div>\n	  <div class=\"modal-body\">\n		<form class=\"form-horizontal\">\n			<fieldset>\n			    <div class=\"alert alert-error\" style=\"display:none\">\n					<span><i class=\"icon-exclamation-sign\"></i></span>\n					<span id=\"content\"></span>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"name\"><b>*</b> Name: </label>\n					<div class=\"controls\">\n						<input type=\"text\" placeholder=\"Insert the new track name\" id=\"name\">\n					</div>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"description\">Description: </label>\n					<div class=\"controls\">\n						<input type=\"text\" placeholder=\"Insert a description for the new track\" id=\"description\">\n					</div>\n				</div>\n\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"public\">Public: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"public\" ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " />\n						";
  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n					</div>\n				</div>\n				<div style=\"float:right\"><b>* required fields</b></div>\n			</fieldset>\n		</form>\n	  </div>\n	  <div class=\"modal-footer\">\n            <a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n	    	<a href=\"#\" id=\"add-group\" class=\"btn btn-primary\">Add</a>\n	  </div>\n</div>";
  return buffer;
  });

this["JST"]["templates/timeline-modal-update-group.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "checked=\"checked\"";
  }

function program3(depth0,data) {
  
  
  return "disabled=\"disabled\"";
  }

function program5(depth0,data) {
  
  
  return "\n							<span class=\"alert alert-warning\">Public tracks have been disallowed for this video.</span>\n						";
  }

  buffer += "<div class=\"modal\" id=\"modal-update-group\">\n	  <div class=\"modal-header\">\n	    <h3>Update track</h3>\n	  </div>\n	  <div class=\"modal-body\">\n		<form class=\"form-horizontal\">\n			<fieldset>\n			    <div class=\"alert alert-error\" style=\"display:none\">\n					<span><i class=\"icon-exclamation-sign\"></i></span>\n					<span id=\"content\"></span>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"name\"><b>*</b> Name: </label>\n					<div class=\"controls\">\n						<input type=\"text\" placeholder=\"Insert the new track name\" id=\"name\" value=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n					</div>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"description\">Description: </label>\n					<div class=\"controls\">\n						<input type=\"text\" placeholder=\"Insert a description for the new track\" id=\"description\" value=\"";
  if (stack1 = helpers.description) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.description); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n					</div>\n				</div>\n\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"public\">Public: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"public\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isPublic), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n						";
  options = {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data};
  if (stack1 = helpers.isPrivateOnly) { stack1 = stack1.call(depth0, options); }
  else { stack1 = (depth0 && depth0.isPrivateOnly); stack1 = typeof stack1 === functionType ? stack1.call(depth0, options) : stack1; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n					</div>\n				</div>\n\n\n				<div style=\"float:right\"><b>* required fields</b></div>\n			</fieldset>\n		</form>\n	  </div>\n	  <div class=\"modal-footer\">\n            <a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n	    	<a href=\"#\" id=\"update-group\" class=\"btn btn-primary\">Update</a>\n	  </div>\n</div>";
  return buffer;
  });

this["JST"]["templates/user-login.tmpl"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"supervisor\">Log as supervisor: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"supervisor\">\n					</div>\n				</div>\n				";
  }

  buffer += "\n	  <div class=\"modal-header\">\n	    <h3>User login</h3>\n	  </div>\n	  <div class=\"modal-body\">\n		<form class=\"form-horizontal\">\n			<fieldset>\n			        <div class=\"alert alert-error\" style=\"display:none\">\n					<span><i class=\"icon-exclamation-sign\"></i></span>\n					<span id=\"content\"></span>\n					\n				</div>\n				\n				<div class=\"alert alert-info\">\n					Create a new nickname for the user you are logged with in current context (LTI tool or other).\n				</div>\n				\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"nickanme\"><b>*</b> Nickname: </label>\n					<div class=\"controls\">\n						<input type=\"text\" class=\"input-xlarge\" placeholder=\"Insert your nickname\" id=\"nickname\">\n					</div>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"email\"><b>*</b> Email: </label>\n					<div class=\"controls\">\n						<input type=\"text\" class=\"input-xlarge\" placeholder=\"Insert your email address\" id=\"email\">\n					</div>\n				</div>\n\n				";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.localStorage), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n				<div class=\"control-group\">\n					<label class=\"control-label\">Remember me: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"remember\" name=\"remember\" value=\"remember\">\n					</div>\n				</div>\n\n\n				<div style=\"float:right\"><b>* required fields</b></div>\n			</fieldset>\n		</form>\n	  </div>\n	  <div class=\"modal-footer\">\n	    <a id=\"save-user\" href=\"#\" class=\"btn btn-primary\">Login</a>\n	  </div>\n";
  return buffer;
  });

return this["JST"];

});