const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Add monorepo root node_modules so Metro can find hoisted packages
// like @babel/runtime that npm hoisted up from frontend/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Watch monorepo root for changes (needed for shared packages)
config.watchFolders = [monorepoRoot];

module.exports = config;
