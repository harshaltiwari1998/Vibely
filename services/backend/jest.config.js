module.exports = {
  moduleFileExtensions: ["ts", "js", "json", "node"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@vibely/config$": "<rootDir>/../../../packages/config/src/index.ts",
    "^@vibely/types$": "<rootDir>/../../../packages/types/src/index.ts",
    "^@vibely/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
  },
};
