define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper, options;
  buffer += "\n            <li class=\"list-group-item\">\n                <input type=\"checkbox\" value=\""
    + escapeExpression(((stack1 = (depth0 && depth0.id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.visible), {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "> "
    + escapeExpression(((stack1 = (depth0 && depth0.nickname)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n                <span class=\"search-fields\">\n                    ";
  options={hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}
  if (helper = helpers.toUpperCase) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0.toUpperCase); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers.toUpperCase) { stack1 = blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data}); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n                </span>\n            </li>\n            ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return "checked";
  }

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n                    "
    + escapeExpression(((stack1 = (depth0 && depth0.nickname)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n                    ";
  return buffer;
  }

  buffer += "<div class=\"modal\" id=\"modal-track-selection\">\n	  <div class=\"modal-header\">\n	    <h3>Other public annotations</h3>\n	  </div>\n\n	  <div class=\"modal-body\">\n        Users with public annotations:\n        <div class=\"input-append\">\n          <input class=\"span12\" type=\"text\" id=\"search-track\" placeholder=\"Type here to search...\">\n          <button class=\"btn search-only\" type=\"button\">Clear</button>\n        </div>\n        <ul class=\"list-group\">\n            ";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.users), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </ul>\n\n        <span>\n            <input type=\"checkbox\" value=\"\"> Select / unselect all\n        </span>\n	  </div>\n\n\n	  <div class=\"modal-footer\">\n        <a id=\"cancel-selection\" href=\"#\" class=\"btn\">Cancel</a>\n	    <a id=\"confirm-selection\" href=\"#\" class=\"btn btn-primary\">Ok</a>\n	  </div>\n</div>";
  return buffer;
  })

});