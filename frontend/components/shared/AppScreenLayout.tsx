import { useAuth } from "@/hooks/useAuth";
import { ManagementVariant } from "@/types/ui";
import { normalizeRole, type TabRouteId } from "@/utils/captureDisplay";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { BottomNav } from "./BottomNav";
import { ManagementDrawer } from "./ManagementDrawer";
import { ScreenHeader } from "./ScreenHeader";

export function AppScreenLayout({
  active,
  children,
  headerTitle,
  managementVariant,
  onAdminCreatePost,
  overlays,
  setManagementVariant,
  testID,
}: {
  active: TabRouteId;
  children: React.ReactNode;
  headerTitle?: string;
  managementVariant?: ManagementVariant;
  onAdminCreatePost?: () => void;
  overlays?: React.ReactNode;
  setManagementVariant?: (variant: ManagementVariant) => void;
  testID?: string;
}) {
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role as string);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={appScreenLayoutStyles.screen} testID={testID}>
      <ScreenHeader title={headerTitle} onMenu={() => setSidebarOpen(true)} />
      {children}
      <BottomNav active={active} admin={role === "admin"} />
      <ManagementDrawer
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={managementVariant}
        setVariant={setManagementVariant}
        user={user}
        logout={logout}
        onAdminCreatePost={onAdminCreatePost}
      />
      {overlays}
    </View>
  );
}

const appScreenLayoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
