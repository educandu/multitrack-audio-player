module.exports = {
  extends: ['./.eslint-config.cjs'],
  overrides: [
    {
      files: ['test-app/**/*.js'],
      rules: {
        'react/prop-types': ['off']
      }
    }
  ]
};
