module.exports = {
    overrides: [{
        files: ['Gruntfile.js', '.eslintrc.js'],
        env: {
            node: true,
            es2020: true
        }
    }, {
        files: 'js/**/*.js',
        env: {
            browser: true
        }
    }]
};
