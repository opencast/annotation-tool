define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"supervisor\">Log as supervisor: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"supervisor\">\n					</div>\n				</div>\n				";
  }

  buffer += "\n	  <div class=\"modal-header\">\n	    <h3>User login</h3>\n	  </div>\n	  <div class=\"modal-body\">\n		<form class=\"form-horizontal\">\n			<fieldset>\n			        <div class=\"alert alert-error\" style=\"display:none\">\n					<span><i class=\"icon-exclamation-sign\"></i></span>\n					<span id=\"content\"></span>\n					\n				</div>\n				\n				<div class=\"alert alert-info\">\n					Create a new nickname for the user you are logged with in current context (LTI tool or other).\n				</div>\n				\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"nickname\"><b>*</b> Nickname: </label>\n					<div class=\"controls\">\n						<input type=\"text\" class=\"input-xlarge\" placeholder=\"Insert your nickname\" id=\"nickname\">\n					</div>\n				</div>\n				<div class=\"control-group\">\n					<label class=\"control-label\" for=\"email\">Email: </label>\n					<div class=\"controls\">\n						<input type=\"text\" class=\"input-xlarge\" placeholder=\"Insert your email address\" id=\"email\">\n					</div>\n				</div>\n\n				";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.localStorage), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n				<div class=\"control-group\">\n					<label class=\"control-label\">Remember me: </label>\n					<div class=\"controls\">\n						<input type=\"checkbox\" id=\"remember\" name=\"remember\" value=\"remember\">\n					</div>\n				</div>\n\n\n				<div style=\"float:right\"><b>* required fields</b></div>\n			</fieldset>\n		</form>\n	  </div>\n	  <div class=\"modal-footer\">\n	    <a id=\"save-user\" href=\"#\" class=\"btn btn-primary\">Login</a>\n	  </div>\n";
  return buffer;
  })

});