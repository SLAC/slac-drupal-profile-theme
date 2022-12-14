module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  plugins: ['prettier'],
  extends: ['airbnb', 'prettier'],
  settings: {
    'import/resolver': 'webpack',
    'import/core-modules': ['drupal', 'drupalSettings', 'jquery', 'once'],
  },
  rules: {
    'class-methods-use-this': 'off', // Too many false positives
    'react/no-danger': 'off', // Necessary for Storybook
    'react/prop-types': 'off', // React is only being used for Storybook
    'react/jsx-props-no-spreading': 'off',
    'no-param-reassign': [
      // Allow modifying props, esp. for DOM Nodes
      'error',
      {
        props: false,
      },
    ],
  },
};
