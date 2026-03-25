// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force Metro to resolve .js (CJS) before .mjs (ESM) to avoid import.meta issues on web
// Zustand v4 ESM builds use import.meta.env which breaks Metro's web bundling
config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
  unstable_enablePackageExports: false,
};

module.exports = config;
