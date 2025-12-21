import 'dotenv/config';

export default {
  expo: {
    name: "The Vibes",
    slug: "the vibes",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "the vibes",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.cah1.thevibes",   // 👈 obligatoire et unique
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
    },
    extra: {
      apiUrl: process.env.API_URL,
      eas: {
        projectId: "a44993df-7ccf-4ce6-8a22-893d715767ca",
      },
    },
  },
};
