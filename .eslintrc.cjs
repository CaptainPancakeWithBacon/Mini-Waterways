module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
    'jsdoc'
  ],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended'
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'camelcase': 'off',
    'no-console': 'off',
    'linebreak-style': 'off',
    'max-len': ['error', { 'code': 300 }],
    "no-param-reassign": "off",
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'jsdoc/require-jsdoc': [
      'error',
      {
        'publicOnly': true,
        'checkConstructors': false,
        'contexts': [
          'MethodDefinition[key.name!=/get.*/][key.name!=/set.*/]',
        ],
        'require': {
          'ClassDeclaration': false,
          'MethodDefinition': false
        },
      }
    ],
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/no-types': [
      'warn',
      {
        'contexts': ['any']
      }
    ],
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        'accessibility': 'explicit',
      }
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
      }
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        "selector": "objectLiteralProperty",
        "modifiers": ["requiresQuotes"],
        "format": null
      },
      {
        'selector': 'default',
        'format': ['camelCase']
      },
      {
        'selector': 'variable',
        'format': ['camelCase', 'UPPER_CASE']
      },
      {
        'selector': 'classProperty',
        'format': ['camelCase', 'UPPER_CASE']
      },
      {
        'selector': 'parameter',
        'format': ['camelCase'],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'memberLike',
        'modifiers': ['private'],
        'format': ['camelCase']
      },
      {
        'selector': 'typeLike',
        'format': ['PascalCase']
      },
      {
        'selector': 'enumMember',
        'format': ['UPPER_CASE', 'PascalCase']
      }
    ],
  }
};
