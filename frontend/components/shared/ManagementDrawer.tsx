import farmLogo from "@/assets/images/logo-farmdata.png";
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
import { router, usePathname } from "expo-router";
import {
  Camera,
  ChevronDown,
  FileText,
  LayoutDashboardIcon,
  LogOut,
  PlusCircle,
  UserIcon,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  const drawerTranslateX = useRef(new Animated.Value(-292)).current;
  const role = normalizeRole(user?.role as string);
  const pathname = usePathname();
  const activeRoute = pathname.split("?")[0];
  const postsActive = activeRoute.endsWith("/posts");
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
    if (!visible) return;

    drawerTranslateX.setValue(-292);
    Animated.timing(drawerTranslateX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerTranslateX, visible]);

  const navigate = (route: string, target: TabRouteId) => {
    onClose();
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
    onClose();
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
    onClose();
    if (onAdminCreatePost) {
      onAdminCreatePost();
      return;
    }

    const direction = tabDirectionForTarget(
      drawerTabItems,
      currentTabId,
      "posts",
    );
    router.navigate({
      pathname: "/(tabs)/posts",
      params: { compose: "1", tabDirection: direction },
    } as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={drawerStyles.drawerLayer}>
        <Animated.View
          style={[
            drawerStyles.drawer,
            { transform: [{ translateX: drawerTranslateX }] },
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
              postsActive && drawerStyles.drawerItemActive,
            ]}
            onPress={() => navigate("/(tabs)/posts", "posts")}
          >
            <FileText
              size={20}
              color={postsActive ? COLORS.green : COLORS.body}
            />
            <Text
              style={[
                drawerStyles.drawerText,
                postsActive && drawerStyles.drawerTextActive,
              ]}
            >
              Bài đăng
            </Text>
          </Pressable>

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

          <View style={drawerStyles.drawerFooter}>
            {role === "admin" ? (
              <Pressable
                style={drawerStyles.drawerPublishRow}
                onPress={createPostFromDrawer}
              >
                <PlusCircle size={18} color={COLORS.green} />
                <Text style={drawerStyles.drawerPublishText}>Đăng bài</Text>
              </Pressable>
            ) : null}
            <Pressable style={drawerStyles.logoutRow} onPress={logout}>
              <LogOut size={18} color={COLORS.danger} />
              <Text style={drawerStyles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </Animated.View>
        <Pressable style={drawerStyles.drawerScrim} onPress={onClose} />
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  drawerLayer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  drawerScrim: {
    flex: 1,
  },
  drawer: {
    width: 288,
    backgroundColor: "#fff",
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    paddingBottom: LAYOUT.screenTop,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  drawerBrand: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: LAYOUT.sectionGap,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  drawerLogo: {
    width: 50,
    height: 52,
  },
  drawerTitle: {
    color: "#166534",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  drawerRole: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
  },
  drawerItem: {
    minHeight: 44,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    gap: 12,
  },
  drawerItemActive: {
    backgroundColor: COLORS.greenSoft,
  },
  drawerText: {
    color: COLORS.body,
    fontSize: 16,
    fontWeight: "600",
  },
  drawerTextActive: {
    color: COLORS.green,
  },
  drawerSubItem: {
    minHeight: 36,
    borderRadius: 8,
    justifyContent: "center",
    paddingLeft: 44,
  },
  drawerSubItemActive: {
    backgroundColor: "rgba(240,253,244,0.7)",
  },
  drawerSubText: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 15,
    fontWeight: "700",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "700",
  },
});
