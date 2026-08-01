const appJson = require('./app.json');

/** Runtime endpoints are injected at Expo start time. */
module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...appJson.expo.extra,
    ...config.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/v1',
    websocketUrl: process.env.EXPO_PUBLIC_WEBSOCKET_URL || null,
  },
});
