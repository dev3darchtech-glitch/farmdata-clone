import { COLORS } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { normalizeRole } from "@/utils/captureDisplay";
import { Tabs } from "expo-router";
import {
  CameraIcon,
  FileText,
  LayoutDashboardIcon,
  UserIcon,
} from "lucide-react-native";
import React from "react";

export default function TabsLayout() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role as string);
  const isAdmin = role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#f3f4f6",
          // height: 54,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="posts"
        options={{
          title: "Bài đăng",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: "Chụp ảnh",
          tabBarIcon: ({ color, size }) => (
            <CameraIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: "Quản lý",
          href: isAdmin ? "/(tabs)/management" : null,
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboardIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <UserIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
