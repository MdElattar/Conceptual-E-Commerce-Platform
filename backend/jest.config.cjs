module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs))'],
  moduleFileExtensions: ['js', 'mjs', 'cjs'],
  setupFiles: ['./jest.setup.cjs'],

};
