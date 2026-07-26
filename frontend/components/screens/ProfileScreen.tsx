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
            <CircleUserRound size={54} color={COLORS.green} />
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
            <Camera size={24} color={COLORS.green} />
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
          <LogOut size={18} color="#fff" />
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
    paddingTop: LAYOUT.screenTop,
    paddingBottom: 108,
    gap: 18,
  },
  profileHeroCard: {
    minHeight: 184,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  profileUsername: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  profileStatCard: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 0 8px rgba(0, 0, 0, 0.08)",
    elevation: 2,
  },
  profileStatIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  profileStatValue: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  profileStatLabel: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  profileInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  profileInfoRow: {
    minHeight: 62,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    justifyContent: "center",
    gap: 4,
  },
  profileInfoLabel: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileInfoValue: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
  },
  profileLogoutButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  profileLogoutText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
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
