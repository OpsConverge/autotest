export default {
  preset: 'default',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest-setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/test/unit-jest/**/*.test.js',
    '<rootDir>/src/test/unit-jest/**/*.test.jsx',
    '<rootDir>/src/test/integration-jest/**/*.test.js',
    '<rootDir>/src/test/integration-jest/**/*.test.jsx',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testTimeout: 10000,
  verbose: true,
};
