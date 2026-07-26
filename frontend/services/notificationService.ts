import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import {
  registerPushTokenAPI,
  unregisterPushTokenAPI,
} from "./apiClient";

const CHANNEL_ID = "farmdata-default";
let lastRegisteredPushToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId
  );
}

function hasNotificationPermission(
  permission: Notifications.NotificationPermissionsStatus,
): boolean {
  if (permission.status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const iosStatus = permission.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "FarmData",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: "#195729",
    sound: "default",
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  await ensureAndroidNotificationChannel();

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalPermission = existingPermission;
  if (!hasNotificationPermission(existingPermission)) {
    finalPermission = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
  }

  if (!hasNotificationPermission(finalPermission)) {
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn("Missing EAS projectId; push token registration skipped.");
    return null;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  return token;
}

export async function syncPushTokenWithBackend(): Promise<void> {
  const token = await registerForPushNotifications();
  if (!token) return;

  await registerPushTokenAPI({
    platform: Platform.OS === "ios" ? "ios" : "android",
    token,
  });
  lastRegisteredPushToken = token;
}

export async function unregisterLastPushToken(): Promise<void> {
  if (!lastRegisteredPushToken) return;

  await unregisterPushTokenAPI(lastRegisteredPushToken).catch(() => {});
  lastRegisteredPushToken = null;
}

export function observeNotificationResponses() {
  const handleNotification = (notification: Notifications.Notification) => {
    const url = notification.request.content.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      router.push(url as any);
    }
  };

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response?.notification) {
      handleNotification(response.notification);
    }
  });

  return Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotification(response.notification);
  });
}
