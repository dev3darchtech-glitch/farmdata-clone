import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import {
  type CsvImportMode,
  type ManagementVariant,
  type ToastState,
} from "@/types/ui";
import {
  CircleAlert,
  CircleCheck,
  KeyRound,
  Lock,
  LockOpen,
  Pencil,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react-native";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../shared/BottomSheet";

export function CsvImportModal({
  mode,
  progress,
  result,
  onClose,
  onStart,
}: {
  mode: CsvImportMode;
  progress: number;
  result: { success: number; skipped: number; errors: number };
  onClose: () => void;
  onStart: () => void;
}) {
  if (!mode) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={feedbackStyles.scrim}>
        {mode === "select" ? (
          <View style={feedbackStyles.card}>
            <View style={feedbackStyles.modalHeader}>
              <Text style={feedbackStyles.modalTitle}>Import CSV</Text>
              <Pressable onPress={onClose}>
                <X size={24} color={COLORS.text} />
              </Pressable>
            </View>
            <View style={feedbackStyles.modalBody}>
              <Pressable style={feedbackStyles.uploadArea} onPress={onStart}>
                <Upload size={48} color={COLORS.muted} />
                <Text style={feedbackStyles.uploadTitle}>Chọn file CSV</Text>
                <Text style={feedbackStyles.uploadSubtitle}>
                  hoặc kéo thả file vào đây
                </Text>
              </Pressable>
              <View style={feedbackStyles.constraintBlock}>
                <Text style={feedbackStyles.constraintText}>
                  Dung lượng tối đa: 5MB
                </Text>
                <Text style={feedbackStyles.constraintText}>
                  Định dạng: .csv
                </Text>
              </View>
            </View>
            <View style={feedbackStyles.modalFooter}>
              <Pressable style={feedbackStyles.outlineButton} onPress={onClose}>
                <Text style={feedbackStyles.outlineButtonText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        ) : mode === "loading" ? (
          <View style={feedbackStyles.loadingCard}>
            <View style={feedbackStyles.loadingHeader}>
              <Pressable onPress={onClose}>
                <X size={24} color={COLORS.text} />
              </Pressable>
            </View>
            <View style={feedbackStyles.loadingContent}>
              <Text style={feedbackStyles.loadingTitle}>
                Đang xử lý file...
              </Text>
              <View style={feedbackStyles.progressTrack}>
                <View
                  style={[
                    feedbackStyles.progressFill,
                    { width: `${Math.max(0, Math.min(progress, 100))}%` },
                  ]}
                />
              </View>
              <Text style={feedbackStyles.progressText}>{progress}%</Text>
            </View>
            <View style={feedbackStyles.modalFooter}>
              <Pressable style={feedbackStyles.outlineButton} onPress={onClose}>
                <Text style={feedbackStyles.outlineButtonText}>Hủy import</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={feedbackStyles.card}>
            <View style={feedbackStyles.modalHeader}>
              <Text style={feedbackStyles.modalTitle}>Kết quả import CSV</Text>
              <Pressable onPress={onClose}>
                <X size={24} color={COLORS.text} />
              </Pressable>
            </View>
            <View style={feedbackStyles.resultBody}>
              <CircleCheck size={48} color="#2d7a32" />
              <Text style={feedbackStyles.resultTitle}>Hoàn tất xử lý</Text>
              <View style={feedbackStyles.resultRows}>
                <Text style={feedbackStyles.constraintText}>
                  Thành công: {result.success}
                </Text>
                <Text style={feedbackStyles.constraintText}>
                  Bỏ qua: {result.skipped}
                </Text>
                <Text style={feedbackStyles.constraintText}>
                  Lỗi: {result.errors}
                </Text>
              </View>
            </View>
            <View style={feedbackStyles.modalFooter}>
              <Pressable style={feedbackStyles.outlineButton} onPress={onClose}>
                <Text style={feedbackStyles.outlineButtonText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export function ManagementActionMenu({
  visible,
  variant,
  inactive,
  onClose,
  onEdit,
  onDeactivate,
  onActivate,
  onRevoke,
  onRestore,
  onResetPassword,
}: {
  visible: boolean;
  variant: ManagementVariant;
  inactive?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  onRevoke?: () => void;
  onRestore?: () => void;
  onResetPassword: () => void;
}) {
  if (!visible) return null;

  return (
    <BottomSheet visible={visible} title="Thao tác" onClose={onClose}>
      <View style={feedbackStyles.actionSheetContent}>
        {variant !== "accounts" ? (
          <Pressable
            style={feedbackStyles.actionMenuRow}
            onPress={onEdit || onClose}
          >
            <Pencil size={20} color="#374151" />
            <Text style={feedbackStyles.actionMenuText}>Chỉnh sửa</Text>
          </Pressable>
        ) : null}
        {variant !== "accounts" ? (
          <Pressable
            style={[
              feedbackStyles.actionMenuRow,
              feedbackStyles.actionMenuRowLast,
            ]}
            onPress={inactive ? onActivate : onDeactivate}
          >
            {inactive ? (
              <CircleCheck size={20} color={COLORS.green} />
            ) : (
              <TriangleAlert size={20} color="#f97316" />
            )}
            <Text
              style={
                inactive
                  ? feedbackStyles.actionMenuText
                  : feedbackStyles.actionMenuWarningText
              }
            >
              {inactive ? "Hoạt động lại" : "Ngừng sử dụng"}
            </Text>
          </Pressable>
        ) : null}
        {variant === "accounts" ? (
          <>
            <Pressable
              style={feedbackStyles.actionMenuRow}
              onPress={inactive ? onRestore || onClose : onRevoke || onClose}
            >
              {inactive ? (
                <LockOpen size={20} color={COLORS.green} />
              ) : (
                <Lock size={20} color="#dc2626" />
              )}
              <Text
                style={
                  inactive
                    ? feedbackStyles.actionMenuText
                    : feedbackStyles.actionMenuDangerText
                }
              >
                {inactive ? "Mở khóa tài khoản" : "Khóa tài khoản"}
              </Text>
            </Pressable>
            <Pressable
              style={[
                feedbackStyles.actionMenuRow,
                feedbackStyles.actionMenuRowLast,
              ]}
              onPress={onResetPassword}
            >
              <KeyRound size={20} color="#374151" />
              <Text style={feedbackStyles.actionMenuText}>
                Đặt lại mật khẩu
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

export function ConfirmStatusDialog({
  visible,
  itemLabel,
  isActivating,
  variant,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  itemLabel: string;
  isActivating: boolean;
  variant: ManagementVariant;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;
  const itemKind = variant === "plots" ? "mã luống" : "loại cây";
  const actionLabel = isActivating ? "hoạt động lại" : "ngừng sử dụng";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={feedbackStyles.scrim}>
        <View style={feedbackStyles.confirmCard}>
          <View style={feedbackStyles.confirmBody}>
            <View style={feedbackStyles.confirmIconArea}>
              <CircleCheck size={64} color={COLORS.green} />
            </View>
            <Text style={feedbackStyles.confirmTitle}>
              {isActivating ? "Hoạt động lại?" : "Ngừng sử dụng?"}
            </Text>
            <Text style={feedbackStyles.confirmDescription}>
              Bạn có chắc chắn muốn{"\n"}
              {actionLabel} {itemKind} {itemLabel}?
            </Text>
          </View>
          <View style={feedbackStyles.confirmFooter}>
            <Pressable
              style={feedbackStyles.confirmCancelButton}
              onPress={onCancel}
            >
              <Text style={feedbackStyles.confirmCancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={feedbackStyles.confirmSubmitButton}
              onPress={onConfirm}
            >
              <Text style={feedbackStyles.confirmSubmitText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ManagementSnackbar({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  if (!toast) return null;

  return (
    <Pressable
      style={[
        feedbackStyles.toast,
        toast.type === "success"
          ? feedbackStyles.toastSuccess
          : toast.type === "warning"
            ? feedbackStyles.toastWarning
            : feedbackStyles.toastError,
      ]}
      onPress={onClose}
    >
      {toast.type === "success" ? (
        <CircleCheck size={24} color="#fff" />
      ) : toast.type === "warning" ? (
        <CircleAlert size={24} color="#fff" />
      ) : (
        <X size={24} color="#fff" />
      )}
      <Text style={feedbackStyles.toastText}>{toast.message}</Text>
      <X size={20} color="#fff" />
    </Pressable>
  );
}

const modalShadow = Platform.select({
  web: { boxShadow: "0 25px 50px rgba(0,0,0,0.25)" },
  default: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
});

const feedbackStyles = StyleSheet.create({
  scrim: {
    flex: 1,
    paddingHorizontal: LAYOUT.modalX,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    ...modalShadow,
  },
  modalHeader: {
    minHeight: 65,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "500",
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  modalBody: {
    padding: LAYOUT.modalY,
    gap: LAYOUT.screenGap,
  },
  uploadArea: {
    minHeight: 195,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: LAYOUT.modalY,
  },
  uploadTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "500",
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  uploadSubtitle: {
    color: "#9ca3af",
    fontSize: TYPOGRAPHY.label,
    lineHeight: TYPOGRAPHY.bodyLine,
    textAlign: "center",
  },
  constraintBlock: {
    gap: 4,
  },
  constraintText: {
    color: "#9ca3af",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  modalFooter: {
    paddingHorizontal: LAYOUT.modalX,
    paddingVertical: LAYOUT.modalY,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "#fff",
  },
  outlineButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    color: COLORS.green,
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    ...modalShadow,
  },
  loadingHeader: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  loadingContent: {
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: 8,
    paddingBottom: 64,
    gap: LAYOUT.sectionGap,
    alignItems: "center",
  },
  loadingTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "500",
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#16a34a",
  },
  progressText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  resultBody: {
    paddingHorizontal: LAYOUT.modalX,
    paddingVertical: LAYOUT.modalY,
    alignItems: "center",
    gap: 14,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "500",
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  resultRows: {
    alignSelf: "stretch",
    gap: 4,
  },
  actionSheetContent: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  actionMenuRow: {
    height: 56,
    paddingLeft: 24,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: LAYOUT.sectionGap,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  actionMenuRowLast: {
    borderBottomWidth: 0,
  },
  actionMenuText: {
    color: "#374151",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  actionMenuWarningText: {
    color: "#f97316",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  actionMenuDangerText: {
    color: "#dc2626",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  confirmBody: {
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: LAYOUT.modalY,
    paddingBottom: LAYOUT.modalY,
    alignItems: "center",
    gap: LAYOUT.sectionGap,
  },
  confirmIconArea: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: "500",
    lineHeight: TYPOGRAPHY.bodyLine,
    textAlign: "center",
  },
  confirmDescription: {
    color: COLORS.body,
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
    textAlign: "center",
  },
  confirmFooter: {
    paddingHorizontal: LAYOUT.modalX,
    paddingVertical: LAYOUT.sectionGap,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  confirmCancelButton: {
    width: 101,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSubmitButton: {
    width: 125,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    color: COLORS.green,
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  confirmSubmitText: {
    color: "#fff",
    fontSize: TYPOGRAPHY.body,
    fontWeight: "600",
    lineHeight: TYPOGRAPHY.relaxedLine,
  },
  toast: {
    position: "absolute",
    left: LAYOUT.screenX,
    right: LAYOUT.screenX,
    bottom: 150,
    minHeight: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0 8px 20px rgba(0,0,0,0.18)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      },
    }),
  },
  toastSuccess: {
    backgroundColor: "#2d7a32",
  },
  toastWarning: {
    backgroundColor: "#d97706",
  },
  toastError: {
    backgroundColor: "#c53030",
  },
  toastText: {
    flex: 1,
    color: "#fff",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
});
