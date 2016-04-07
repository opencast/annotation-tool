/*
 * jQuery appear plugin
 *
 * Copyright (c) 2012 Andrey Sidorov
 * licensed under MIT license.
 *
 * https://github.com/morr/jquery.appear/
 *
 * Version: 0.3.3
 */
(function ($) {
    "use strict";

    var selectors = [],
        check_binded = false,
        check_lock = false,
        defaults = {
            interval      : 250,
            force_process : false,
            context       : window
        },
        $context,
        $prior_appeared;


    function process() {
        var index = 0,
            $appeared,
            $disappeared;

        check_lock = false;
        for (index = 0; index < selectors.length; index++) {
            $appeared = $(selectors[index]).filter(function () {
                            return $(this).is(":appeared");
                        });

            $appeared.trigger("appear", [$appeared]);

            if ($prior_appeared) {
                $disappeared = $prior_appeared.not($appeared);
                $disappeared.trigger("disappear", [$disappeared]);
            }
            $prior_appeared = $appeared;
        }
    }

    // "appeared" custom filter
    $.expr[":"].appeared = function (element) {
        var $element = $(element),
            offset = $element.offset(),
            left = offset.left - $context.offset().left,
            top = offset.top - $context.offset().top;

        if (!$element.is(":visible")) {
            return false;
        }

        if ((top + $element.height() >= 0) &&
            (top - ($element.data("appear-top-offset") || 0) <= $context.height()) &&
            (left + $element.width() >= 0) &&
            (left - ($element.data("appear-left-offset") || 0) <= $context.width())) {
            return true;
        } else {
            return false;
        }
    };

    $.fn.extend({
        // watching for element's appearance in browser viewport
        appear: function (options) {
            var opts = $.extend({}, defaults, options || {}),
                selector = this.selector || this,
                on_check;

            $context = $(opts.context);

            if (!check_binded) {
                on_check = function () {
                    if (check_lock) {
                        return;
                    }
                    check_lock = true;

                    setTimeout(process, opts.interval);
                };

                $context.scroll(on_check).resize(on_check);
                check_binded = true;
            }

            if (opts.force_process) {
                setTimeout(process, opts.interval);
            }
            selectors.push(selector);
            return $(selector);
        }
    });

    $.extend({
        // force elements's appearance check
        force_appear: function () {
            if (check_binded) {
                process();
                return true;
            }
            return false;
        }
    });
})(jQuery);
