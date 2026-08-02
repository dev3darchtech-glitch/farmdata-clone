module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFiles: ["<rootDir>/__tests__/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jose|@firebase|firebase-admin|jwks-rsa)/)"
  ]
};
