module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 代码风格规则
    'indent': ['error', 2],
    'linebreak-style': ['error', 'windows'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // 最佳实践
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // 变量声明
    'prefer-const': 'error',
    'no-var': 'error',
    
    // 对象和数组
    'prefer-object-spread': 'error',
    'prefer-destructuring': 'warn',
    
    // 字符串
    'prefer-template': 'error',
    
    // 函数
    'func-style': ['warn', 'expression'],
    'arrow-body-style': ['warn', 'as-needed'],
    
    // 异步
    'prefer-promise-reject-errors': 'error',
    'no-return-await': 'warn',
    
    // 安全相关
    'no-script-url': 'error',
    'no-unsafe-optional-chaining': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-unused-vars': 'off',
      },
    },
  ],
};