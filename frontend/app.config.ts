import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const iosBundleIdentifier =
  process.env.EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER || "com.farmdata.capturedata";
const androidPackage =
  process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "com.farmdata.capturedata";
const cameraPermission =
  "Cho phép FarmData truy cập máy ảnh để chụp ảnh cây trồng.";
const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID || process.env.EAS_PROJECT_ID;

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
    "expo-notifications",
    [
      "expo-camera",
      {
        cameraPermission,
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        cameraPermission,
        photosPermission: "Cho phép FarmData chọn ảnh cây trồng từ thư viện.",
      },
    ],
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
    [
      "expo-media-library",
      {
        photosPermission: "Cho phép FarmData truy cập thư viện ảnh.",
        savePhotosPermission: "Cho phép FarmData lưu ảnh vào thư viện.",
        granularPermissions: ["photo"],
      },
    ],
  ],
  extra: {
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
