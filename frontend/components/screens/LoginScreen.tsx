import googleLogo from "@/assets/images/google-logo.png";
import authBackground from "@/assets/images/login-background.png";
import loginEye from "@/assets/images/login-eye.png";
import loginLock from "@/assets/images/login-lock.png";
import loginUser from "@/assets/images/login-user.png";
import { COLORS, LAYOUT } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { loginFormSchema, type LoginFormValues } from "@/schemas/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CircleAlert } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { AppLogo } from "../shared/AppLogo";
import { FieldLabel } from "../shared/FieldLabel";
import { InputText } from "../shared/InputText";
import { PrimaryButton } from "../shared/PrimaryButton";

export function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ oauthSuccess?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginFormSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
  const validationErrorMessage =
    errors.email?.message || errors.password?.message;
  const globalErrorMessage = validationErrorMessage || localError || error;
  const credentialInvalid = Boolean(
    !validationErrorMessage && !isGoogleSubmitting && (localError || error),
  );
  const emailInvalid = Boolean(errors.email) || credentialInvalid;
  const passwordInvalid = Boolean(errors.password) || credentialInvalid;
  const invalidInputProps = (invalid: boolean) =>
    invalid ? ({ "in-valid": true, "aria-invalid": true } as const) : {};

  useEffect(() => {
    if (params.oauthSuccess === "1") {
      setLoginSucceeded(true);
    }
  }, [params.oauthSuccess]);

  useEffect(() => {
    if (!loginSucceeded) {
      return;
    }

    const timeout = setTimeout(() => {
      router.replace("/(tabs)/posts");
    }, 1200);

    return () => clearTimeout(timeout);
  }, [loginSucceeded]);

  const submit = handleSubmit(
    async (values) => {
      Keyboard.dismiss();
      setLocalError(null);
      try {
        await login(values.email.trim(), values.password);
        setLoginSucceeded(true);
      } catch (err: any) {
        setLocalError(
          err?.message || "Tên đăng nhập hoặc mật khẩu không đúng.",
        );
      }
    },
    () => {
      Keyboard.dismiss();
      setLocalError(null);
    },
  );

  const handleGoogleLogin = async () => {
    Keyboard.dismiss();
    setLocalError(null);

    try {
      setIsGoogleSubmitting(true);
      const redirectUri =
        Platform.OS === "web"
          ? Linking.createURL("auth-callback")
          : "capturedata://auth-callback";
      const authUrl = `${
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"
      }/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );
      if (result.type !== "success" || !result.url) {
        return;
      }

      const parsed = Linking.parse(result.url);
      const accessToken = parsed.queryParams?.accessToken;
      const refreshToken = parsed.queryParams?.refreshToken;

      if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
        throw new Error("Không nhận được token đăng nhập từ máy chủ.");
      }

      await login({ accessToken, refreshToken });
      setLoginSucceeded(true);
    } catch (err: any) {
      setLocalError(err?.message || "Đăng nhập Google không thành công.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (loginSucceeded) {
    return (
      <View
        style={[
          loginScreenStyles.loginSuccessScreen,
          { width, minWidth: width, minHeight: height },
        ]}
      >
        <Image
          source={authBackground}
          style={loginScreenStyles.loginSuccessBackground}
          resizeMode="stretch"
        />
        <View style={loginScreenStyles.successSplash}>
          <View style={loginScreenStyles.successIconMargin}>
            <View style={loginScreenStyles.successRing}>
              <Text style={loginScreenStyles.successCheck}>✓</Text>
            </View>
          </View>
          <View style={loginScreenStyles.successTextBlock}>
            <Text style={loginScreenStyles.successTitle}>
              Đăng nhập thành công!
            </Text>
            <Text style={loginScreenStyles.successText}>
              Chào mừng bạn trở lại. Hệ thống đang{"\n"}chuyển hướng tới bảng
              điều khiển...
            </Text>
          </View>
          <View style={loginScreenStyles.successProgressMargin}>
            <View style={loginScreenStyles.successProgressTrack}>
              <View style={loginScreenStyles.successProgressFill} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View
        style={[
          loginScreenStyles.loginScreen,
          { width, minWidth: width, minHeight: height },
        ]}
      >
        <Image
          source={authBackground}
          style={[
            loginScreenStyles.loginBackground,
            { width, height: Math.max(height, (width * 725) / 390) },
          ]}
          resizeMode="cover"
        />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", default: undefined })}
          style={loginScreenStyles.flex}
        >
          <ScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={loginScreenStyles.loginContent}
          >
            <View style={loginScreenStyles.loginBrand}>
              <AppLogo />
              <Text style={loginScreenStyles.loginTitle}>FARMDATA</Text>
              <Text style={loginScreenStyles.loginSubtitle}>
                Quản lý dữ liệu nông nghiệp
              </Text>
            </View>

            <View style={loginScreenStyles.loginForm}>
              <View style={loginScreenStyles.fieldStack}>
                <FieldLabel>Tên đăng nhập</FieldLabel>
                <View
                  style={[
                    loginScreenStyles.loginInputShell,
                    emailInvalid && loginScreenStyles.loginInputShellInvalid,
                  ]}
                >
                  <Image
                    source={loginUser}
                    style={loginScreenStyles.loginLeadingImage}
                    resizeMode="contain"
                  />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <InputText
                        {...invalidInputProps(emailInvalid)}
                        containerStyle={loginScreenStyles.loginInputField}
                        testID="input-login-email"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={(nextValue) => {
                          setLocalError(null);
                          onChange(nextValue);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Nhập tên đăng nhập"
                        placeholderTextColor={COLORS.muted}
                        style={loginScreenStyles.loginTextInput}
                        variant="plain"
                      />
                    )}
                  />
                </View>
              </View>
              <View style={loginScreenStyles.fieldStack}>
                <FieldLabel>Mật khẩu</FieldLabel>
                <View
                  style={[
                    loginScreenStyles.loginInputShell,
                    passwordInvalid && loginScreenStyles.loginInputShellInvalid,
                  ]}
                >
                  <Image
                    source={loginLock}
                    style={loginScreenStyles.loginLeadingImage}
                    resizeMode="contain"
                  />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <InputText
                        {...invalidInputProps(passwordInvalid)}
                        containerStyle={loginScreenStyles.loginInputField}
                        testID="input-login-password"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={(nextValue) => {
                          setLocalError(null);
                          onChange(nextValue);
                        }}
                        secureTextEntry={!showPassword}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor={COLORS.muted}
                        style={loginScreenStyles.loginTextInput}
                        variant="plain"
                      />
                    )}
                  />
                  <Pressable
                    testID="btn-toggle-password"
                    accessibilityRole="button"
                    style={loginScreenStyles.loginTrailingIcon}
                    onPress={() => setShowPassword((value) => !value)}
                  >
                    <Image
                      source={loginEye}
                      style={loginScreenStyles.loginEyeImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
                {globalErrorMessage ? (
                  <View style={loginScreenStyles.loginErrorRow}>
                    <CircleAlert
                      size={15}
                      color={COLORS.danger}
                      strokeWidth={2}
                      style={loginScreenStyles.loginErrorIcon}
                    />
                    <Text style={loginScreenStyles.loginErrorText}>
                      {globalErrorMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={loginScreenStyles.loginActions}>
                <PrimaryButton
                  label={isLoading ? "Đang đăng nhập" : "Đăng nhập"}
                  onPress={submit}
                  loading={isLoading}
                  testID="btn-submit-login"
                />
                <Pressable
                  testID="btn-google-login"
                  style={[
                    loginScreenStyles.googleButton,
                    (isLoading || isGoogleSubmitting) &&
                      loginScreenStyles.googleButtonDisabled,
                  ]}
                  disabled={isLoading || isGoogleSubmitting}
                  onPress={() => {
                    void handleGoogleLogin();
                  }}
                >
                  <Image
                    source={googleLogo}
                    style={loginScreenStyles.googleImage}
                    resizeMode="contain"
                  />
                  <Text style={loginScreenStyles.googleText}>
                    {isGoogleSubmitting
                      ? "Đang đăng nhập với Google"
                      : "Đăng nhập bằng Google"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const loginScreenStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loginScreen: {
    flex: 1,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  loginBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    aspectRatio: 390 / 725,
  },
  loginContent: {
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: 70,
    paddingBottom: 28,
  },
  loginBrand: {
    width: "100%",
    alignItems: "center",
    gap: 9,
  },
  loginTitle: {
    color: COLORS.green,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: 0,
  },
  loginSubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    opacity: 0.8,
  },
  loginForm: {
    marginTop: 42,
    gap: 18,
  },
  loginActions: {
    gap: 18,
  },
  fieldStack: {
    gap: 10,
  },
  loginInputShell: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  loginInputShellInvalid: {
    borderColor: COLORS.danger,
  },
  loginLeadingImage: {
    width: 18,
    height: 20,
    marginLeft: 18,
    marginRight: 12,
  },
  loginInputField: {
    flex: 1,
    minWidth: 0,
  },
  loginTextInput: {
    flex: 1,
    height: 48,
    color: COLORS.body,
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 12,
  },
  loginTrailingIcon: {
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loginEyeImage: {
    width: 20,
    height: 20,
  },
  loginErrorRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loginErrorIcon: {
    width: 15,
    height: 15,
  },
  loginErrorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  googleButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleImage: {
    width: 24,
    height: 26,
  },
  googleText: {
    color: "#2b2b2b",
    fontSize: 16,
    fontWeight: "500",
  },
  loginSuccessScreen: {
    flex: 1,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  loginSuccessBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    aspectRatio: 390 / 725,
  },
  successSplash: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -56 }],
  },
  successIconMargin: {
    paddingBottom: LAYOUT.screenGap,
  },
  successRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  successCheck: {
    color: COLORS.surface,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "700",
    textAlign: "center",
  },
  successTextBlock: {
    width: "100%",
    maxWidth: 342,
    alignItems: "center",
    gap: 8,
  },
  successTitle: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
  },
  successText: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  successProgressMargin: {
    width: 256,
    paddingTop: LAYOUT.screenGap,
  },
  successProgressTrack: {
    width: 256,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#dfdfdf",
    overflow: "hidden",
  },
  successProgressFill: {
    width: 163,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#386941",
  },
});
