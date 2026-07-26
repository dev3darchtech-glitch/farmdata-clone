import Constants from "expo-constants";
import { router } from "expo-router";
import { Platform } from "react-native";
import type * as Notifications from "expo-notifications";
import { registerPushTokenAPI, unregisterPushTokenAPI } from "./apiClient";

const CHANNEL_ID = "farmdata-default";
const EXPO_GO_EXECUTION_ENVIRONMENT = "storeClient";
let lastRegisteredPushToken: string | null = null;
let notificationsModule: ExpoNotificationsModule | null = null;
let isNotificationHandlerConfigured = false;

type ExpoNotificationsModule = typeof import("expo-notifications");

function isExpoGo(): boolean {
  return Constants.executionEnvironment === EXPO_GO_EXECUTION_ENVIRONMENT;
}

function canUseExpoNotifications(): boolean {
  return Platform.OS !== "web" && !isExpoGo();
}

function getNotificationsModule(): ExpoNotificationsModule | null {
  if (!canUseExpoNotifications()) return null;

  // Lazy-load to avoid expo-notifications' Expo Go warning at module import time.
  notificationsModule ??=
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("expo-notifications") as ExpoNotificationsModule;

  if (!isNotificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    isNotificationHandlerConfigured = true;
  }

  return notificationsModule;
}

function getExpoProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId
  );
}

function hasNotificationPermission(
  notifications: ExpoNotificationsModule,
  permission: Notifications.NotificationPermissionsStatus,
): boolean {
  if (permission.status === notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const iosStatus = permission.ios?.status;
  return (
    iosStatus === notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function ensureAndroidNotificationChannel(
  notifications: ExpoNotificationsModule,
) {
  if (Platform.OS !== "android") return;

  await notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "FarmData",
    importance: notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: "#195729",
    sound: "default",
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const notifications = getNotificationsModule();
  if (!notifications) return null;

  await ensureAndroidNotificationChannel(notifications);

  const existingPermission = await notifications.getPermissionsAsync();
  let finalPermission = existingPermission;
  if (!hasNotificationPermission(notifications, existingPermission)) {
    finalPermission = await notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
  }

  if (!hasNotificationPermission(notifications, finalPermission)) {
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn("Missing EAS projectId; push token registration skipped.");
    return null;
  }

  const token = (
    await notifications.getExpoPushTokenAsync({
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
  const notifications = getNotificationsModule();
  if (!notifications) return { remove: () => {} };

  const handleNotification = (notification: Notifications.Notification) => {
    const url = notification.request.content.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      router.push(url as any);
    }
  };

  notifications
    .getLastNotificationResponseAsync()
    .then((response) => {
      if (response?.notification) {
        handleNotification(response.notification);
      }
    })
    .catch((error) => {
      console.warn(
        error instanceof Error
          ? error.message
          : "Unable to get the last notification response.",
      );
    });

  return notifications.addNotificationResponseReceivedListener((response) => {
    handleNotification(response.notification);
  });
}
