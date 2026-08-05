const appJson = require('./app.json');

/** Runtime endpoints are injected at Expo start time. */
module.exports = ({ config }) => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const websocketUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL;

  return {
    ...appJson.expo,
    ...config,
    extra: {
      ...appJson.expo.extra,
      ...config.extra,
      ...(apiBaseUrl !== undefined ? { apiBaseUrl } : {}),
      ...(websocketUrl !== undefined ? { websocketUrl } : {}),
    },
  };
};
