import {
  observeNotificationResponses,
  syncPushTokenWithBackend,
} from "@/services/notificationService";
import { useEffect } from "react";

export function usePushNotifications(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    syncPushTokenWithBackend().catch((error) => {
      console.warn(
        error instanceof Error
          ? error.message
          : "Không thể đăng ký thông báo đẩy.",
      );
    });
  }, [isAuthenticated]);

  useEffect(() => {
    const subscription = observeNotificationResponses();
    return () => {
      subscription.remove();
    };
  }, []);
}
