import { COLORS } from "@/constants/theme";
import {
  addCropType,
  addPlot,
  addUser,
  deactivateCropType,
  deactivatePlot,
  getCropTypes,
  getPlots,
  getUsers,
  revokeUser,
  updateCropType,
  updatePlot,
  updateUser,
} from "@/services/adminService";
import { CropTypeInfo, PlotInfo, User } from "@/types";
import {
  type CsvImportMode,
  type ManagementVariant,
  type ToastKind,
  type ToastState,
} from "@/types/ui";
import {
  getManagementItemLabel,
  isManagementItemActive,
  isManagementItemInactive,
} from "@/utils/management";
import { useLocalSearchParams } from "expo-router";
import { Plus, Search, Upload } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  ConfirmDeactivateDialog,
  CsvImportModal,
  ManagementActionMenu,
  ManagementSnackbar,
} from "../management/ManagementFeedback";
import { ManagementPagination } from "../management/ManagementPagination";
import {
  AccountManagementTable,
  CropManagementTable,
  PlotManagementTable,
} from "../management/ManagementTables";
import { PlotFormSheet } from "../management/PlotFormSheet";
import { AppScreenLayout } from "../shared/AppScreenLayout";
import { BottomSheet } from "../shared/BottomSheet";
import { InputText } from "../shared/InputText";
import { PrimaryButton } from "../shared/PrimaryButton";

export function ManagementScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [variant, setVariant] = useState<ManagementVariant>("plots");
  const [query, setQuery] = useState("");
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [crops, setCrops] = useState<CropTypeInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<ToastState>(null);
  const [formValue, setFormValue] = useState("");
  const [editingPlot, setEditingPlot] = useState<PlotInfo | null>(null);
  const [editingCrop, setEditingCrop] = useState<CropTypeInfo | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    username: "",
    password: "",
  });
  const [plotForm, setPlotForm] = useState({
    code: "",
    zone: "",
    area: "",
    status: "Đang sử dụng",
  });
  const [csvMode, setCsvMode] = useState<CsvImportMode>(null);
  const [csvProgress, setCsvProgress] = useState(60);
  const [importResult, setImportResult] = useState({
    success: 0,
    skipped: 0,
    errors: 0,
  });
  const [confirmItem, setConfirmItem] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = variant === "plots" ? 6 : 7;

  const refresh = useCallback(async () => {
    try {
      const [plotData, cropData, userData] = await Promise.all([
        getPlots(),
        getCropTypes(),
        getUsers(),
      ]);
      setPlots(plotData);
      setCrops(cropData);
      setUsers(userData);
    } catch (error) {
      setSnackbar({
        type: "error",
        message:
          error instanceof Error ? error.message : "Không thể tải dữ liệu.",
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (
      params.tab === "plots" ||
      params.tab === "crops" ||
      params.tab === "accounts"
    ) {
      setVariant(params.tab);
      setPage(1);
    }
  }, [params.tab]);

  useEffect(() => {
    setPage(1);
  }, [query, variant]);

  const title =
    variant === "plots"
      ? "Mã số luống"
      : variant === "crops"
        ? "Loại cây"
        : "Tài khoản";
  const rows =
    variant === "plots" ? plots : variant === "crops" ? crops : users;
  const isAdminAccount = (item: any) =>
    String(item?.role || "").toUpperCase() === "ADMIN";
  const searchPlaceholder =
    variant === "plots"
      ? "Tìm mã luống"
      : variant === "crops"
        ? "Tìm loại cây..."
        : "Tìm kiếm username hoặc mã cấp...";
  const filteredRows = rows.filter((item: any) =>
    [
      item.code,
      item.farmerCode,
      item.name,
      item.username,
      item.email,
      item.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const visibleRows =
    variant === "accounts"
      ? (filteredRows as User[]).filter((item) => !isAdminAccount(item))
      : filteredRows;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
  const notify = (message: string, type: ToastKind = "success") => {
    setSnackbar({ message, type });
  };
  const changeVariant = (nextVariant: ManagementVariant) => {
    setVariant(nextVariant);
    setQuery("");
    setPage(1);
  };
  const closeAddDrawer = () => {
    setAddOpen(false);
    setEditingPlot(null);
    setEditingCrop(null);
    setEditingUser(null);
    setFormValue("");
    setPlotForm({
      code: "",
      zone: "",
      area: "",
      status: "Đang sử dụng",
    });
    setAccountForm({ name: "", username: "", password: "" });
  };
  const openAddDrawer = () => {
    setEditingPlot(null);
    setEditingCrop(null);
    setEditingUser(null);
    setFormValue("");
    setPlotForm({
      code: "",
      zone: "",
      area: "",
      status: "Đang sử dụng",
    });
    setAccountForm({ name: "", username: "", password: "" });
    setAddOpen(true);
  };

  const addItem = async () => {
    try {
      if (variant === "plots") {
        if (!plotForm.code.trim()) return;
        const areaSquareMeters = Number(plotForm.area);
        const payload = {
          code: plotForm.code.trim(),
          name: plotForm.zone.trim() || plotForm.code.trim(),
          ...(Number.isFinite(areaSquareMeters) && areaSquareMeters > 0
            ? { areaSquareMeters }
            : {}),
          isActive: plotForm.status !== "Ngừng sử dụng",
        };
        if (editingPlot) {
          const item = await updatePlot(editingPlot.id, payload);
          setPlots((current) =>
            current.map((plot) => (plot.id === item.id ? item : plot)),
          );
        } else {
          const item = await addPlot(payload);
          setPlots((current) => [item, ...current]);
        }
      } else if (variant === "crops") {
        if (!formValue.trim()) return;
        if (editingCrop) {
          const item = await updateCropType(editingCrop.id, {
            name: formValue.trim(),
            category: editingCrop.category || "Master Data",
          });
          setCrops((current) =>
            current.map((crop) => (crop.id === item.id ? item : crop)),
          );
        } else {
          const item = await addCropType({
            name: formValue.trim(),
            category: "Master Data",
          });
          setCrops((current) => [item, ...current]);
        }
      } else {
        if (
          !accountForm.name.trim() ||
          !accountForm.username.trim() ||
          (!editingUser && !accountForm.password.trim())
        ) {
          return;
        }
        if (editingUser) {
          const item = await updateUser(editingUser.id, {
            name: accountForm.name.trim(),
            username: accountForm.username.trim(),
            ...(accountForm.password.trim()
              ? { password: accountForm.password }
              : {}),
          });
          setUsers((current) =>
            current.map((userItem) =>
              userItem.id === item.id ? item : userItem,
            ),
          );
        } else {
          const item = await addUser({
            name: accountForm.name.trim(),
            username: accountForm.username.trim(),
            password: accountForm.password,
            role: "FARMER",
          });
          setUsers((current) => [item, ...current]);
        }
      }
      notify("Đã cập nhật danh sách.");
      closeAddDrawer();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể cập nhật dữ liệu.",
        "error",
      );
    }
  };

  const openEditSelectedItem = () => {
    if (!actionItem || isManagementItemInactive(actionItem)) {
      setActionItem(null);
      return;
    }

    if (variant === "plots") {
      const plot = actionItem as PlotInfo;
      setEditingPlot(plot);
      setPlotForm({
        code: plot.code || "",
        zone: plot.name || "",
        area: plot.areaSquareMeters ? String(plot.areaSquareMeters) : "",
        status: isManagementItemActive(plot) ? "Đang sử dụng" : "Ngừng sử dụng",
      });
      setActionItem(null);
      setAddOpen(true);
      return;
    }

    if (variant === "crops") {
      const crop = actionItem as CropTypeInfo;
      setEditingCrop(crop);
      setFormValue(crop.name || "");
      setActionItem(null);
      setAddOpen(true);
      return;
    }

    openEditSelectedUser();
  };

  const openEditSelectedUser = () => {
    if (!actionItem || isAdminAccount(actionItem) || actionItem.isRevoked) {
      setActionItem(null);
      return;
    }
    setEditingUser(actionItem as User);
    setAccountForm({
      name: actionItem.name || "",
      username: actionItem.username || "",
      password: "",
    });
    setActionItem(null);
    setAddOpen(true);
  };

  const revokeSelectedUser = async () => {
    if (!actionItem?.id) return;
    try {
      const revoked = await revokeUser(actionItem.id);
      setUsers((current) =>
        current.map((item) => (item.id === revoked.id ? revoked : item)),
      );
      notify("Đã khóa tài khoản farmer.", "warning");
      setActionItem(null);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể khóa tài khoản.",
        "error",
      );
    }
  };

  const openResetPasswordSelectedUser = () => {
    if (!actionItem || isAdminAccount(actionItem) || actionItem.isRevoked) {
      setActionItem(null);
      return;
    }
    setEditingUser(actionItem as User);
    setAccountForm({
      name: actionItem.name || "",
      username: actionItem.username || "",
      password: "",
    });
    setActionItem(null);
    setAddOpen(true);
    notify("Nhập mật khẩu mới rồi bấm Lưu.", "warning");
  };

  const requestDeactivate = () => {
    if (!actionItem || isManagementItemInactive(actionItem)) {
      setActionItem(null);
      return;
    }
    setConfirmItem(actionItem);
    setActionItem(null);
  };

  const activateSelectedItem = async () => {
    if (!actionItem || isManagementItemActive(actionItem)) {
      setActionItem(null);
      return;
    }

    try {
      if (variant === "plots") {
        const item = await updatePlot(actionItem.id, { isActive: true });
        setPlots((current) =>
          current.map((plot) => (plot.id === item.id ? item : plot)),
        );
      }
      if (variant === "crops") {
        const item = await updateCropType(actionItem.id, { isActive: true });
        setCrops((current) =>
          current.map((crop) => (crop.id === item.id ? item : crop)),
        );
      }
      notify("Đã hoạt động lại.", "success");
      setActionItem(null);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Không thể hoạt động lại dữ liệu.",
        "error",
      );
    }
  };

  const deactivateSelectedItem = async () => {
    if (!confirmItem) return;
    try {
      if (variant === "plots") {
        const item = await deactivatePlot(confirmItem.id);
        setPlots((current) =>
          current.map((plot) => (plot.id === item.id ? item : plot)),
        );
      }
      if (variant === "crops") {
        const item = await deactivateCropType(confirmItem.id);
        setCrops((current) =>
          current.map((crop) => (crop.id === item.id ? item : crop)),
        );
      }
      notify("Đã cập nhật trạng thái.", "warning");
      setConfirmItem(null);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái.",
        "error",
      );
    }
  };

  const startCsvImport = () => {
    setCsvProgress(60);
    setCsvMode("loading");
    setTimeout(() => {
      setImportResult({ success: 0, skipped: 0, errors: 1 });
      setCsvMode("result");
      notify("Chưa chọn file CSV hợp lệ.", "error");
    }, 700);
  };

  return (
    <AppScreenLayout
      active="management"
      headerTitle={title}
      managementVariant={variant}
      setManagementVariant={setVariant}
      testID="management-screen"
      overlays={
        <>
          <ManagementActionMenu
            visible={Boolean(actionItem)}
            variant={variant}
            inactive={
              variant !== "accounts" &&
              Boolean(actionItem) &&
              isManagementItemInactive(actionItem)
            }
            onClose={() => setActionItem(null)}
            onEdit={openEditSelectedItem}
            onDeactivate={requestDeactivate}
            onActivate={activateSelectedItem}
            onRevoke={variant === "accounts" ? revokeSelectedUser : undefined}
            onResetPassword={openResetPasswordSelectedUser}
          />
          {variant === "plots" ? (
            <PlotFormSheet
              visible={addOpen}
              value={plotForm}
              onChange={setPlotForm}
              onClose={closeAddDrawer}
              onSubmit={addItem}
              editing={Boolean(editingPlot)}
            />
          ) : (
            <BottomSheet
              visible={addOpen}
              title={`${editingUser || editingCrop ? "Chỉnh sửa" : "Thêm"} ${title}`}
              onClose={closeAddDrawer}
            >
              <TouchableWithoutFeedback
                accessible={false}
                onPress={Keyboard.dismiss}
              >
                <ScrollView
                  contentContainerStyle={
                    managementScreenStyles.managementEditDrawerContent
                  }
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {variant === "accounts" ? (
                    <>
                      <InputText
                        containerStyle={managementScreenStyles.drawerFieldStack}
                        label="Tên farmer"
                        value={accountForm.name}
                        onChangeText={(name) =>
                          setAccountForm((current) => ({ ...current, name }))
                        }
                        placeholder="Nhập tên farmer"
                      />
                      <InputText
                        autoCapitalize="none"
                        containerStyle={managementScreenStyles.drawerFieldStack}
                        label="Username đăng nhập"
                        value={accountForm.username}
                        onChangeText={(username) =>
                          setAccountForm((current) => ({
                            ...current,
                            username,
                          }))
                        }
                        placeholder="vd: farmer01"
                      />
                      <InputText
                        containerStyle={managementScreenStyles.drawerFieldStack}
                        label="Mật khẩu tạm thời"
                        value={accountForm.password}
                        onChangeText={(password) =>
                          setAccountForm((current) => ({
                            ...current,
                            password,
                          }))
                        }
                        secureTextEntry
                        placeholder={
                          editingUser
                            ? "Để trống nếu không đổi"
                            : "Nhập mật khẩu"
                        }
                      />
                    </>
                  ) : (
                    <InputText
                      containerStyle={managementScreenStyles.drawerFieldStack}
                      label={title}
                      value={formValue}
                      onChangeText={setFormValue}
                      placeholder={`Nhập ${title.toLowerCase()}`}
                    />
                  )}
                  <PrimaryButton
                    label="Lưu"
                    onPress={addItem}
                    disabled={
                      variant === "accounts"
                        ? !accountForm.name.trim() ||
                          !accountForm.username.trim() ||
                          (!editingUser && !accountForm.password.trim())
                        : !formValue.trim()
                    }
                  />
                </ScrollView>
              </TouchableWithoutFeedback>
            </BottomSheet>
          )}
          <CsvImportModal
            mode={csvMode}
            progress={csvProgress}
            result={importResult}
            onClose={() => setCsvMode(null)}
            onStart={startCsvImport}
          />
          <ConfirmDeactivateDialog
            visible={Boolean(confirmItem)}
            itemLabel={getManagementItemLabel(confirmItem, variant)}
            variant={variant}
            onCancel={() => setConfirmItem(null)}
            onConfirm={deactivateSelectedItem}
          />
          <ManagementSnackbar
            toast={snackbar}
            onClose={() => setSnackbar(null)}
          />
        </>
      }
    >
      <View
        style={[
          managementScreenStyles.managementHeader,
          variant === "accounts" &&
            managementScreenStyles.managementHeaderAccounts,
        ]}
      >
        <View
          style={[
            managementScreenStyles.searchBoxWide,
            variant === "accounts" &&
              managementScreenStyles.managementAccountSearch,
          ]}
        >
          <Search size={20} color={COLORS.muted} />
          <InputText
            containerStyle={{ flex: 1 }}
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            style={managementScreenStyles.searchInput}
            variant="plain"
          />
        </View>
        <View style={managementScreenStyles.toolbar}>
          <Pressable
            style={managementScreenStyles.importButton}
            onPress={() => setCsvMode("select")}
          >
            <Upload size={16} color={COLORS.green} />
            <Text style={managementScreenStyles.importText}>Import CSV</Text>
          </Pressable>
          <Pressable
            style={managementScreenStyles.addButton}
            onPress={openAddDrawer}
          >
            <Plus size={16} color="#fff" />
            <Text style={managementScreenStyles.addText}>Thêm mới</Text>
          </Pressable>
        </View>
      </View>
      <View style={managementScreenStyles.managementHiddenTabs}>
        {(["plots", "crops", "accounts"] as const).map((id) => (
          <Pressable
            key={id}
            testID={`admin-${id}`}
            onPress={() => changeVariant(id)}
            style={managementScreenStyles.managementHiddenTab}
          >
            <Text>
              {id === "plots"
                ? "Mã số luống"
                : id === "crops"
                  ? "Loại cây"
                  : "Tài khoản"}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        style={managementScreenStyles.managementList}
        contentContainerStyle={managementScreenStyles.managementListContent}
        keyboardShouldPersistTaps="handled"
      >
        {variant === "plots" ? (
          <PlotManagementTable
            rows={pagedRows as PlotInfo[]}
            total={visibleRows.length}
            onAction={setActionItem}
          />
        ) : variant === "crops" ? (
          <CropManagementTable
            rows={pagedRows as CropTypeInfo[]}
            total={visibleRows.length}
            onAction={setActionItem}
          />
        ) : (
          <AccountManagementTable
            rows={pagedRows as User[]}
            total={visibleRows.length}
            pageStart={(safePage - 1) * pageSize}
            onAction={setActionItem}
          />
        )}
      </ScrollView>
      <ManagementPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={visibleRows.length}
        onPageChange={setPage}
      />
    </AppScreenLayout>
  );
}

const managementScreenStyles = StyleSheet.create({
  managementHeader: {
    paddingHorizontal: 35,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  managementHeaderAccounts: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  managementAccountSearch: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchBoxWide: {
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.field,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.body,
    fontSize: 14,
    padding: 0,
  },
  toolbar: {
    flexDirection: "row",
    gap: 12,
  },
  importButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  importText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
  },
  addButton: {
    flex: 1.28,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  managementList: {
    flex: 1,
  },
  managementListContent: {
    paddingHorizontal: 35,
    paddingTop: 12,
    paddingBottom: 170,
  },
  managementHiddenTabs: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  managementHiddenTab: {
    width: 1,
    height: 1,
  },
  drawerFieldStack: {
    marginBottom: 16,
  },
  managementEditDrawerContent: {
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
});
