define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, options, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "disabled=\"disabled\"";
  }

function program3(depth0,data) {
  
  
  return "\n							<span class=\"alert alert-warning\">Public tracks have been disallowed for this video.</span>\n						";
  }

  buffer += "<div class=\"modal\" id=\"modal-add-group\">\n	  <div class=\"modal-header\">\n	    <h3>Add new track</h3>\n	  </div>\n	  <div class=\"modal-body\">\n		<form class=\"form-horizontal\">\n			<fieldset>\n			    <div class=\"alert alert-error\" style=\"display:none\">\n					<span><i class=\"icon-exclamation-sign\"></i></span>\n					<span id=\"content\"></span>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"name\"><b>*</b> Name: </label>\n					<div class=\"controls\">\n						<input type=\"text\" placeholder=\"Insert the new track name\" id=\"name\">\n					</div>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"description\">Description: </label>\n					<div class=\"controls\">\n						<input type=\"text\" placeholder=\"Insert a description for the new track\" id=\"description\">\n					</div>\n				</div>\n\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"public\">Public: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"public\" ";
  options={hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " />\n						";
  options={hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data}
  if (helper = helpers.isPrivateOnly) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.isPrivateOnly); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.isPrivateOnly) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n					</div>\n				</div>\n				<div style=\"float:right\"><b>* required fields</b></div>\n			</fieldset>\n		</form>\n	  </div>\n	  <div class=\"modal-footer\">\n            <a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n	    	<a href=\"#\" id=\"add-group\" class=\"btn btn-primary\">Add</a>\n	  </div>\n</div>";
  return buffer;
  })

});