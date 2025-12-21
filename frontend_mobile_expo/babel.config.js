module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './',
          },
        },
      ],
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: process.env.APP_ENV === "production" ? ".env.production" : ".env.local",
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
