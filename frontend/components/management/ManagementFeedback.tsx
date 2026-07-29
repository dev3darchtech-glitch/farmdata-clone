import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import {
  type CsvImportMode,
  type ManagementVariant,
  type ToastState,
} from "@/types/ui";
import {
  Check,
  CircleAlert,
  CircleCheck,
  KeyRound,
  Lock,
  LockOpen,
  Pencil,
  TriangleAlert,
  X,
} from "lucide-react-native";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "../shared/BottomSheet";

import { SYSTEM_FIELDS_BY_VARIANT, type ParsedCsv } from "@/utils/csvHelper";
import { DrawerSheet } from "../shared/DrawerSheet";
import { InputSelection } from "../shared/InputSelection";

export function CsvImportModal({
  mode,
  variant = "plots",
  parsedCsv,
  fieldMapping = {},
  onFieldMappingChange,
  progress,
  result,
  onClose,
  onStart,
  onConfirmImport,
}: {
  mode: CsvImportMode;
  variant?: ManagementVariant;
  parsedCsv?: ParsedCsv | null;
  fieldMapping?: Record<string, string>;
  onFieldMappingChange?: (systemKey: string, csvHeader: string) => void;
  progress: number;
  result: { success: number; skipped: number; errors: number };
  onClose: () => void;
  onStart: () => void;
  onConfirmImport?: () => void;
}) {
  const [activePickerKey, setActivePickerKey] = React.useState<string | null>(
    null,
  );

  if (!mode) return null;

  const systemFields = SYSTEM_FIELDS_BY_VARIANT[variant] || [];
  const missingRequired = systemFields.some(
    (field) => field.required && !fieldMapping[field.key],
  );

  const activePickerField = systemFields.find((f) => f.key === activePickerKey);

  const sheetTitle =
    mode === "select"
      ? "Import CSV"
      : mode === "mapping"
        ? "Ghép cột dữ liệu CSV"
        : mode === "loading"
          ? "Đang nhập dữ liệu..."
          : "Kết quả Import CSV";

  return (
    <>
      <DrawerSheet visible={Boolean(mode)} title={sheetTitle} onClose={onClose}>
        {mode === "select" ? (
          <View style={feedbackStyles.sheetBodyStack}>
            <Text style={feedbackStyles.selectDescription}>
              Tải lên file danh sách dạng CSV từ kho lưu trữ thiết bị của bạn.
              Hệ thống sẽ tự động hỗ trợ đọc và ghép tương ứng các cột dữ liệu.
            </Text>
            <View style={feedbackStyles.sheetFooterRow}>
              <Pressable
                style={feedbackStyles.primarySheetButton}
                onPress={onStart}
              >
                <Text style={feedbackStyles.primarySheetButtonText}>
                  Chọn file CSV
                </Text>
              </Pressable>
              <Pressable
                style={feedbackStyles.outlineSheetButton}
                onPress={onClose}
              >
                <Text style={feedbackStyles.outlineSheetButtonText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        ) : mode === "mapping" ? (
          <View style={feedbackStyles.sheetBodyStack}>
            {parsedCsv ? (
              <View style={feedbackStyles.fileInfoBadge}>
                <Text style={feedbackStyles.fileInfoText}>
                  📄 {parsedCsv.fileName} ({parsedCsv.rows.length} dòng dữ liệu)
                </Text>
              </View>
            ) : null}

            <Text style={feedbackStyles.mappingHintText}>
              Vui lòng ghép khớp các trường dữ liệu hệ thống với cột trong file
              CSV:
            </Text>

            <ScrollView
              style={{ maxHeight: 260 }}
              contentContainerStyle={feedbackStyles.mappingList}
              showsVerticalScrollIndicator={false}
            >
              {systemFields.map((field) => {
                const selectedHeader = fieldMapping[field.key];
                return (
                  <InputSelection
                    key={field.key}
                    label={field.label}
                    required={field.required}
                    placeholder="-- Chọn cột tương ứng --"
                    value={
                      selectedHeader ? `Cột: ${selectedHeader}` : undefined
                    }
                    onPress={() => setActivePickerKey(field.key)}
                  />
                );
              })}
            </ScrollView>

            <View style={feedbackStyles.sheetFooterRow}>
              <Pressable
                style={[
                  feedbackStyles.primarySheetButton,
                  missingRequired && feedbackStyles.primarySheetButtonDisabled,
                ]}
                disabled={missingRequired}
                onPress={onConfirmImport}
              >
                <Text style={feedbackStyles.primarySheetButtonText}>
                  Xác nhận Import
                </Text>
              </Pressable>
              <Pressable
                style={feedbackStyles.outlineSheetButton}
                onPress={onStart}
              >
                <Text style={feedbackStyles.outlineSheetButtonText}>
                  Chọn file khác
                </Text>
              </Pressable>
            </View>
          </View>
        ) : mode === "loading" ? (
          <View style={feedbackStyles.sheetBodyStack}>
            <View style={feedbackStyles.loadingContent}>
              <Text style={feedbackStyles.loadingTitle}>
                Đang nhập dữ liệu vào hệ thống...
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
            <View style={feedbackStyles.sheetFooterRow}>
              <Pressable
                style={feedbackStyles.outlineSheetButton}
                onPress={onClose}
              >
                <Text style={feedbackStyles.outlineSheetButtonText}>
                  Hủy import
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={feedbackStyles.sheetBodyStack}>
            <View style={feedbackStyles.resultBody}>
              <CircleCheck size={48} color="#2d7a32" />
              <Text style={feedbackStyles.resultTitle}>
                Hoàn tất xử lý import
              </Text>
              <View style={feedbackStyles.resultRows}>
                <Text style={feedbackStyles.constraintText}>
                  • Thành công: {result.success} bản ghi
                </Text>
                <Text style={feedbackStyles.constraintText}>
                  • Bỏ qua: {result.skipped} bản ghi
                </Text>
                <Text style={feedbackStyles.constraintText}>
                  • Lỗi: {result.errors} bản ghi
                </Text>
              </View>
            </View>
            <View style={feedbackStyles.sheetFooterRow}>
              <Pressable
                style={feedbackStyles.primarySheetButton}
                onPress={onClose}
              >
                <Text style={feedbackStyles.primarySheetButtonText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        )}
      </DrawerSheet>

      <DrawerSheet
        visible={Boolean(activePickerKey)}
        title={`Chọn cột CSV cho "${activePickerField?.label || ""}"`}
        onClose={() => setActivePickerKey(null)}
      >
        <ScrollView style={{ maxHeight: 280 }}>
          <Pressable
            style={feedbackStyles.mappingPickerOption}
            onPress={() => {
              if (activePickerKey) {
                onFieldMappingChange?.(activePickerKey, "");
              }
              setActivePickerKey(null);
            }}
          >
            <Text
              style={[
                feedbackStyles.mappingPickerOptionText,
                !fieldMapping[activePickerKey || ""] &&
                  feedbackStyles.mappingPickerActiveText,
              ]}
            >
              -- Bỏ qua / Không chọn --
            </Text>
            {!fieldMapping[activePickerKey || ""] ? (
              <Check size={18} color={COLORS.green} />
            ) : null}
          </Pressable>
          {parsedCsv?.headers.map((header) => {
            const isSelected = fieldMapping[activePickerKey || ""] === header;
            return (
              <Pressable
                key={header}
                style={feedbackStyles.mappingPickerOption}
                onPress={() => {
                  if (activePickerKey) {
                    onFieldMappingChange?.(activePickerKey, header);
                  }
                  setActivePickerKey(null);
                }}
              >
                <Text
                  style={[
                    feedbackStyles.mappingPickerOptionText,
                    isSelected && feedbackStyles.mappingPickerActiveText,
                  ]}
                >
                  Cột: {header}
                </Text>
                {isSelected ? <Check size={18} color={COLORS.green} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </DrawerSheet>
    </>
  );
}

export function ManagementActionMenu({
  visible,
  variant,
  inactive,
  canEdit = true,
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
  canEdit?: boolean;
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
        {variant !== "accounts" && !canEdit ? (
          <View
            style={{
              paddingVertical: 16,
              paddingHorizontal: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#6b7280",
                fontSize: 14,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              🔒 Dữ liệu mặc định của hệ thống{"\n"}Chỉ có thể xem, không có
              quyền chỉnh sửa hoặc ngưng sử dụng.
            </Text>
          </View>
        ) : null}
        {variant !== "accounts" && canEdit ? (
          <Pressable
            style={feedbackStyles.actionMenuRow}
            onPress={onEdit || onClose}
          >
            <Pencil size={20} color="#374151" />
            <Text style={feedbackStyles.actionMenuText}>Chỉnh sửa</Text>
          </Pressable>
        ) : null}
        {variant !== "accounts" && canEdit ? (
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
  const itemKind =
    variant === "plots"
      ? "mã luống"
      : variant === "diseases"
        ? "bệnh cây"
        : "loại cây";
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
  mappingCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    padding: 16,
    gap: 12,
    ...modalShadow,
  },
  fileInfoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignSelf: "flex-start",
  },
  fileInfoText: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "600",
  },
  mappingHintText: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 16,
  },
  mappingList: {
    gap: 12,
  },
  mappingPickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mappingPickerOptionText: {
    color: COLORS.text,
    fontSize: 14,
  },
  mappingPickerActiveText: {
    color: COLORS.green,
    fontWeight: "700",
  },
  primaryButton: {
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButtonDisabled: {
    backgroundColor: "#d1d5db",
    opacity: 0.6,
  },
  sheetBodyStack: {
    gap: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  selectDescription: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 6,
  },
  sheetFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  primarySheetButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  primarySheetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  primarySheetButtonDisabled: {
    backgroundColor: "#d1d5db",
    opacity: 0.65,
  },
  outlineSheetButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineSheetButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "600",
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  confirmCancelButton: {
    width: 100,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSubmitButton: {
    width: 100,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    color: COLORS.green,
    fontSize: 12,
    lineHeight: 16,
  },
  confirmSubmitText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
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
