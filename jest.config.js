module.exports = {
  'moduleNameMapper': {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  'coverageDirectory': './coverage/',
  'collectCoverage': false,
  'clearMocks': true,
  'moduleFileExtensions': [
    'ts',
    'tsx',
    'js',
  ],
  'transform': {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  'testMatch': [
    '**/__tests__/**/*.(j|t)s?(x)',
    '**/?(*.)+(spec|test).(j|t)s?(x)',
  ],
  'testPathIgnorePatterns': [
    '/node_modules/',
    '/build/',
  ],
  'globals': {
    'ts-jest': {
      'babelConfig': true,
    },
  },
  'testURL': 'https://www.somthing.com/test.html',
};
