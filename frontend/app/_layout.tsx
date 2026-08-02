import { GlobalOfflineNotice } from "@/components/screens/GlobalOfflineNotice";
import {
  IOS_KEYBOARD_ACCESSORY_ID,
  KeyboardAccessory,
} from "@/components/shared/KeyboardAccessory";
import { TYPOGRAPHY } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync().catch(() => {});

const defaultTextStyle = { fontFamily: TYPOGRAPHY.fontFamily };
const AppText = Text as typeof Text & {
  defaultProps?: { style?: unknown };
};
const AppTextInput = TextInput as typeof TextInput & {
  defaultProps?: { inputAccessoryViewID?: string; style?: unknown };
};

AppText.defaultProps = AppText.defaultProps || {};
AppText.defaultProps.style = [defaultTextStyle, AppText.defaultProps.style];
AppTextInput.defaultProps = AppTextInput.defaultProps || {};
AppTextInput.defaultProps.style = [
  defaultTextStyle,
  AppTextInput.defaultProps.style,
];
AppTextInput.defaultProps.inputAccessoryViewID =
  Platform.OS === "ios"
    ? (AppTextInput.defaultProps.inputAccessoryViewID ??
      IOS_KEYBOARD_ACCESSORY_ID)
    : AppTextInput.defaultProps.inputAccessoryViewID;

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inAuthCallback = segments[0] === "auth-callback";
    if (!isAuthenticated && !inAuthGroup && !inAuthCallback) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, router, segments]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth-callback" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <GlobalOfflineNotice />
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    "Be Vietnam": require("../assets/fonts/BeVietnam-Regular.ttf"),
    "Be Vietnam Medium": require("../assets/fonts/BeVietnam-Medium.ttf"),
    "Be Vietnam SemiBold": require("../assets/fonts/BeVietnam-SemiBold.ttf"),
    "Be Vietnam Bold": require("../assets/fonts/BeVietnam-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <SafeAreaView
          edges={["top", "left", "right"]}
          style={[
            styles.appShell,
            { width, minWidth: width, minHeight: height },
          ]}
        >
          <TouchableWithoutFeedback
            accessible={false}
            onPress={Keyboard.dismiss}
          >
            <AuthProvider>
              <>
                <RootLayoutNav />
                <KeyboardAccessory />
              </>
            </AuthProvider>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: "#ffffff",
  },
});
