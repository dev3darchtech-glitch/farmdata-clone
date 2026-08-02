import farmLogo from "@/assets/images/logo.png";
import { COLORS, LAYOUT } from "@/constants/theme";
import { User } from "@/types";
import { ManagementVariant } from "@/types/ui";
import {
  normalizeRole,
  tabDirectionForTarget,
  tabHrefWithDirection,
  tabItemsForRole,
  type TabRouteId,
} from "@/utils/captureDisplay";
import { router, useGlobalSearchParams, usePathname } from "expo-router";
import {
  Camera,
  ChevronDown,
  FileText,
  FolderOpen,
  LayoutDashboardIcon,
  LogOut,
  UserIcon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ManagementDrawer({
  visible,
  onClose,
  variant,
  setVariant,
  user,
  logout,
  onAdminCreatePost,
}: {
  visible: boolean;
  onClose: () => void;
  variant?: ManagementVariant;
  setVariant?: (variant: ManagementVariant) => void;
  user: User | null;
  logout: () => Promise<void>;
  onAdminCreatePost?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  const role = normalizeRole(user?.role as string);
  const pathname = usePathname();
  const { mine } = useGlobalSearchParams<{ mine?: string }>();
  const activeRoute = pathname.split("?")[0];
  const postsActive = activeRoute.endsWith("/posts");
  const ownPostsActive = postsActive && mine === "true";
  const managementActive = activeRoute.endsWith("/management");
  const captureActive = activeRoute.endsWith("/capture");
  const profileActive = activeRoute.endsWith("/profile");
  const drawerTabItems = tabItemsForRole(role);
  const currentTabId: TabRouteId = postsActive
    ? "posts"
    : managementActive
      ? "management"
      : captureActive
        ? "capture"
        : profileActive
          ? "profile"
          : "posts";

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setRendered(false);
        }
      });
    }
  }, [anim, rendered, visible]);

  const handleClose = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRendered(false);
        onClose();
      }
    });
  }, [anim, onClose]);

  const navigate = (route: string, target: TabRouteId) => {
    handleClose();
    const direction = tabDirectionForTarget(
      drawerTabItems,
      currentTabId,
      target,
    );
    router.navigate(tabHrefWithDirection(route, direction) as any);
  };

  const set = (value: ManagementVariant) => {
    if (setVariant) {
      setVariant(value);
    }
    handleClose();
    const direction = tabDirectionForTarget(
      drawerTabItems,
      currentTabId,
      "management",
    );
    router.navigate({
      pathname: "/(tabs)/management",
      params: { tab: value, tabDirection: direction },
    } as any);
  };

  const createPostFromDrawer = () => {
    handleClose();
    const direction = tabDirectionForTarget(
      drawerTabItems,
      currentTabId,
      "capture",
    );
    router.navigate(tabHrefWithDirection("/(tabs)/capture", direction) as any);
  };

  const navigateToOwnPosts = () => {
    handleClose();
    const direction = tabDirectionForTarget(
      drawerTabItems,
      currentTabId,
      "posts",
    );
    router.navigate({
      pathname: "/(tabs)/posts",
      params: { mine: "true", tabDirection: direction },
    } as any);
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-292, 0],
  });

  const scrimOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={drawerStyles.drawerLayer}>
        <AnimatedPressable
          style={[drawerStyles.drawerScrim, { opacity: scrimOpacity }]}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            drawerStyles.drawer,
            {
              paddingTop: Math.max(insets.top, LAYOUT.screenTop),
              paddingBottom: Math.max(insets.bottom, LAYOUT.screenTop),
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={drawerStyles.drawerBrand}>
            <Image
              source={farmLogo}
              style={drawerStyles.drawerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={drawerStyles.drawerTitle}>FARMDATA</Text>
              <Text style={drawerStyles.drawerRole}>
                {role === "admin" ? "Admin" : "Farmer"}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              drawerStyles.drawerItem,
              postsActive && !ownPostsActive && drawerStyles.drawerItemActive,
            ]}
            onPress={() => navigate("/(tabs)/posts", "posts")}
          >
            <FileText
              size={20}
              color={
                postsActive && !ownPostsActive ? COLORS.green : COLORS.body
              }
            />
            <Text
              style={[
                drawerStyles.drawerText,
                postsActive && !ownPostsActive && drawerStyles.drawerTextActive,
              ]}
            >
              Bài đăng
            </Text>
          </Pressable>

          {role === "admin" ? (
            <Pressable
              style={[
                drawerStyles.drawerItem,
                ownPostsActive && drawerStyles.drawerItemActive,
              ]}
              onPress={navigateToOwnPosts}
            >
              <FileText
                size={20}
                color={ownPostsActive ? COLORS.green : COLORS.body}
              />
              <Text
                style={[
                  drawerStyles.drawerText,
                  ownPostsActive && drawerStyles.drawerTextActive,
                ]}
              >
                Bài đăng của bạn
              </Text>
            </Pressable>
          ) : null}

          {role === "admin" ? (
            <>
              <View
                style={[
                  drawerStyles.drawerItem,
                  managementActive && drawerStyles.drawerItemActive,
                ]}
              >
                <LayoutDashboardIcon
                  size={20}
                  color={managementActive ? COLORS.green : COLORS.body}
                />
                <Text
                  style={[
                    drawerStyles.drawerText,
                    managementActive && drawerStyles.drawerTextActive,
                  ]}
                >
                  Quản lý
                </Text>
                <ChevronDown
                  size={16}
                  color={managementActive ? COLORS.green : COLORS.body}
                />
              </View>
              {[
                ["plots", "Mã số luống"],
                ["farms", "Farm"],
                ["crops", "Loại cây"],
                ["diseases", "Bệnh cây"],
                ["accounts", "Tài khoản"],
              ].map(([id, label]) => {
                const subItemActive = managementActive && variant === id;
                return (
                  <Pressable
                    key={id}
                    testID={`admin-${id}`}
                    style={[
                      drawerStyles.drawerSubItem,
                      subItemActive && drawerStyles.drawerSubItemActive,
                    ]}
                    onPress={() => set(id as ManagementVariant)}
                  >
                    <Text
                      style={[
                        drawerStyles.drawerSubText,
                        subItemActive && drawerStyles.drawerTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          ) : (
            <Pressable
              style={[
                drawerStyles.drawerItem,
                captureActive && drawerStyles.drawerItemActive,
              ]}
              onPress={() => navigate("/(tabs)/capture", "capture")}
            >
              <Camera
                size={20}
                color={captureActive ? COLORS.green : COLORS.body}
              />
              <Text
                style={[
                  drawerStyles.drawerText,
                  captureActive && drawerStyles.drawerTextActive,
                ]}
              >
                Chụp ảnh
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[
              drawerStyles.drawerItem,
              profileActive && drawerStyles.drawerItemActive,
            ]}
            onPress={() => navigate("/(tabs)/profile", "profile")}
          >
            <UserIcon
              size={20}
              color={profileActive ? COLORS.green : COLORS.body}
            />
            <Text
              style={[
                drawerStyles.drawerText,
                profileActive && drawerStyles.drawerTextActive,
              ]}
            >
              Cá nhân
            </Text>
          </Pressable>

          {role === "admin" ? (
            <>
              <Pressable
                style={[
                  drawerStyles.drawerItem,
                  captureActive && drawerStyles.drawerItemActive,
                ]}
                onPress={createPostFromDrawer}
              >
                <Camera
                  size={20}
                  color={captureActive ? COLORS.green : COLORS.body}
                />
                <Text
                  style={[
                    drawerStyles.drawerText,
                    captureActive && drawerStyles.drawerTextActive,
                  ]}
                >
                  Đăng bài
                </Text>
              </Pressable>

              <Pressable
                style={drawerStyles.drawerItem}
                onPress={() => {
                  handleClose();
                  Linking.openURL("https://drive.google.com/drive/my-drive");
                }}
              >
                <FolderOpen size={20} color={COLORS.body} />
                <Text style={drawerStyles.drawerText}>Mở kho lưu trữ</Text>
              </Pressable>
            </>
          ) : null}

          <View style={drawerStyles.drawerFooter}>
            <Pressable style={drawerStyles.logoutRow} onPress={logout}>
              <LogOut size={18} color={COLORS.danger} />
              <Text style={drawerStyles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  drawerLayer: {
    flex: 1,
    flexDirection: "row",
  },
  drawerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawer: {
    width: 288,
    backgroundColor: "#fff",
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    paddingBottom: LAYOUT.screenTop,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    zIndex: 1,
  },
  drawerBrand: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: LAYOUT.sectionGap,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  drawerLogo: {
    width: 36,
    height: 38,
  },
  drawerTitle: {
    color: "#166534",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
  },
  drawerRole: {
    color: "#9ca3af",
    fontSize: 11,
    lineHeight: 14,
  },
  drawerItem: {
    minHeight: 38,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    gap: 10,
  },
  drawerItemActive: {
    backgroundColor: COLORS.greenSoft,
  },
  drawerText: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  drawerTextActive: {
    color: COLORS.green,
  },
  drawerSubItem: {
    minHeight: 32,
    borderRadius: 8,
    justifyContent: "center",
    paddingLeft: 38,
  },
  drawerSubItemActive: {
    backgroundColor: "rgba(240,253,244,0.7)",
  },
  drawerSubText: {
    color: COLORS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  drawerFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: LAYOUT.sectionGap,
    gap: LAYOUT.screenGap,
  },
  drawerPublishRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drawerPublishText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
  },
});
