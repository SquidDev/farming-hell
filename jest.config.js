/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  roots: ["src"],
  coverageDirectory: "_build/coverage",
  moduleNameMapper: {
    "^.+\\.(css|png)$": "<rootDir>/src/test/stub.ts"
  },
  transform: {
    ".ts": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
    ".tsx": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  }
};
