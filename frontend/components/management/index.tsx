import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

export function StatusBadge({ active }: { active: boolean }) {
  return <Text>{active ? "Đang sử dụng" : "Ngừng sử dụng"}</Text>;
}

export function SnackbarNotification({ visible, message }: { visible: boolean; message: string; onHide?: () => void; durationMs?: number }) {
  if (!visible) return null;
  return (
    <View testID="snackbar-notification">
      <Text>{message}</Text>
    </View>
  );
}

export function ConfirmModal({ visible, title, description, onConfirm, onCancel }: any) {
  return (
    <Modal visible={visible} transparent>
      <View testID="confirm-dialog">
        <Text>{title}</Text>
        <Text>{description}</Text>
        <Pressable testID="confirm-action-button" onPress={onConfirm}><Text>Xác nhận</Text></Pressable>
        <Pressable onPress={onCancel}><Text>Hủy</Text></Pressable>
      </View>
    </Modal>
  );
}

export function ActionMenuModal({ visible, itemCode, onClose, onDisable }: any) {
  return (
    <Modal visible={visible} transparent>
      <View testID="admin-action-menu">
        <Text>{itemCode}</Text>
        <Pressable onPress={onDisable}><Text>Ngừng sử dụng</Text></Pressable>
        <Pressable onPress={onClose}><Text>Đóng</Text></Pressable>
      </View>
    </Modal>
  );
}

export function AdminSidebarDrawer({ visible, activeSubTab, onSelectTab, onClose }: any) {
  return (
    <Modal visible={visible} transparent>
      <View testID="admin-sidebar">
        {["plots", "crops", "accounts"].map((tab) => (
          <Pressable key={tab} testID={`admin-${tab}`} onPress={() => onSelectTab?.(tab)}>
            <Text>{tab === activeSubTab ? `${tab} active` : tab}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onClose}><Text>Đóng</Text></Pressable>
      </View>
    </Modal>
  );
}

export function CsvImportCard({ visible, onClose, onImportComplete }: any) {
  return (
    <Modal visible={visible} transparent>
      <View testID="admin-import-select">
        <Text>Import CSV</Text>
        <Pressable onPress={() => onImportComplete?.({ success: 0, skipped: 0, errors: 0 })}><Text>Import</Text></Pressable>
        <Pressable onPress={onClose}><Text>Đóng</Text></Pressable>
      </View>
    </Modal>
  );
}

export function CsvImportResultModal({ visible, onClose }: any) {
  return (
    <Modal visible={visible} transparent>
      <View testID="admin-import-result">
        <Text>Kết quả import</Text>
        <Pressable onPress={onClose}><Text>Đóng</Text></Pressable>
      </View>
    </Modal>
  );
}

export function AddPlotModal({ visible, onClose }: any) {
  return <CsvImportResultModal visible={visible} onClose={onClose} />;
}

export function AddCropModal({ visible, onClose }: any) {
  return <CsvImportResultModal visible={visible} onClose={onClose} />;
}
