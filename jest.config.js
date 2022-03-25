// @ts-check
/** @type {import('next/jest').default} */
const nextJest = /** @type {*} */ (require('next/jest'));

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('@jest/types').Config.InitialOptions} */
const customJestConfig = {
  moduleNameMapper: {
    // 'csv/dist/esm/(.*)$': 'csv/dist/cjs/$1',
    '^csv/sync': '<rootDir>/node_modules/csv/dist/cjs/sync.cjs',
    // 'csv/dist/esm/(.*)\\.js$': '<rootDir>/node_modules/csv/dist/cjs/$1.cjs',
  },
  // the initial tests are for server files, so use the default node environment
  // https://jestjs.io/docs/configuration#testenvironment-string
  // testEnvironment: 'jest-environment-jsdom',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
