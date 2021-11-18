module.exports = {
  parser: 'babel-eslint',
  extends: '@arcblock/eslint-config-base',
  parserOptions: {
    requireConfigFile: false,
  },
  env: {
    es6: true,
    browser: true,
    node: true,
    mocha: true,
    jest: true,
  },
  globals: {
    logger: true,
  },
  rules: {
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          kebabCase: true,
        },
        ignore: ['setupProxy.js'],
      },
    ],
  },
};
