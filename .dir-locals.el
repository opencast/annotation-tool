((nil . ((indent-tabs-mode . nil)
         (c-basic-offset . 2)
         (eval . (progn
                   (c-set-offset 'arglist-cont-nonempty 8)
                   (require 'grep)
                   (make-local-variable 'grep-find-ignored-directories)
                   (dolist (dir '("node_modules"
                                  "node"
                                  "frontend/js/libs"
                                  "target"
                                  "frontend/src/main/resources/ui"))
                     (add-to-list 'grep-find-ignored-directories dir))))))
 (js2-mode . ((js2-basic-offset . 4))))
