import { useAuth } from "@/hooks/useAuth";
import {
  useLocalSearchParams,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AuthCallbackScreen() {
  const rootNavigationState = useRootNavigationState();
  const router = useRouter();
  const { login } = useAuth();
  const hasHandledCallback = useRef(false);
  const { accessToken, refreshToken, error } = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }>();

  useEffect(() => {
    if (!rootNavigationState?.key || hasHandledCallback.current) {
      return;
    }

    hasHandledCallback.current = true;
    let cancelled = false;

    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        if (cancelled) {
          return;
        }

        if (typeof error === "string" && error) {
          router.replace("/(auth)/login");
          return;
        }

        if (
          typeof accessToken !== "string" ||
          !accessToken ||
          typeof refreshToken !== "string" ||
          !refreshToken
        ) {
          router.replace("/(auth)/login");
          return;
        }

        try {
          await login({ accessToken, refreshToken });
          if (!cancelled) {
            router.replace("/(tabs)/posts");
          }
        } catch {
          if (!cancelled) {
            router.replace("/(auth)/login");
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [accessToken, error, login, refreshToken, rootNavigationState?.key, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#31582b" />
      <Text style={styles.text}>Đang xác thực đăng nhập...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    marginTop: 12,
    color: "#31582b",
    fontSize: 14,
  },
});
