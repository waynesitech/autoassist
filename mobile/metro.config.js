const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle potential Node.js package issues
config.resolver.sourceExts.push('cjs');

module.exports = config;
