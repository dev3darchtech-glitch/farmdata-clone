import { COLORS, LAYOUT } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { getPosts } from "@/services/postService";
import { ManagementVariant } from "@/types/ui";
import { normalizeRole } from "@/utils/captureDisplay";
import { router } from "expo-router";
import { Camera, CircleUserRound, LogOut } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreenLayout } from "../shared/AppScreenLayout";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role as string);
  const [captureCount, setCaptureCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [sidebarVariant, setSidebarVariant] =
    useState<ManagementVariant>("plots");

  useEffect(() => {
    let mounted = true;
    setLoadingCount(true);
    getPosts(role, user?.id)
      .then((items) => {
        if (mounted) {
          setCaptureCount(items.length);
        }
      })
      .catch(() => {
        if (mounted) {
          setCaptureCount(0);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingCount(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [role, user?.id]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <AppScreenLayout
      active="profile"
      headerTitle="Cá nhân"
      managementVariant={sidebarVariant}
      setManagementVariant={setSidebarVariant}
      testID="profile-screen"
    >
      <ScrollView
        style={profileScreenStyles.profileScroll}
        contentContainerStyle={profileScreenStyles.profileContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={profileScreenStyles.profileHeroCard}>
          <View style={profileScreenStyles.profileAvatar}>
            <CircleUserRound size={38} color={COLORS.green} />
          </View>
          <Text style={profileScreenStyles.profileName}>
            {user?.name || "Người dùng"}
          </Text>
          <Text style={profileScreenStyles.profileUsername}>
            @{user?.username || user?.email || "unknown"}
          </Text>
        </View>

        <View style={profileScreenStyles.profileStatCard}>
          <View style={profileScreenStyles.profileStatIcon}>
            <Camera size={20} color={COLORS.green} />
          </View>
          <View>
            <Text style={profileScreenStyles.profileStatValue}>
              {loadingCount ? "..." : captureCount}
            </Text>
            <Text style={profileScreenStyles.profileStatLabel}>
              Số phiên chụp ảnh
            </Text>
          </View>
        </View>

        <View style={profileScreenStyles.profileInfoCard}>
          <ProfileInfoRow label="Username" value={user?.username || "--"} />
          <ProfileInfoRow
            label="Email"
            value={user?.email || "Không có email"}
          />
          <ProfileInfoRow
            label="Vai trò"
            value={role === "admin" ? "Admin" : "Farmer"}
          />
        </View>

        <Pressable
          style={profileScreenStyles.profileLogoutButton}
          onPress={handleLogout}
        >
          <LogOut size={16} color="#fff" />
          <Text style={profileScreenStyles.profileLogoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </AppScreenLayout>
  );
}

const profileScreenStyles = StyleSheet.create({
  profileScroll: {
    flex: 1,
  },
  profileContent: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: 8,
    paddingBottom: 80,
    gap: 12,
  },
  profileHeroCard: {
    minHeight: 130,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  profileUsername: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  profileStatCard: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 1,
  },
  profileStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileStatValue: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  profileStatLabel: {
    color: COLORS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  profileInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  profileInfoRow: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    justifyContent: "center",
    gap: 2,
  },
  profileInfoLabel: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileInfoValue: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  profileLogoutButton: {
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  profileLogoutText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
  },
});

function ProfileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={profileScreenStyles.profileInfoRow}>
      <Text style={profileScreenStyles.profileInfoLabel}>{label}</Text>
      <Text style={profileScreenStyles.profileInfoValue}>{value}</Text>
    </View>
  );
}
