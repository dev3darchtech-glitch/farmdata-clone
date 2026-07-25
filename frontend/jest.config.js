const path = require("path");

module.exports = {
  preset: "jest-expo",
  testTimeout: 15000,
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^react$": path.dirname(require.resolve("react/package.json")),
    "^lucide-react-native$": require.resolve("lucide-react-native"),
    "^@babel/runtime/(.*)$": path.join(
      path.dirname(require.resolve("@babel/runtime/package.json")),
      "$1",
    ),
  },
};
