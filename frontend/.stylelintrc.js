module.exports = {
    plugins: ['@stylistic/stylelint-plugin'],
    defaultSeverity: 'warning',
    customSyntax: 'postcss-less',
    rules: {
        '@stylistic/no-eol-whitespace': true,
        '@stylistic/block-opening-brace-space-before': 'always-multi-line',
        '@stylistic/block-opening-brace-newline-after': 'always-multi-line',
        '@stylistic/block-opening-brace-space-after': 'always-single-line',
        '@stylistic/block-closing-brace-space-before': 'always-single-line',
        '@stylistic/block-closing-brace-newline-before': 'always-multi-line',
        '@stylistic/indentation': 4
    }
};
