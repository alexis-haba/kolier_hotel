import dotenv from 'dotenv';

const envPath = process.env.APP_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: envPath });

export default {
  expo: {
    name: "Andrick",
    slug: "Andrick",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "Andrick",
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
      package: "com.cah123.thevibes",   // 👈 obligatoire et unique
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
    },
    extra: {
      apiUrl: process.env.API_URL,
      eas: {
        "projectId": "750f4bad-cbf0-44a6-84bc-3fbdeab04312"      },
    },
  },
};
  
