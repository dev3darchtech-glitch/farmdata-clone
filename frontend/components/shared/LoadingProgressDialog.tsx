import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export function LoadingProgressDialog({
  visible,
  title,
  detail,
  percent,
}: {
  visible: boolean;
  title: string;
  detail: string;
  percent: number;
}) {
  if (!visible) return null;

  const size = 128;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (circumference * safePercent) / 100;

  return (
    <View style={loadingDialogStyles.loadingOverlay}>
      <View style={loadingDialogStyles.loadingDialog}>
        <View style={loadingDialogStyles.loadingRingWrap}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e0e0e0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.green}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={loadingDialogStyles.loadingRingCenter}>
            <Text style={loadingDialogStyles.loadingPercentText}>
              {safePercent}%
            </Text>
          </View>
        </View>
        <View style={loadingDialogStyles.loadingTitleWrap}>
          <Text style={loadingDialogStyles.loadingTitle}>{title}</Text>
          <View style={loadingDialogStyles.loadingDetailRow}>
            <Text style={loadingDialogStyles.loadingDetail}>{detail}</Text>
            <ActivityIndicator size="small" color={COLORS.green} />
          </View>
        </View>
        <View style={loadingDialogStyles.loadingBarTrack}>
          <View
            style={[
              loadingDialogStyles.loadingBarFill,
              { width: `${safePercent}%` },
            ]}
          />
        </View>
        <Text style={loadingDialogStyles.loadingHint}>
          Vui lòng không đóng ứng dụng
        </Text>
      </View>
    </View>
  );
}

export const loadingOverlayStyle = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,28,26,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});

const loadingDialogStyles = StyleSheet.create({
  loadingOverlay: loadingOverlayStyle.overlay,
  loadingDialog: {
    width: 320,
    minHeight: 330,
    borderRadius: 12,
    backgroundColor: "#faf9f5",
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: LAYOUT.modalY,
    paddingBottom: LAYOUT.modalY,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  loadingRingWrap: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRingCenter: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingPercentText: {
    color: "#2b2b2b",
    fontSize: TYPOGRAPHY.title,
    lineHeight: 28,
    fontWeight: "600",
  },
  loadingTitleWrap: {
    marginTop: 24,
    alignItems: "center",
  },
  loadingTitle: {
    color: "#2b2b2b",
    fontSize: TYPOGRAPHY.title,
    lineHeight: TYPOGRAPHY.titleLine,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingDetailRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingDetail: {
    color: "#2b2b2b",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
    textAlign: "center",
  },
  loadingBarTrack: {
    width: "100%",
    height: 6,
    marginTop: 28,
    borderRadius: 999,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  loadingBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },
  loadingHint: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: TYPOGRAPHY.helper,
    lineHeight: TYPOGRAPHY.bodyLine,
    textAlign: "center",
  },
});
