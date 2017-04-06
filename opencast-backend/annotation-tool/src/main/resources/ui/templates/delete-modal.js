define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"modal\" id=\"modal-delete\">\n	  <div class=\"modal-header\">\n	    <h3>Delete</h3>\n	  </div>\n	  <div class=\"modal-body\">\n	  </div>\n	  <div class=\"modal-footer\">\n            <a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n	    <a id=\"confirm-delete\" href=\"#\" class=\"btn btn-primary\">Delete</a>\n	  </div>\n</div>";
  })

});