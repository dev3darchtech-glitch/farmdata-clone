describe("notificationService", () => {
  const setup = async ({
    executionEnvironment,
    platform,
  }: {
    executionEnvironment: "storeClient" | "standalone";
    platform: "android" | "ios";
  }) => {
    jest.resetModules();

    const apiClient = {
      registerPushTokenAPI: jest.fn(async () => undefined),
      unregisterPushTokenAPI: jest.fn(async () => undefined),
    };
    const subscription = { remove: jest.fn() };
    const notifications = {
      AndroidImportance: { DEFAULT: "default" },
      IosAuthorizationStatus: {
        AUTHORIZED: "authorized",
        EPHEMERAL: "ephemeral",
        PROVISIONAL: "provisional",
      },
      PermissionStatus: { GRANTED: "granted" },
      addNotificationResponseReceivedListener: jest.fn(() => subscription),
      getExpoPushTokenAsync: jest.fn(async () => ({
        data: "ExponentPushToken[test-token]",
      })),
      getLastNotificationResponseAsync: jest.fn(async () => null),
      getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
      requestPermissionsAsync: jest.fn(),
      setNotificationChannelAsync: jest.fn(async () => undefined),
      setNotificationHandler: jest.fn(),
    };
    const notificationsFactory = jest.fn(() => notifications);

    jest.doMock("@/services/apiClient", () => apiClient);
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: {
        easConfig: { projectId: "test-project-id" },
        executionEnvironment,
        expoConfig: { extra: { eas: { projectId: "test-project-id" } } },
      },
    }));
    jest.doMock("expo-notifications", notificationsFactory);
    jest.doMock("expo-router", () => ({
      router: { push: jest.fn() },
    }));
    jest.doMock("react-native", () => ({
      Platform: { OS: platform },
    }));

    // Keep this synchronous because Jest in this project does not support dynamic import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const service = require("@/services/notificationService");
    return { apiClient, notifications, notificationsFactory, service };
  };

  it("does not import expo-notifications in Expo Go", async () => {
    const { notificationsFactory, service } = await setup({
      executionEnvironment: "storeClient",
      platform: "android",
    });

    await expect(service.registerForPushNotifications()).resolves.toBeNull();
    service.observeNotificationResponses().remove();

    expect(notificationsFactory).not.toHaveBeenCalled();
  });

  it("registers and syncs an Expo push token outside Expo Go", async () => {
    const { apiClient, notifications, service } = await setup({
      executionEnvironment: "standalone",
      platform: "android",
    });

    await service.syncPushTokenWithBackend();

    expect(notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      "farmdata-default",
      expect.objectContaining({ name: "FarmData" }),
    );
    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "test-project-id",
    });
    expect(apiClient.registerPushTokenAPI).toHaveBeenCalledWith({
      platform: "android",
      token: "ExponentPushToken[test-token]",
    });
  });
});
