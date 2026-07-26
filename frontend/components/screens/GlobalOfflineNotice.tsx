import { COLORS } from "@/constants/theme";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { WifiOff, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function GlobalOfflineNotice() {
  const offline = useOfflineStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!offline) {
      setDismissed(false);
    }
  }, [offline]);

  if (!offline || dismissed) return null;

  return (
    <View pointerEvents="box-none" style={offlineNoticeStyles.offlineLayer}>
      <View style={offlineNoticeStyles.offlineBanner}>
        <WifiOff size={18} color="#fff" />
        <Text style={offlineNoticeStyles.offlineBannerText}>
          Bạn đang mất kết nối
        </Text>
        <Pressable onPress={() => setDismissed(true)}>
          <X size={18} color="#fff" />
        </Pressable>
      </View>
      <View style={offlineNoticeStyles.offlineSheet}>
        <View style={offlineNoticeStyles.offlineSheetHandle} />
        <Text style={offlineNoticeStyles.offlineSheetTitle}>
          Bạn đang offline
        </Text>
        <Text style={offlineNoticeStyles.offlineSheetDescription}>
          Dữ liệu sẽ được lưu tạm và đồng bộ khi có kết nối trở lại.
        </Text>
        <Pressable
          style={offlineNoticeStyles.offlineSheetButton}
          onPress={() => setDismissed(true)}
        >
          <Text style={offlineNoticeStyles.offlineSheetButtonText}>
            Đã hiểu
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const offlineNoticeStyles = StyleSheet.create({
  offlineLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 23,
  },
  offlineBanner: {
    alignSelf: "center",
    width: 320,
    minHeight: 41,
    borderRadius: 10,
    backgroundColor: "#c53030",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  offlineBannerText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "600",
  },
  offlineSheet: {
    alignSelf: "center",
    width: 358,
    minHeight: 242,
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
    elevation: 10,
  },
  offlineSheetHandle: {
    width: 64,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#d1d5db",
    marginBottom: 24,
  },
  offlineSheetTitle: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  offlineSheetDescription: {
    marginTop: 16,
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  offlineSheetButton: {
    marginTop: 16,
    width: 310,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineSheetButtonText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "600",
  },
});
