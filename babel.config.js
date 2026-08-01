/**
 * `babel-preset-expo` only registers the class-static-block transform for web and
 * server targets, yet three.js ships static blocks in its published build. Without
 * it, bundling for iOS/Android fails inside `three/build/three.cjs`.
 *
 * The reanimated/worklets plugin is added by the preset automatically and must stay last,
 * so it is not listed here.
 */
module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [['@babel/plugin-transform-class-static-block', { loose: true }]],
  };
};
