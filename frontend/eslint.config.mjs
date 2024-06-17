import globals from "globals";

export default [{
    ignores: ["js/libs", "src", "target"]
}, {
    rules: {
        "no-trailing-spaces": "warn",
        "keyword-spacing": "warn",

        "space-before-function-paren": ["warn", {
            named: "never",
            anonymous: "always",
            asyncArrow: "always"
        }],

        "function-call-argument-newline": ["warn", "consistent"],
        "block-spacing": "warn",
        "object-curly-spacing": ["warn", "always"],
        "key-spacing": "warn",
        "comma-dangle": "warn",
        quotes: "warn",

        "no-multiple-empty-lines": ["warn", {
            max: 1
        }],

        semi: "warn",

        indent: ["warn", 4, {
            ignoredNodes: [
                "Program > ExpressionStatement > CallExpression[callee.name=\"define\"] > FunctionExpression.arguments > .body"
            ],

            VariableDeclarator: 0
        }],

        "one-var": ["warn", "never"],
        "space-infix-ops": "warn",
        "no-multi-spaces": "warn",
        "space-before-blocks": "warn"
    }
}, {
    files: ["*.js"],

    languageOptions: {
        globals: {
            ...globals.node
        }
    },

    rules: {
        quotes: ["warn", "single"]
    }
}, {
    files: ["js/**/*"],

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.amd
        }
    }
}];
