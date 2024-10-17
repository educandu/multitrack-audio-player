module.exports = {
  extends: ['./.eslint-config.cjs'],
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^@educandu', '^vitest', '^p-queue$'] }]
  },
  overrides: [
    {
      files: ['test-app/**/*.js'],
      rules: {
        'react/prop-types': ['off']
      }
    }
  ]
};
