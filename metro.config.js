const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The backend is a separate npm project inside this repo. Metro must not crawl it,
// otherwise its node_modules produce duplicate-module and resolution errors.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  new RegExp(`^${path.join(__dirname, 'backend').replace(/[\\/]/g, '[\\\\/]')}[\\\\/].*`),
];

module.exports = config;
