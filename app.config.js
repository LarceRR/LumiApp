const appJson = require('./app.json');

/** Runtime endpoints are injected at Expo start time. */
module.exports = ({ config }) => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/v1';
  const websocketUrl =
    process.env.EXPO_PUBLIC_WEBSOCKET_URL ||
    apiBaseUrl.replace(/^http/, 'ws').replace(/\/v1\/?$/, '/realtime');

  return {
    ...appJson.expo,
    ...config,
    extra: {
      ...appJson.expo.extra,
      ...config.extra,
      apiBaseUrl,
      websocketUrl,
    },
  };
};
