import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  addCropType,
  addPlantDisease,
  addPlot,
  addUser,
  getCropTypes,
  getPlantDiseases,
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
  autoMatchFields,
  parseCsvContent,
  pickCsvFile,
  SYSTEM_FIELDS_BY_VARIANT,
  type ParsedCsv,
} from "@/utils/csvHelper";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [selectedDiseaseGroup, setSelectedDiseaseGroup] =
    useState<PlantDiseaseGroup>("Truyền nhiễm");
  const [variant, setVariant] = useState<ManagementVariant>("plots");
  const [query, setQuery] = useState("");
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [crops, setCrops] = useState<CropTypeInfo[]>([]);
  const [plantDiseases, setPlantDiseases] = useState<PlantDiseaseInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cropIconPickerOpen, setCropIconPickerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<ToastState>(null);
  const [cropForm, setCropForm] = useState({ name: "", icon: "" });
  const [diseaseGroupPickerOpen, setDiseaseGroupPickerOpen] = useState(false);
  const [diseaseTypePickerOpen, setDiseaseTypePickerOpen] = useState(false);
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

  const refresh = useCallback(async () => {
    try {
      const [plotData, cropData, diseaseData, userData] = await Promise.all([
        getPlots(),
        getCropTypes(),
        getPlantDiseases(),
        getUsers(),
      ]);
      setPlots(plotData);
      setCrops(cropData);
      setPlantDiseases(diseaseData);
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

  const filteredDiseases = useMemo(() => {
    return plantDiseases.filter((item) => {
      const matchGroup = item.group === selectedDiseaseGroup;
      const matchQuery = query.trim()
        ? [item.type, item.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        : true;
      return matchGroup && matchQuery;
    });
  }, [plantDiseases, selectedDiseaseGroup, query]);

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
          ? "Tìm loại hoặc tên bệnh..."
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
      : variant === "diseases"
        ? filteredDiseases
        : filteredRows;
  const cropIconOptions = useMemo(() => {
    const existingIcons = crops
      .map((crop) => crop.icon?.trim())
      .filter((icon): icon is string => Boolean(icon));

    return Array.from(
      new Set([...existingIcons, ...DEFAULT_CROP_ICON_OPTIONS]),
    );
  }, [crops]);
  const availableDiseaseTypes = useMemo(() => {
    const DEFAULT_DISEASE_TYPES = [
      "Nấm",
      "Vi khuẩn",
      "Tuyến trùng",
      "Thiếu dinh dưỡng",
      "Virus",
    ];
    const existingTypes = plantDiseases
      .map((item) => item.type?.trim())
      .filter((type): type is string => Boolean(type));

    return Array.from(new Set([...existingTypes, ...DEFAULT_DISEASE_TYPES]));
  }, [plantDiseases]);
  const totalItems = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
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
    setCropIconPickerOpen(false);
    setDiseaseGroupPickerOpen(false);
    setDiseaseTypePickerOpen(false);
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
    setDiseaseTypePickerOpen(false);
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
        } else {
          await addPlantDisease(payload);
          setPage(1);
        }
        const updatedDiseases = await getPlantDiseases();
        setPlantDiseases(updatedDiseases);
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
      setDiseaseGroupPickerOpen(false);
      setDiseaseTypePickerOpen(false);
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

  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  const handlePickCsvFile = async () => {
    try {
      const fileResult = await pickCsvFile();
      if (!fileResult) {
        return;
      }

      const parsed = parseCsvContent(fileResult.content, fileResult.name);
      if (!parsed.headers.length || !parsed.rows.length) {
        notify("File CSV rỗng hoặc không có dữ liệu.", "error");
        return;
      }

      setParsedCsv(parsed);
      const autoMatched = autoMatchFields(parsed.headers, variant);
      setFieldMapping(autoMatched);
      setCsvMode("mapping");
    } catch (err: any) {
      notify(err?.message || "Không thể đọc file CSV.", "error");
    }
  };

  const executeCsvImport = async () => {
    if (!parsedCsv || !fieldMapping) return;

    const fields = SYSTEM_FIELDS_BY_VARIANT[variant] || [];
    const missingRequired = fields.filter(
      (f) => f.required && !fieldMapping[f.key],
    );
    if (missingRequired.length > 0) {
      notify(
        `Vui lòng chọn cột tương ứng cho: ${missingRequired.map((f) => f.label).join(", ")}`,
        "error",
      );
      return;
    }

    setCsvMode("loading");
    setCsvProgress(5);

    let success = 0;
    let skipped = 0;
    let errors = 0;
    const total = parsedCsv.rows.length;

    for (let i = 0; i < total; i++) {
      const row = parsedCsv.rows[i];
      try {
        if (variant === "plots") {
          const code = row[fieldMapping.code]?.trim();
          const name = row[fieldMapping.name]?.trim() || code;
          const rawArea = row[fieldMapping.areaSquareMeters]?.trim();
          const areaSquareMeters = rawArea ? Number(rawArea) : undefined;
          const description = row[fieldMapping.description]?.trim();

          if (!code) {
            skipped++;
          } else {
            await addPlot({
              code,
              name,
              areaSquareMeters:
                typeof areaSquareMeters === "number" && !isNaN(areaSquareMeters)
                  ? areaSquareMeters
                  : undefined,
              description,
              isActive: true,
            });
            success++;
          }
        } else if (variant === "crops") {
          const name = row[fieldMapping.name]?.trim();
          const category = row[fieldMapping.category]?.trim() || "Rau màu";

          if (!name) {
            skipped++;
          } else {
            await addCropType({ name, category, isActive: true });
            success++;
          }
        } else if (variant === "diseases") {
          const name = row[fieldMapping.name]?.trim();
          const rawGroup = row[fieldMapping.group]?.trim() || "";
          const group: PlantDiseaseGroup = rawGroup.includes("Không")
            ? "Không truyền nhiễm"
            : "Truyền nhiễm";
          const type = row[fieldMapping.type]?.trim() || "Bệnh lá";
          const description = row[fieldMapping.description]?.trim();

          if (!name) {
            skipped++;
          } else {
            await addPlantDisease({
              name,
              group,
              type,
              description,
              isActive: true,
            });
            success++;
          }
        } else if (variant === "accounts") {
          const name = row[fieldMapping.name]?.trim();
          const username = row[fieldMapping.username]?.trim();

          if (!name || !username) {
            skipped++;
          } else {
            await addUser({ name, username, role: "farmer", password: "123" });
            success++;
          }
        }
      } catch {
        errors++;
      }

      setCsvProgress(Math.round(((i + 1) / total) * 100));
    }

    try {
      if (variant === "plots") {
        const updatedPlots = await getPlots();
        setPlots(updatedPlots);
      } else if (variant === "crops") {
        const updatedCrops = await getCropTypes();
        setCrops(updatedCrops);
      } else if (variant === "diseases") {
        const updatedDiseases = await getPlantDiseases();
        setPlantDiseases(updatedDiseases);
      } else if (variant === "accounts") {
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
      }
    } catch {
      // ignore
    }

    setImportResult({ success, skipped, errors });
    setCsvMode("result");
    notify(`Đã import xong ${success} bản ghi.`, "success");
  };

  const canEditActionItem = useMemo(() => {
    if (!actionItem || variant === "accounts") return true;
    if (!actionItem.createdByAdminId) return false;
    return Boolean(user && String(actionItem.createdByAdminId) === user.id);
  }, [actionItem, variant, user]);

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
            canEdit={canEditActionItem}
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
                    : diseaseTypePickerOpen
                      ? "Chọn loại bệnh cây"
                      : `${editingUser || editingCrop || editingDisease ? "Chỉnh sửa" : "Thêm"} ${title}`
              }
              onClose={
                cropIconPickerOpen
                  ? () => setCropIconPickerOpen(false)
                  : diseaseGroupPickerOpen
                    ? () => setDiseaseGroupPickerOpen(false)
                    : diseaseTypePickerOpen
                      ? () => setDiseaseTypePickerOpen(false)
                      : closeAddDrawer
              }
              full={
                cropIconPickerOpen ||
                diseaseGroupPickerOpen ||
                diseaseTypePickerOpen
              }
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
                ) : diseaseTypePickerOpen ? (
                  <ScrollView
                    contentContainerStyle={
                      managementScreenStyles.managementEditDrawerContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <InputText
                      containerStyle={managementScreenStyles.drawerFieldStack}
                      label="Điền mới loại bệnh cây"
                      value={diseaseForm.type}
                      onChangeText={(type) =>
                        setDiseaseForm((current) => ({
                          ...current,
                          type,
                        }))
                      }
                      placeholder="vd: Nấm, Vi khuẩn, Thiếu dinh dưỡng..."
                    />
                    <Text style={managementScreenStyles.pickerSectionHeader}>
                      Hoặc chọn loại bệnh cây có sẵn:
                    </Text>
                    {availableDiseaseTypes.map((type) => {
                      const selected = diseaseForm.type === type;
                      return (
                        <Pressable
                          key={type}
                          style={[
                            managementScreenStyles.diseaseGroupOption,
                            selected &&
                              managementScreenStyles.diseaseGroupOptionActive,
                          ]}
                          onPress={() => {
                            setDiseaseForm((current) => ({
                              ...current,
                              type,
                            }));
                            setDiseaseTypePickerOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              managementScreenStyles.diseaseGroupOptionText,
                              selected &&
                                managementScreenStyles.diseaseGroupOptionTextActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <PrimaryButton
                      label="Xác nhận"
                      onPress={() => setDiseaseTypePickerOpen(false)}
                    />
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
                        <InputSelection
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Loại bệnh cây"
                          value={diseaseForm.type}
                          placeholder="Chọn loại bệnh cây"
                          onPress={() => setDiseaseTypePickerOpen(true)}
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
                    <View style={managementScreenStyles.drawerFooterRow}>
                      <Pressable
                        style={managementScreenStyles.drawerCancelButton}
                        onPress={closeAddDrawer}
                      >
                        <Text style={managementScreenStyles.drawerCancelText}>
                          Hủy
                        </Text>
                      </Pressable>
                      <View style={{ flex: 1 }}>
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
                      </View>
                    </View>
                  </ScrollView>
                )}
              </TouchableWithoutFeedback>
            </BottomSheet>
          )}
          <CsvImportModal
            mode={csvMode}
            variant={variant}
            parsedCsv={parsedCsv}
            fieldMapping={fieldMapping}
            onFieldMappingChange={(systemKey, csvHeader) => {
              setFieldMapping((prev) => ({ ...prev, [systemKey]: csvHeader }));
            }}
            progress={csvProgress}
            result={importResult}
            onClose={() => setCsvMode(null)}
            onStart={handlePickCsvFile}
            onConfirmImport={executeCsvImport}
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
        contentContainerStyle={[
          managementScreenStyles.managementListContent,
          { paddingBottom: 130 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {variant === "diseases" ? (
          <View style={managementScreenStyles.diseaseGroupSegmentContainer}>
            {(["Truyền nhiễm", "Không truyền nhiễm"] as const).map((group) => {
              const active = selectedDiseaseGroup === group;
              return (
                <Pressable
                  key={group}
                  style={[
                    managementScreenStyles.diseaseGroupSegmentButton,
                    active &&
                      managementScreenStyles.diseaseGroupSegmentButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedDiseaseGroup(group);
                    setPage(1);
                  }}
                >
                  <Text
                    style={[
                      managementScreenStyles.diseaseGroupSegmentText,
                      active &&
                        managementScreenStyles.diseaseGroupSegmentTextActive,
                    ]}
                  >
                    {group}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
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
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  managementHeaderAccounts: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  managementAccountSearch: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchBoxWide: {
    height: 42,
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
  diseaseGroupSegmentContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  diseaseGroupSegmentButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  diseaseGroupSegmentButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  diseaseGroupSegmentText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  diseaseGroupSegmentTextActive: {
    color: COLORS.green,
    fontWeight: "700",
  },
  quickChipsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  quickChipsLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "500",
  },
  quickChipsMoreText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: "600",
  },
  quickChipsScroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#f9fafb",
  },
  quickChipSelected: {
    borderColor: COLORS.green,
    backgroundColor: "#f0f8ed",
  },
  quickChipText: {
    fontSize: 12,
    color: COLORS.body,
    fontWeight: "500",
  },
  quickChipTextSelected: {
    color: COLORS.green,
    fontWeight: "700",
  },
  pickerSectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.body,
    marginTop: 12,
    marginBottom: 8,
  },
  diseaseTypeOptionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  diseaseTypeOptionCard: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diseaseTypeOptionCardActive: {
    borderColor: COLORS.green,
    backgroundColor: "#f0f8ed",
  },
  diseaseTypeOptionText: {
    color: COLORS.body,
    fontSize: TYPOGRAPHY.label,
    fontWeight: "500",
  },
  diseaseTypeOptionTextActive: {
    color: COLORS.green,
    fontWeight: "700",
  },
  drawerFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  drawerCancelButton: {
    width: 100,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCancelText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "600",
  },
});
