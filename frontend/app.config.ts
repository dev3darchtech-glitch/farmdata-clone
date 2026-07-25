import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const iosBundleIdentifier =
  process.env.EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER || "com.farmdata.capturedata";
const androidPackage =
  process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "com.farmdata.capturedata";

const config: ExpoConfig = {
  name: "FarmData",
  slug: "FarmData",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  scheme: "capturedata",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: iosBundleIdentifier,
  },
  android: {
    package: androidPackage,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/logo.png",
      backgroundImage: "./assets/images/logo.png",
      monochromeImage: "./assets/images/logo.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/logo.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/logo.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    "expo-secure-store",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
