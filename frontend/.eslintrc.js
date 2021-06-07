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
        'no-multiple-empty-lines': ['warn', { max: 1 }]
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
