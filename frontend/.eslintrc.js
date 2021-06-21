module.exports = {
    rules: {
        'no-trailing-spaces': 'warn',
        'keyword-spacing': 'warn',
        'space-before-function-paren': ['warn', {
            named: 'never',
            anonymous: 'always',
            asyncArrow: 'always'
        }],
        'function-call-argument-newline': ['warn', 'consistent'],
        'block-spacing': 'warn',
        'object-curly-spacing': ['warn', 'always'],
        'key-spacing': 'warn',
        'comma-dangle': 'warn',
        'quotes': 'warn',
        'no-multiple-empty-lines': ['warn', { max: 1 }],
        'semi': 'warn',
        'indent': ['warn', 4, {
            ignoredNodes: [
                'Program > ExpressionStatement > CallExpression[callee.name="define"] > FunctionExpression.arguments > .body'
            ],
            VariableDeclarator: 0
        }],
        'one-var': ['warn', 'never'],
        'space-infix-ops': 'warn',
        'no-multi-spaces': 'warn'
    },
    overrides: [{
        files: ['Gruntfile.js', '.eslintrc.js'],
        env: {
            node: true,
            es2020: true
        },
        rules: {
            'quotes': ['warn', 'single']
        }
    }, {
        files: 'js/**/*.js',
        env: {
            browser: true,
            amd: true
        }
    }]
};
