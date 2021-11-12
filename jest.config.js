/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "_build/coverage",
  moduleNameMapper: {
    "^.+\\.(css|png)$": "<rootDir>/src/test/stub.ts"
  }
};
