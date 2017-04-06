define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<!-- Carousel nav -->\n<div class=\"controls\">\n	<div class=\"pagination pagination-centered\" style=\"display:none\">\n  	<ul>\n    	<li><a href=\"#\" id=\"carousel-prev\">&lt;</a></li>\n    	<li><a href=\"#\" id=\"carousel-next\">&gt;</a></li>\n  	</ul>\n	</div>\n</div>\n\n\n<div id=\"";
  if (helper = helpers.id) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.id); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" class=\"carousel slide\">\n  <!-- Carousel items -->\n  <div class=\"carousel-inner\">\n\n  </div>\n\n</div>\n\n";
  return buffer;
  })

});