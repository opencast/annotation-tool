define(['handlebars'], function(Handlebars) {

return Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"window\" id=\"loop\">\n    <div class=\"controls stop-fields\">\n        <label class=\"checkbox inline\">\n            <input id=\"enableLoop\" type=\"checkbox\" value=\"enable\"> Loop\n        </label>\n\n        <input type=\"text\" class=\"span2\" id=\"slider\" value=\"0\"\n                data-slider-orientation=\"horizontal\"\n                data-slider-selection=\"after\"\n                data-slider-tooltip=\"show\" />\n\n        <input id=\"loop-length\"></input><span>s</span>\n\n        <div class=\"btn-group\">\n            <a class=\"btn previous\" href=\"#\" title=\"Move to previous loop\"><i class=\"icon-chevron-left\"></i></a>\n            <a class=\"btn next\" href=\"#\" title=\"Move to next loop\"><i class=\"icon-chevron-right\"></i></a>\n      </div>\n    </div>\n</div>";
  })

});