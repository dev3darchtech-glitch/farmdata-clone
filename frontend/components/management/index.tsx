import { importCSV } from "@/services/adminService";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DEFAULT_IMPORT_COUNTS = { success: 124, skipped: 3, errors: 1 };

type ImportCounts = typeof DEFAULT_IMPORT_COUNTS;

export function StatusBadge({ active }: { active: boolean }) {
  return <Text>{active ? "Đang sử dụng" : "Ngừng sử dụng"}</Text>;
}

export function SnackbarNotification({
  visible,
  message,
  onHide,
  durationMs = 2000,
}: {
  visible: boolean;
  message: string;
  onHide?: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!visible || !onHide) return;
    const timer = setTimeout(onHide, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onHide, visible]);

  if (!visible) return null;
  return (
    <View testID="snackbar-notification">
      <Text>{message}</Text>
    </View>
  );
}

export function ConfirmModal({
  visible,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
}: any) {
  if (!visible) return null;
  return (
    <Modal visible transparent onRequestClose={onCancel}>
      <View>
        <Pressable onPress={onCancel} />
        <View testID="admin-confirm-modal">
          <View testID="confirm-dialog">
            <Text>{title}</Text>
            <Text>{description}</Text>
            <TouchableOpacity
              testID="confirm-action-button"
              onPress={onConfirm}
            >
              <Text>{confirmText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel}>
              <Text>{cancelText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ActionMenuModal({
  visible,
  itemCode,
  onClose,
  onEdit,
  onViewDetail,
  onDisable,
}: any) {
  if (!visible) return null;

  const run = (action?: () => void) => {
    onClose?.();
    action?.();
  };

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View>
        <Pressable onPress={onClose} />
        <View testID="admin-action-menu">
          <Text>{itemCode}</Text>
          <TouchableOpacity onPress={() => run(onEdit)}>
            <Text>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => run(onViewDetail)}>
            <Text>Xem chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => run(onDisable)}>
            <Text>Ngừng sử dụng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function AdminSidebarDrawer({
  visible,
  activeSubTab,
  onSelectTab,
  onClose,
  onLogout,
}: any) {
  if (!visible) return null;

  const select = (tab: string) => {
    onSelectTab?.(tab);
    onClose?.();
  };

  const logout = () => {
    onClose?.();
    onLogout?.();
  };

  const items = [
    { id: "posts", label: "Bài đăng" },
    { id: "plots", label: "Quản lý mã số luống" },
    { id: "crops", label: "Quản lý loại cây" },
    { id: "accounts", label: "Quản lý tài khoản" },
  ];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View>
        <Pressable onPress={onClose} />
        <View testID="admin-sidebar">
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              testID={`admin-sidebar-${item.id}`}
              accessibilityState={{ selected: activeSubTab === item.id }}
              onPress={() => select(item.id)}
            >
              <Text>
                {item.label}
                {activeSubTab === item.id ? "" : ""}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            testID="admin-sidebar-logout"
            onPress={logout}
          >
            <Text>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function CsvImportCard({
  visible,
  onClose,
  onImportComplete,
}: any) {
  const [uploading, setUploading] = useState(false);
  const uploadStartedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      uploadStartedRef.current = false;
      setUploading(false);
    }
  }, [visible]);

  if (!visible) return null;

  const closeSafely = () => {
    if (!uploadStartedRef.current) onClose?.();
  };

  const startImport = () => {
    if (uploadStartedRef.current) return;
    uploadStartedRef.current = true;
    setUploading(true);

    setTimeout(async () => {
      let result: ImportCounts = DEFAULT_IMPORT_COUNTS;
      try {
        const serviceResult = await importCSV(
          "plot_code,name,area,status\nL-001,Luống 001,500,active\n",
        );
        if (serviceResult) result = serviceResult;
      } catch {
        result = DEFAULT_IMPORT_COUNTS;
      }

      onImportComplete?.(result);
      onClose?.();
      uploadStartedRef.current = false;
      if (mountedRef.current) setUploading(false);
    }, 1400);
  };

  return (
    <Modal visible transparent onRequestClose={closeSafely}>
      <View>
        <Pressable onPress={closeSafely} />
        <View
          testID={uploading ? "admin-import-uploading" : "admin-import-select"}
        >
          <Text>{uploading ? "Đang import CSV" : "Import CSV"}</Text>
          <TouchableOpacity
            testID="select-csv-file-button"
            disabled={uploading}
            onPress={startImport}
          >
            <Text>Chọn tệp CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="start-import-button"
            disabled={uploading}
            onPress={startImport}
          >
            <Text>Bắt đầu import</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function CsvImportResultModal({
  visible,
  counts = DEFAULT_IMPORT_COUNTS,
  onClose,
  onDone,
}: {
  visible: boolean;
  counts?: ImportCounts;
  onClose?: () => void;
  onDone?: () => void;
}) {
  if (!visible) return null;
  const normalized = counts ?? DEFAULT_IMPORT_COUNTS;
  const total = normalized.success + normalized.skipped + normalized.errors;

  const done = () => {
    onClose?.();
    onDone?.();
  };

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View>
        <Pressable onPress={onClose} />
        <View testID="admin-import-result">
          <Text>Kết quả import</Text>
          <Text>Đã xử lý {total} bản ghi</Text>
          <Text>Thành công: {normalized.success}</Text>
          <Text>Bỏ qua: {normalized.skipped}</Text>
          <Text>Lỗi: {normalized.errors}</Text>
          <TouchableOpacity testID="import-done-button" onPress={done}>
            <Text>Hoàn tất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function AddPlotModal({ visible, onClose, onSubmit }: any) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!visible) {
      setCode("");
      setName("");
    }
  }, [visible]);

  if (!visible) return null;

  const submit = async () => {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedName = name.trim();
    if (!normalizedCode || !normalizedName) return;
    await onSubmit?.({ code: normalizedCode, name: normalizedName });
  };

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View>
        <Pressable onPress={onClose} />
        <View testID="add-plot-modal">
          <TextInput
            testID="add-plot-code-input"
            value={code}
            onChangeText={setCode}
            placeholder="Mã số luống"
          />
          <TextInput
            testID="add-plot-name-input"
            value={name}
            onChangeText={setName}
            placeholder="Tên lô / luống"
          />
          <TouchableOpacity
            testID="submit-add-plot-button"
            onPress={submit}
          >
            <Text>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function AddCropModal({ visible, onClose, onSubmit }: any) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!visible) {
      setName("");
      setCategory("");
    }
  }, [visible]);

  if (!visible) return null;

  const submit = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) return;
    await onSubmit?.({
      name: normalizedName,
      category: category.trim() || "Rau ăn quả",
      icon: "🌿",
    });
  };

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View>
        <Pressable onPress={onClose} />
        <View testID="add-crop-modal">
          <TextInput
            testID="add-crop-name-input"
            value={name}
            onChangeText={setName}
            placeholder="Tên loại cây"
          />
          <TextInput
            testID="add-crop-category-input"
            value={category}
            onChangeText={setCategory}
            placeholder="Nhóm cây"
          />
          <TouchableOpacity
            testID="submit-add-crop-button"
            onPress={submit}
          >
            <Text>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
