import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import {
  Camera,
  Check,
  CircleCheck,
  FileText,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { loadingOverlayStyle } from "../shared/LoadingProgressDialog";

export function CaptureSuccessDialog({
  visible,
  onCaptureNext,
  onViewPosts,
}: {
  visible: boolean;
  onCaptureNext: () => void;
  onViewPosts: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={loadingOverlayStyle.overlay}>
      <View style={captureResultStyles.captureSuccessDialog}>
        <View style={captureResultStyles.captureSuccessIconWrap}>
          <View style={captureResultStyles.captureSuccessIconCircle}>
            <CircleCheck size={40} color={COLORS.green} fill={COLORS.green} />
            <Check
              size={20}
              color="#eaf29d"
              style={captureResultStyles.captureSuccessIconCheck}
            />
          </View>
        </View>
        <Text style={captureResultStyles.captureSuccessTitle}>
          Session saved successfully!
        </Text>
        <Text style={captureResultStyles.captureSuccessDescription}>
          Post has been automatically created.
        </Text>
        <View style={captureResultStyles.captureSuccessActions}>
          <Pressable
            style={captureResultStyles.captureSuccessPrimaryButton}
            onPress={onCaptureNext}
          >
            <Camera size={18} color="#fff" />
            <Text style={captureResultStyles.captureSuccessPrimaryText}>
              Capture new session
            </Text>
          </Pressable>
          <Pressable
            style={captureResultStyles.captureSuccessSecondaryButton}
            onPress={onViewPosts}
          >
            <FileText size={16} color="#2b2b2b" />
            <Text style={captureResultStyles.captureSuccessSecondaryText}>
              View Post list
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function CaptureErrorDialog({
  visible,
  message,
  onRetry,
}: {
  visible: boolean;
  message: string;
  onRetry: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={loadingOverlayStyle.overlay}>
      <View style={captureResultStyles.captureErrorDialog}>
        <View style={captureResultStyles.captureErrorIconWrap}>
          <TriangleAlert size={54} color="#f97316" strokeWidth={2.2} />
        </View>
        <Text style={captureResultStyles.captureErrorTitle}>
          Chưa thể lưu phiên chụp
        </Text>
        <Text style={captureResultStyles.captureErrorDescription}>
          {message || "Vui lòng kiểm tra kết nối và thử lại."}
        </Text>
        <Pressable
          style={captureResultStyles.captureErrorButton}
          onPress={onRetry}
        >
          <RefreshCcw size={14} color="#fff" />
          <Text style={captureResultStyles.captureErrorButtonText}>
            Thử lại
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const captureResultStyles = StyleSheet.create({
  captureSuccessDialog: {
    width: 319,
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: LAYOUT.modalY,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  captureSuccessIconWrap: {
    width: 80,
    height: 104,
    paddingBottom: LAYOUT.modalY,
    alignItems: "center",
  },
  captureSuccessIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eaf29d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#34703f",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  captureSuccessIconCheck: {
    position: "absolute",
  },
  captureSuccessTitle: {
    paddingBottom: 8,
    color: "#2b2b2b",
    fontSize: TYPOGRAPHY.title,
    lineHeight: TYPOGRAPHY.titleLine,
    fontWeight: "700",
    textAlign: "center",
  },
  captureSuccessDescription: {
    paddingBottom: LAYOUT.screenGap,
    color: "#2b2b2b",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
    textAlign: "center",
  },
  captureSuccessActions: {
    width: "100%",
    gap: LAYOUT.sectionGap,
  },
  captureSuccessPrimaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  captureSuccessPrimaryText: {
    color: "#fff",
    fontSize: TYPOGRAPHY.label,
    lineHeight: 16,
    fontWeight: "600",
  },
  captureSuccessSecondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  captureSuccessSecondaryText: {
    color: "#2b2b2b",
    fontSize: TYPOGRAPHY.label,
    lineHeight: 16,
    fontWeight: "600",
  },
  captureErrorDialog: {
    width: 320,
    minHeight: 303,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: LAYOUT.modalY,
    paddingBottom: LAYOUT.modalY,
    alignItems: "center",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
    elevation: 8,
  },
  captureErrorIconWrap: {
    width: 80,
    height: 104,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  captureErrorTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.title,
    lineHeight: TYPOGRAPHY.titleLine,
    fontWeight: "700",
    textAlign: "center",
  },
  captureErrorDescription: {
    marginTop: 8,
    minHeight: 47,
    color: COLORS.body,
    fontSize: TYPOGRAPHY.body,
    lineHeight: 23,
    textAlign: "center",
  },
  captureErrorButton: {
    marginTop: 16,
    width: 256,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  captureErrorButtonText: {
    color: "#fff",
    fontSize: TYPOGRAPHY.label,
    lineHeight: 16,
    fontWeight: "600",
  },
});
