export default {
  injectGlobals: true,
  testEnvironment: "node",
  transform: {},
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  
  setupFilesAfterEnv: ["./tests/setup.js"],
};