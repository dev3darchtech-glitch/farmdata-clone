import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import {
  addCropType,
  addPlantDisease,
  addPlot,
  addUser,
  getCropTypes,
  getPlantDiseasesPage,
  getPlots,
  getUsers,
  restoreUser,
  revokeUser,
  setCropTypeActiveStatus,
  setPlantDiseaseActiveStatus,
  setPlotActiveStatus,
  updateCropType,
  updatePlantDisease,
  updatePlot,
  updateUser,
} from "@/services/adminService";
import {
  CropTypeInfo,
  PlantDiseaseGroup,
  PlantDiseaseInfo,
  PlotInfo,
  User,
} from "@/types";
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
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  ConfirmStatusDialog,
  CsvImportModal,
  ManagementActionMenu,
  ManagementSnackbar,
} from "../management/ManagementFeedback";
import { ManagementPagination } from "../management/ManagementPagination";
import {
  AccountManagementTable,
  CropManagementTable,
  PlantDiseaseManagementTable,
  PlotManagementTable,
} from "../management/ManagementTables";
import { PlotFormSheet } from "../management/PlotFormSheet";
import { AppScreenLayout } from "../shared/AppScreenLayout";
import { BottomSheet } from "../shared/BottomSheet";
import { InputSelection } from "../shared/InputSelection";
import { InputText } from "../shared/InputText";
import { PrimaryButton } from "../shared/PrimaryButton";

const DEFAULT_CROP_ICON_OPTIONS = [
  "🌱",
  "🌿",
  "☘️",
  "🍀",
  "🪴",
  "🎋",
  "🌾",
  "🌵",
  "🌲",
  "🌳",
  "🌴",
  "🍄",
  "🍄‍🟫",
  "🌷",
  "🌹",
  "🥀",
  "🪷",
  "🌺",
  "🌸",
  "🌼",
  "🌻",
  "🍇",
  "🍉",
  "🍅",
  "🍈",
  "🍊",
  "🍋",
  "🍋‍🟩",
  "🍌",
  "🍍",
  "🥭",
  "🍎",
  "🍏",
  "🍐",
  "🍑",
  "🍒",
  "🍓",
  "🫐",
  "🥝",
  "🫒",
  "🥥",
  "🥑",
  "🥦",
  "🫑",
  "🌶️",
  "🥕",
  "🥬",
  "🧅",
  "🧄",
  "🥔",
  "🍠",
  "🍆",
  "🥒",
  "🌽",
  "🫛",
  "🫘",
  "🥜",
  "🌰",
  "🫚",
] as const;

const PLANT_DISEASE_GROUP_OPTIONS: PlantDiseaseGroup[] = [
  "Truyền nhiễm",
  "Không truyền nhiễm",
];
const PLOT_PAGE_SIZE = 6;
const PLANT_DISEASE_PAGE_SIZE = 5;
const DEFAULT_PAGE_SIZE = 7;

export function ManagementScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [variant, setVariant] = useState<ManagementVariant>("plots");
  const [query, setQuery] = useState("");
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [crops, setCrops] = useState<CropTypeInfo[]>([]);
  const [plantDiseases, setPlantDiseases] = useState<PlantDiseaseInfo[]>([]);
  const [plantDiseaseTotal, setPlantDiseaseTotal] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cropIconPickerOpen, setCropIconPickerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<ToastState>(null);
  const [cropForm, setCropForm] = useState({ name: "", icon: "" });
  const [diseaseGroupPickerOpen, setDiseaseGroupPickerOpen] = useState(false);
  const [diseaseForm, setDiseaseForm] = useState<{
    group: PlantDiseaseGroup;
    type: string;
    name: string;
  }>({
    group: "Truyền nhiễm",
    type: "",
    name: "",
  });
  const [editingPlot, setEditingPlot] = useState<PlotInfo | null>(null);
  const [editingCrop, setEditingCrop] = useState<CropTypeInfo | null>(null);
  const [editingDisease, setEditingDisease] = useState<PlantDiseaseInfo | null>(
    null,
  );
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
  const pageSize =
    variant === "plots"
      ? PLOT_PAGE_SIZE
      : variant === "diseases"
        ? PLANT_DISEASE_PAGE_SIZE
        : DEFAULT_PAGE_SIZE;

  const loadPlantDiseasePage = useCallback(
    async (nextPage: number, nextQuery: string) => {
      try {
        const diseaseData = await getPlantDiseasesPage({
          page: nextPage,
          limit: PLANT_DISEASE_PAGE_SIZE,
          query: nextQuery,
        });
        setPlantDiseases(diseaseData.items);
        setPlantDiseaseTotal(diseaseData.total);
      } catch (error) {
        setSnackbar({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách bệnh cây.",
        });
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const [plotData, cropData, diseaseData, userData] = await Promise.all([
        getPlots(),
        getCropTypes(),
        getPlantDiseasesPage({
          page: 1,
          limit: PLANT_DISEASE_PAGE_SIZE,
          query: "",
        }),
        getUsers(),
      ]);
      setPlots(plotData);
      setCrops(cropData);
      setPlantDiseases(diseaseData.items);
      setPlantDiseaseTotal(diseaseData.total);
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
      params.tab === "diseases" ||
      params.tab === "accounts"
    ) {
      setVariant(params.tab);
      setPage(1);
    }
  }, [params.tab]);

  useEffect(() => {
    setPage(1);
  }, [query, variant]);

  useEffect(() => {
    if (variant === "diseases") {
      void loadPlantDiseasePage(page, query);
    }
  }, [loadPlantDiseasePage, page, query, variant]);

  const title =
    variant === "plots"
      ? "Mã số luống"
      : variant === "crops"
        ? "Loại cây"
        : variant === "diseases"
          ? "Bệnh cây"
          : "Tài khoản";
  const rows =
    variant === "plots"
      ? plots
      : variant === "crops"
        ? crops
        : variant === "diseases"
          ? plantDiseases
          : users;
  const isAdminAccount = (item: any) =>
    String(item?.role || "").toUpperCase() === "ADMIN";
  const searchPlaceholder =
    variant === "plots"
      ? "Tìm mã luống"
      : variant === "crops"
        ? "Tìm loại cây..."
        : variant === "diseases"
          ? "Tìm nhóm, loại hoặc tên bệnh..."
          : "Tìm kiếm username...";
  const filteredRows = rows.filter((item: any) =>
    variant === "diseases"
      ? true
      : [
          item.code,
          item.farmerCode,
          item.name,
          item.username,
          item.email,
          item.category,
          item.group,
          item.type,
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
  const cropIconOptions = useMemo(() => {
    const existingIcons = crops
      .map((crop) => crop.icon?.trim())
      .filter((icon): icon is string => Boolean(icon));

    return Array.from(
      new Set([...existingIcons, ...DEFAULT_CROP_ICON_OPTIONS]),
    );
  }, [crops]);
  const totalItems =
    variant === "diseases" ? plantDiseaseTotal : visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice(
    variant === "diseases" ? 0 : (safePage - 1) * pageSize,
    variant === "diseases" ? visibleRows.length : safePage * pageSize,
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
    setCropIconPickerOpen(false);
    setDiseaseGroupPickerOpen(false);
    setEditingPlot(null);
    setEditingCrop(null);
    setEditingDisease(null);
    setEditingUser(null);
    setCropForm({ name: "", icon: "" });
    setDiseaseForm({ group: "Truyền nhiễm", type: "", name: "" });
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
    setEditingDisease(null);
    setEditingUser(null);
    setCropForm({ name: "", icon: "" });
    setDiseaseGroupPickerOpen(false);
    setDiseaseForm({ group: "Truyền nhiễm", type: "", name: "" });
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
        if (!cropForm.name.trim()) return;
        if (editingCrop) {
          const item = await updateCropType(editingCrop.id, {
            name: cropForm.name.trim(),
            category: editingCrop.category || "Master Data",
            icon: cropForm.icon.trim() || undefined,
          });
          setCrops((current) =>
            current.map((crop) => (crop.id === item.id ? item : crop)),
          );
        } else {
          const item = await addCropType({
            name: cropForm.name.trim(),
            category: "Master Data",
            icon: cropForm.icon.trim() || undefined,
          });
          setCrops((current) => [item, ...current]);
        }
      } else if (variant === "diseases") {
        if (!diseaseForm.type.trim() || !diseaseForm.name.trim()) return;
        const payload = {
          group: diseaseForm.group,
          type: diseaseForm.type.trim(),
          name: diseaseForm.name.trim(),
        };
        if (editingDisease) {
          await updatePlantDisease(editingDisease.id, payload);
          await loadPlantDiseasePage(safePage, query);
        } else {
          await addPlantDisease(payload);
          setPage(1);
          await loadPlantDiseasePage(1, query);
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
    if (!actionItem) {
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
      setCropForm({ name: crop.name || "", icon: crop.icon || "" });
      setActionItem(null);
      setAddOpen(true);
      return;
    }

    if (variant === "diseases") {
      const disease = actionItem as PlantDiseaseInfo;
      setEditingDisease(disease);
      setDiseaseForm({
        group: disease.group || "Truyền nhiễm",
        type: disease.type || "",
        name: disease.name || "",
      });
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

  const restoreSelectedUser = async () => {
    if (!actionItem?.id) return;
    try {
      const restored = await restoreUser(actionItem.id);
      setUsers((current) =>
        current.map((item) => (item.id === restored.id ? restored : item)),
      );
      notify("Đã mở khóa tài khoản farmer.");
      setActionItem(null);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể mở khóa tài khoản.",
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

  const requestStatusChange = () => {
    if (!actionItem || variant === "accounts") {
      setActionItem(null);
      return;
    }
    setConfirmItem(actionItem);
    setActionItem(null);
  };

  const updateSelectedItemStatus = async () => {
    if (!confirmItem) return;
    const nextIsActive = isManagementItemInactive(confirmItem);

    try {
      if (variant === "plots") {
        const item = await setPlotActiveStatus(confirmItem.id, nextIsActive);
        setPlots((current) =>
          current.map((plot) => (plot.id === item.id ? item : plot)),
        );
      }
      if (variant === "crops") {
        const item = await setCropTypeActiveStatus(
          confirmItem.id,
          nextIsActive,
        );
        setCrops((current) =>
          current.map((crop) => (crop.id === item.id ? item : crop)),
        );
      }
      if (variant === "diseases") {
        const item = await setPlantDiseaseActiveStatus(
          confirmItem.id,
          nextIsActive,
        );
        setPlantDiseases((current) =>
          current.map((disease) => (disease.id === item.id ? item : disease)),
        );
      }
      notify(
        nextIsActive ? "Đã hoạt động lại." : "Đã cập nhật trạng thái.",
        nextIsActive ? "success" : "warning",
      );
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
              Boolean(actionItem) &&
              (variant === "accounts"
                ? Boolean(actionItem.isRevoked)
                : isManagementItemInactive(actionItem))
            }
            onClose={() => setActionItem(null)}
            onEdit={openEditSelectedItem}
            onDeactivate={requestStatusChange}
            onActivate={requestStatusChange}
            onRevoke={variant === "accounts" ? revokeSelectedUser : undefined}
            onRestore={variant === "accounts" ? restoreSelectedUser : undefined}
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
              title={
                cropIconPickerOpen
                  ? "Chọn Icon"
                  : diseaseGroupPickerOpen
                    ? "Chọn nhóm bệnh cây"
                    : `${editingUser || editingCrop || editingDisease ? "Chỉnh sửa" : "Thêm"} ${title}`
              }
              onClose={
                cropIconPickerOpen
                  ? () => setCropIconPickerOpen(false)
                  : diseaseGroupPickerOpen
                    ? () => setDiseaseGroupPickerOpen(false)
                    : closeAddDrawer
              }
              full={cropIconPickerOpen || diseaseGroupPickerOpen}
            >
              <TouchableWithoutFeedback
                accessible={false}
                onPress={Keyboard.dismiss}
              >
                {cropIconPickerOpen ? (
                  <ScrollView
                    contentContainerStyle={managementScreenStyles.cropIconGrid}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {cropIconOptions.map((icon) => {
                      const selected = cropForm.icon === icon;
                      return (
                        <Pressable
                          key={icon}
                          style={[
                            managementScreenStyles.cropIconOption,
                            selected &&
                              managementScreenStyles.cropIconOptionActive,
                          ]}
                          onPress={() => {
                            setCropForm((current) => ({ ...current, icon }));
                            setCropIconPickerOpen(false);
                          }}
                        >
                          <Text
                            style={managementScreenStyles.cropIconOptionText}
                          >
                            {icon}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : diseaseGroupPickerOpen ? (
                  <ScrollView
                    contentContainerStyle={
                      managementScreenStyles.managementEditDrawerContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {PLANT_DISEASE_GROUP_OPTIONS.map((group) => {
                      const selected = diseaseForm.group === group;
                      return (
                        <Pressable
                          key={group}
                          style={[
                            managementScreenStyles.diseaseGroupOption,
                            selected &&
                              managementScreenStyles.diseaseGroupOptionActive,
                          ]}
                          onPress={() => {
                            setDiseaseForm((current) => ({
                              ...current,
                              group,
                            }));
                            setDiseaseGroupPickerOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              managementScreenStyles.diseaseGroupOptionText,
                              selected &&
                                managementScreenStyles.diseaseGroupOptionTextActive,
                            ]}
                          >
                            {group}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
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
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Tên farmer"
                          value={accountForm.name}
                          onChangeText={(name) =>
                            setAccountForm((current) => ({ ...current, name }))
                          }
                          placeholder="Nhập tên farmer"
                        />
                        <InputText
                          autoCapitalize="none"
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
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
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
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
                    ) : variant === "diseases" ? (
                      <>
                        <InputSelection
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Nhóm bệnh cây"
                          value={diseaseForm.group}
                          placeholder="Chọn nhóm bệnh cây"
                          onPress={() => setDiseaseGroupPickerOpen(true)}
                        />
                        <InputText
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Loại bệnh cây"
                          value={diseaseForm.type}
                          onChangeText={(type) =>
                            setDiseaseForm((current) => ({
                              ...current,
                              type,
                            }))
                          }
                          placeholder="vd: Nấm, Vi khuẩn, Thiếu dinh dưỡng"
                        />
                        <InputText
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Tên bệnh cây"
                          value={diseaseForm.name}
                          onChangeText={(name) =>
                            setDiseaseForm((current) => ({
                              ...current,
                              name,
                            }))
                          }
                          placeholder="vd: Sương mai"
                        />
                      </>
                    ) : (
                      <>
                        <InputText
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label={title}
                          value={cropForm.name}
                          onChangeText={(name) =>
                            setCropForm((current) => ({ ...current, name }))
                          }
                          placeholder={`Nhập ${title.toLowerCase()}`}
                        />
                        <InputSelection
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Chọn Icon"
                          value={cropForm.icon}
                          placeholder="Chọn icon loại cây"
                          onPress={() => setCropIconPickerOpen(true)}
                        />
                      </>
                    )}
                    <PrimaryButton
                      label="Lưu"
                      onPress={addItem}
                      disabled={
                        variant === "accounts"
                          ? !accountForm.name.trim() ||
                            !accountForm.username.trim() ||
                            (!editingUser && !accountForm.password.trim())
                          : variant === "diseases"
                            ? !diseaseForm.type.trim() ||
                              !diseaseForm.name.trim()
                            : !cropForm.name.trim()
                      }
                    />
                  </ScrollView>
                )}
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
          <ConfirmStatusDialog
            visible={Boolean(confirmItem)}
            itemLabel={getManagementItemLabel(confirmItem, variant)}
            isActivating={
              Boolean(confirmItem) && isManagementItemInactive(confirmItem)
            }
            variant={variant}
            onCancel={() => setConfirmItem(null)}
            onConfirm={updateSelectedItemStatus}
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
        {(["plots", "crops", "diseases", "accounts"] as const).map((id) => (
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
                  : id === "diseases"
                    ? "Bệnh cây"
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
        ) : variant === "diseases" ? (
          <PlantDiseaseManagementTable
            rows={pagedRows as PlantDiseaseInfo[]}
            total={totalItems}
            onAction={setActionItem}
          />
        ) : (
          <AccountManagementTable
            rows={pagedRows as User[]}
            total={visibleRows.length}
            onAction={setActionItem}
          />
        )}
      </ScrollView>
      <ManagementPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
      />
    </AppScreenLayout>
  );
}

const managementScreenStyles = StyleSheet.create({
  managementHeader: {
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    paddingBottom: LAYOUT.sectionGap,
    gap: LAYOUT.sectionGap,
  },
  managementHeaderAccounts: {
    paddingTop: LAYOUT.screenTop,
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
    fontSize: TYPOGRAPHY.label,
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
    fontSize: TYPOGRAPHY.label,
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
    fontSize: TYPOGRAPHY.label,
    fontWeight: "700",
  },
  managementList: {
    flex: 1,
  },
  managementListContent: {
    paddingHorizontal: LAYOUT.screenX,
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
    marginBottom: LAYOUT.sectionGap,
  },
  managementEditDrawerContent: {
    paddingTop: 4,
    paddingBottom: 72,
  },
  cropIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 4,
    paddingBottom: LAYOUT.sheetBottom,
  },
  cropIconOption: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cropIconOptionActive: {
    borderColor: COLORS.green,
    backgroundColor: "#f0f8ed",
  },
  cropIconOptionText: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 28,
    textAlign: "center",
  },
  diseaseGroupOption: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    marginBottom: 12,
  },
  diseaseGroupOptionActive: {
    borderColor: COLORS.green,
    backgroundColor: "#f0f8ed",
  },
  diseaseGroupOptionText: {
    color: COLORS.body,
    fontSize: TYPOGRAPHY.label,
    fontWeight: "600",
    lineHeight: 20,
  },
  diseaseGroupOptionTextActive: {
    color: COLORS.green,
  },
});
