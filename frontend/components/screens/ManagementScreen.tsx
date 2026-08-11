import { COLORS, LAYOUT, TYPOGRAPHY } from "@/constants/theme";
import {
  addCropType,
  addFarm,
  addPlantDisease,
  addPlot,
  addUser,
  deleteCropType,
  deleteFarm,
  deletePlantDisease,
  deletePlantDiseaseGroup,
  deletePlantDiseaseType,
  deletePlot,
  deleteUser,
  getCropTypesPage,
  getFarms,
  getFarmsPage,
  getPlantDiseases,
  getPlantDiseasesPage,
  getPlotsPage,
  getUsersPage,
  renamePlantDiseaseGroup,
  renamePlantDiseaseType,
  restoreUser,
  revokeUser,
  setCropTypeActiveStatus,
  setFarmActiveStatus,
  setPlantDiseaseActiveStatus,
  setPlotActiveStatus,
  updateCropType,
  updateFarm,
  updatePlantDisease,
  updatePlot,
  updateUser,
} from "@/services/adminService";
import {
  CropTypeInfo,
  FarmInfo,
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
import {
  Check,
  Edit2,
  Plus,
  Search,
  Sliders,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_CROP_ICON_OPTIONS,
  DEFAULT_DISEASE_TYPES,
} from "@/types/constants";
import {
  ConfirmDeleteDialog,
  ConfirmStatusDialog,
  CsvImportModal,
  ManagementActionMenu,
  ManagementSnackbar,
} from "../management/ManagementFeedback";
import { ManagementPagination } from "../management/ManagementPagination";
import {
  AccountManagementTable,
  CropManagementTable,
  FarmManagementTable,
  PlantDiseaseManagementTable,
  PlotManagementTable,
} from "../management/ManagementTables";
import { PlotFormSheet, type PlotFormValue } from "../management/PlotFormSheet";
import { AppScreenLayout } from "../shared/AppScreenLayout";
import { BottomSheet } from "../shared/BottomSheet";
import { InputSelection } from "../shared/InputSelection";
import { InputText } from "../shared/InputText";
import { KeyboardFormScrollView } from "../shared/KeyboardFormScrollView";
import { PrimaryButton } from "../shared/PrimaryButton";

function parseImportBoolean(value?: string): boolean {
  const normalized = value?.trim().toLowerCase();
  return !["false", "0", "no", "không", "inactive", "ngừng"].includes(
    normalized || "",
  );
}

function parseImportEnvMode(value?: string): PlotInfo["envMode"] | undefined {
  const normalized = value?.trim().toLowerCase();
  if (["greenhouse", "nhà kính", "nha kinh"].includes(normalized || "")) {
    return "greenhouse";
  }
  if (["outdoor", "ngoài trời", "ngoai troi"].includes(normalized || "")) {
    return "outdoor";
  }
  return undefined;
}

function parseImportDiseaseGroup(
  value?: string,
): PlantDiseaseGroup | undefined {
  const normalized = value?.trim().toLowerCase();
  if (
    ["truyền nhiễm", "truyen nhiem", "infectious"].includes(normalized || "")
  ) {
    return "Truyền nhiễm";
  }
  if (
    ["không truyền nhiễm", "khong truyen nhiem", "non-infectious"].includes(
      normalized || "",
    )
  ) {
    return "Không truyền nhiễm";
  }
  return undefined;
}

function isDuplicateImportError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("đã tồn tại") ||
      error.message.includes("đã được sử dụng"))
  );
}

export function ManagementScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [selectedDiseaseGroup, setSelectedDiseaseGroup] =
    useState<PlantDiseaseGroup>("Truyền nhiễm");
  const [variant, setVariant] = useState<ManagementVariant>("plots");
  const [query, setQuery] = useState("");
  const [plots, setPlots] = useState<PlotInfo[]>([]);
  const [farms, setFarms] = useState<FarmInfo[]>([]);
  const [crops, setCrops] = useState<CropTypeInfo[]>([]);
  const [plantDiseases, setPlantDiseases] = useState<PlantDiseaseInfo[]>([]);
  const [allDiseases, setAllDiseases] = useState<PlantDiseaseInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingGroupValue, setEditingGroupValue] = useState("");
  const [editingTypeKey, setEditingTypeKey] = useState<string | null>(null);
  const [editingTypeValue, setEditingTypeValue] = useState("");
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(
    null,
  );
  const [confirmDeleteType, setConfirmDeleteType] = useState<{
    group: string;
    type: string;
  } | null>(null);
  const [deleteSource, setDeleteSource] = useState<"main" | "picker" | null>(
    null,
  );
  const [users, setUsers] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cropIconPickerOpen, setCropIconPickerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<ToastState>(null);
  const [cropForm, setCropForm] = useState({ name: "", icon: "" });
  const [farmForm, setFarmForm] = useState({ name: "" });
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
  const [editingFarm, setEditingFarm] = useState<FarmInfo | null>(null);
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
  const [plotForm, setPlotForm] = useState<PlotFormValue>({
    code: "",
    name: "",
    farmId: "",
    envMode: "outdoor" as const,
    area: "",
    status: "Đang sử dụng",
  });
  const [csvMode, setCsvMode] = useState<CsvImportMode>(null);
  const [csvProgress, setCsvProgress] = useState(60);
  const [importResult, setImportResult] = useState<{
    success: number;
    skipped: number;
    errors: number;
    details?: {
      type: "skipped" | "error";
      rowNumber: number;
      rowData: any;
      reason?: string;
    }[];
  }>({
    success: 0,
    skipped: 0,
    errors: 0,
    details: [],
  });
  const [confirmItem, setConfirmItem] = useState<any | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const { height: windowHeight } = useWindowDimensions();
  const pageSize = useMemo(() => {
    const insetsHeight = insets.top + insets.bottom;
    const overhead = variant === "diseases" ? 342 : 292;
    const remaining = windowHeight - overhead - insetsHeight;
    const fit = Math.floor(remaining / 42);
    return Math.max(4, Math.min(12, fit));
  }, [windowHeight, variant, insets.top, insets.bottom]);

  const loadVariantData = useCallback(
    async (
      targetPage = page,
      targetVariant = variant,
      targetQuery = query,
      targetDiseaseGroup = selectedDiseaseGroup,
    ) => {
      if (targetVariant === "plots") {
        const data = await getPlotsPage({
          page: targetPage,
          limit: pageSize,
          query: targetQuery,
        });
        setPlots(data.items);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
        return;
      }

      if (targetVariant === "farms") {
        const data = await getFarmsPage({
          page: targetPage,
          limit: pageSize,
          query: targetQuery,
        });
        setFarms(data.items);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
        return;
      }

      if (targetVariant === "crops") {
        const data = await getCropTypesPage({
          page: targetPage,
          limit: pageSize,
          query: targetQuery,
        });
        setCrops(data.items);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
        return;
      }

      if (targetVariant === "diseases") {
        const data = await getPlantDiseasesPage({
          page: targetPage,
          limit: pageSize,
          query: [targetDiseaseGroup, targetQuery.trim()]
            .filter(Boolean)
            .join(" "),
        });
        setPlantDiseases(data.items);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);

        try {
          const all = await getPlantDiseases();
          setAllDiseases(all);
        } catch {
          // ignore
        }
        return;
      }

      const data = await getUsersPage({
        page: targetPage,
        limit: pageSize,
        query: targetQuery,
      });
      setUsers(data.items);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
    },
    [page, pageSize, query, selectedDiseaseGroup, variant],
  );

  const refresh = useCallback(async () => {
    try {
      await loadVariantData();
    } catch (error) {
      setSnackbar({
        type: "error",
        message:
          error instanceof Error ? error.message : "Không thể tải dữ liệu.",
      });
    }
  }, [loadVariantData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (
      params.tab === "plots" ||
      params.tab === "farms" ||
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
  }, [query, selectedDiseaseGroup, variant]);

  const title =
    variant === "plots"
      ? "Mã số luống"
      : variant === "farms"
        ? "Farm"
        : variant === "crops"
          ? "Loại cây"
          : variant === "diseases"
            ? "Bệnh cây"
            : "Tài khoản";
  const isAdminAccount = (item: any) =>
    String(item?.role || "").toUpperCase() === "ADMIN";
  const searchPlaceholder =
    variant === "plots"
      ? "Tìm mã luống"
      : variant === "farms"
        ? "Tìm farm..."
        : variant === "crops"
          ? "Tìm loại cây..."
          : variant === "diseases"
            ? "Tìm loại hoặc tên bệnh..."
            : "Tìm kiếm username...";
  const visibleRows =
    variant === "plots"
      ? plots
      : variant === "farms"
        ? farms
        : variant === "crops"
          ? crops
          : variant === "diseases"
            ? plantDiseases
            : users.filter((item) => !isAdminAccount(item));
  const cropIconOptions = useMemo(() => {
    const existingIcons = crops
      .map((crop) => crop.icon?.trim())
      .filter((icon): icon is string => Boolean(icon));

    return Array.from(
      new Set([...existingIcons, ...DEFAULT_CROP_ICON_OPTIONS]),
    );
  }, [crops]);
  const availableDiseaseTypes = useMemo(() => {
    const existingTypes = allDiseases
      .map((item) => item.type?.trim())
      .filter((type): type is string => Boolean(type));

    return Array.from(new Set([...existingTypes, ...DEFAULT_DISEASE_TYPES]));
  }, [allDiseases]);
  const availableDiseaseGroups = useMemo(() => {
    const existingGroups = allDiseases
      .map((item) => item.group?.trim())
      .filter((group): group is string => Boolean(group));

    return Array.from(
      new Set(["Truyền nhiễm", "Không truyền nhiễm", ...existingGroups]),
    );
  }, [allDiseases]);
  const safePage = Math.min(page, totalPages);
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
    setEditingFarm(null);
    setEditingCrop(null);
    setEditingDisease(null);
    setEditingUser(null);
    setCropForm({ name: "", icon: "" });
    setFarmForm({ name: "" });
    setDiseaseForm({ group: "Truyền nhiễm", type: "", name: "" });
    setPlotForm({
      code: "",
      name: "",
      farmId: "",
      envMode: "outdoor",
      area: "",
      status: "Đang sử dụng",
    });
    setAccountForm({ name: "", username: "", password: "" });
  };
  const openAddDrawer = () => {
    setEditingPlot(null);
    setEditingFarm(null);
    setEditingCrop(null);
    setEditingDisease(null);
    setEditingUser(null);
    setCropForm({ name: "", icon: "" });
    setFarmForm({ name: "" });
    setDiseaseGroupPickerOpen(false);
    setDiseaseTypePickerOpen(false);
    setDiseaseForm({ group: "Truyền nhiễm", type: "", name: "" });
    setPlotForm({
      code: "",
      name: "",
      farmId: "",
      envMode: "outdoor",
      area: "",
      status: "Đang sử dụng",
    });
    setAccountForm({ name: "", username: "", password: "" });
    setAddOpen(true);
  };

  const addItem = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (variant === "plots") {
        if (!plotForm.code.trim() || !plotForm.name.trim() || !plotForm.farmId)
          return;
        const areaSquareMeters = Number(plotForm.area.trim().replace(",", "."));
        const payload = {
          code: plotForm.code.trim(),
          name: plotForm.name.trim(),
          farmId: plotForm.farmId,
          envMode: plotForm.envMode,
          ...(Number.isFinite(areaSquareMeters) && areaSquareMeters > 0
            ? { areaSquareMeters }
            : {}),
          isActive: plotForm.status !== "Ngừng sử dụng",
        };
        if (editingPlot) {
          await updatePlot(editingPlot.id, payload);
        } else {
          await addPlot(payload);
          setPage(1);
        }
      } else if (variant === "farms") {
        if (!farmForm.name.trim()) return;
        const payload = {
          name: farmForm.name.trim(),
        };
        if (editingFarm) {
          await updateFarm(editingFarm.id, payload);
        } else {
          await addFarm(payload);
          setPage(1);
        }
      } else if (variant === "crops") {
        if (!cropForm.name.trim()) return;
        if (editingCrop) {
          await updateCropType(editingCrop.id, {
            name: cropForm.name.trim(),
            category: editingCrop.category || "Master Data",
            icon: cropForm.icon.trim() || undefined,
          });
        } else {
          await addCropType({
            name: cropForm.name.trim(),
            category: "Master Data",
            icon: cropForm.icon.trim() || undefined,
          });
          setPage(1);
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
      } else {
        if (
          !accountForm.name.trim() ||
          !accountForm.username.trim() ||
          (!editingUser && !accountForm.password.trim())
        ) {
          return;
        }
        if (editingUser) {
          await updateUser(editingUser.id, {
            name: accountForm.name.trim(),
            username: accountForm.username.trim(),
            ...(accountForm.password.trim()
              ? { password: accountForm.password }
              : {}),
          });
        } else {
          await addUser({
            name: accountForm.name.trim(),
            username: accountForm.username.trim(),
            password: accountForm.password,
            role: "FARMER",
          });
          setPage(1);
        }
      }
      await loadVariantData(
        editingPlot || editingCrop || editingDisease || editingUser ? page : 1,
      );
      notify("Đã cập nhật danh sách.");
      closeAddDrawer();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể cập nhật dữ liệu.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRenameGroup = async (oldName: string) => {
    if (!editingGroupValue.trim() || editingGroupValue.trim() === oldName) {
      setEditingGroupKey(null);
      return;
    }
    try {
      await renamePlantDiseaseGroup(oldName, editingGroupValue.trim());
      notify(`Đã đổi tên nhóm thành '${editingGroupValue.trim()}'`);
      setEditingGroupKey(null);
      if (selectedDiseaseGroup === oldName) {
        setSelectedDiseaseGroup(editingGroupValue.trim());
      }
      await refresh();
    } catch (err: any) {
      notify(err?.message || "Đổi tên nhóm thất bại", "error");
    }
  };

  const handleDeleteGroup = async (name: string) => {
    try {
      await deletePlantDiseaseGroup(name);
      notify(`Đã xóa nhóm '${name}'`);
      setConfirmDeleteGroup(null);
      if (selectedDiseaseGroup === name) {
        setSelectedDiseaseGroup("Truyền nhiễm");
      }
      await refresh();
    } catch (err: any) {
      notify(err?.message || "Xóa nhóm thất bại", "error");
    }
  };

  const handleRenameType = async (group: string, oldName: string) => {
    if (!editingTypeValue.trim() || editingTypeValue.trim() === oldName) {
      setEditingTypeKey(null);
      return;
    }
    try {
      await renamePlantDiseaseType(group, oldName, editingTypeValue.trim());
      notify(`Đã đổi tên loại thành '${editingTypeValue.trim()}'`);
      setEditingTypeKey(null);
      await refresh();
    } catch (err: any) {
      notify(err?.message || "Đổi tên loại thất bại", "error");
    }
  };

  const handleDeleteType = async (group: string, name: string) => {
    try {
      await deletePlantDiseaseType(group, name);
      notify(`Đã xóa loại '${name}' thuộc nhóm '${group}'`);
      setConfirmDeleteType(null);
      await refresh();
    } catch (err: any) {
      notify(err?.message || "Xóa loại thất bại", "error");
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
        name: plot.name || "",
        farmId: plot.farmId || "",
        envMode: plot.envMode || "outdoor",
        area: plot.areaSquareMeters ? String(plot.areaSquareMeters) : "",
        status: isManagementItemActive(plot) ? "Đang sử dụng" : "Ngừng sử dụng",
      });
      setActionItem(null);
      setAddOpen(true);
      return;
    }

    if (variant === "farms") {
      const farm = actionItem as FarmInfo;
      setEditingFarm(farm);
      setFarmForm({ name: farm.name || "" });
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
      await revokeUser(actionItem.id);
      await refresh();
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
      await restoreUser(actionItem.id);
      await refresh();
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
        await setPlotActiveStatus(confirmItem.id, nextIsActive);
      }
      if (variant === "farms") {
        await setFarmActiveStatus(confirmItem.id, nextIsActive);
      }
      if (variant === "crops") {
        await setCropTypeActiveStatus(confirmItem.id, nextIsActive);
      }
      if (variant === "diseases") {
        await setPlantDiseaseActiveStatus(confirmItem.id, nextIsActive);
      }
      await refresh();
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

  const requestDeleteSelectedItem = () => {
    if (!actionItem) {
      setActionItem(null);
      return;
    }
    setConfirmDeleteItem(actionItem);
    setActionItem(null);
  };

  const deleteSelectedItem = async () => {
    if (!confirmDeleteItem) return;
    try {
      if (variant === "plots") {
        await deletePlot(confirmDeleteItem.id);
      } else if (variant === "farms") {
        await deleteFarm(confirmDeleteItem.id);
      } else if (variant === "crops") {
        await deleteCropType(confirmDeleteItem.id);
      } else if (variant === "diseases") {
        await deletePlantDisease(confirmDeleteItem.id);
      } else if (variant === "accounts") {
        await deleteUser(confirmDeleteItem.id);
      }
      await refresh();
      notify("Xóa dữ liệu thành công.", "success");
      setConfirmDeleteItem(null);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể xóa dữ liệu.",
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
    const details: {
      type: "skipped" | "error";
      rowNumber: number;
      rowData: any;
      reason?: string;
    }[] = [];
    const total = parsedCsv.rows.length;

    const allFarms = await getFarms();

    for (let i = 0; i < total; i++) {
      const row = parsedCsv.rows[i];
      const rowNum = i + 2; // Row number in CSV file (1-based header is row 1)
      try {
        if (variant === "plots") {
          const code = row[fieldMapping.code]?.trim();
          const name = row[fieldMapping.name]?.trim();
          const envMode = parseImportEnvMode(row[fieldMapping.envMode]);
          const rawArea = row[fieldMapping.areaSquareMeters]?.trim();
          const areaSquareMeters = rawArea ? Number(rawArea) : undefined;
          const isActive = parseImportBoolean(row[fieldMapping.isActive]);
          const targetFarmName = row[fieldMapping.farmName]?.trim();

          if (!code || !name || !targetFarmName) {
            skipped++;
            details.push({
              type: "skipped",
              rowNumber: rowNum,
              rowData: row,
              reason: "Thiếu trường bắt buộc (mã, tên hoặc tên farm)",
            });
          } else if (
            !envMode ||
            (rawArea && !Number.isFinite(areaSquareMeters))
          ) {
            errors++;
            details.push({
              type: "error",
              rowNumber: rowNum,
              rowData: row,
              reason: !envMode
                ? "Môi trường không hợp lệ"
                : "Diện tích không phải là số",
            });
          } else {
            let matchedFarm = allFarms.find(
              (f) =>
                f.name.toLowerCase().trim() ===
                targetFarmName.toLowerCase().trim(),
            );

            if (!matchedFarm) {
              // auto generate farm
              matchedFarm = await addFarm({
                name: targetFarmName,
                isActive: true,
              });
              allFarms.push(matchedFarm);
            }

            const farmId = matchedFarm.id;

            await addPlot({
              code,
              name,
              farmId,
              envMode,
              areaSquareMeters,
              isActive,
            });
            success++;
          }
        } else if (variant === "farms") {
          const name = row[fieldMapping.name]?.trim();
          const isActive = parseImportBoolean(row[fieldMapping.isActive]);

          if (!name) {
            skipped++;
            details.push({
              type: "skipped",
              rowNumber: rowNum,
              rowData: row,
              reason: "Thiếu tên farm",
            });
          } else {
            await addFarm({ name, isActive });
            success++;
          }
        } else if (variant === "crops") {
          const name = row[fieldMapping.name]?.trim();
          const category = row[fieldMapping.category]?.trim() || "Rau màu";
          const icon = row[fieldMapping.icon]?.trim();
          const isActive = parseImportBoolean(row[fieldMapping.isActive]);

          if (!name) {
            skipped++;
            details.push({
              type: "skipped",
              rowNumber: rowNum,
              rowData: row,
              reason: "Thiếu tên loại cây",
            });
          } else {
            await addCropType({ name, category, icon, isActive });
            success++;
          }
        } else if (variant === "diseases") {
          const name = row[fieldMapping.name]?.trim();
          const group = parseImportDiseaseGroup(row[fieldMapping.group]);
          const type = row[fieldMapping.type]?.trim();
          const description = row[fieldMapping.description]?.trim();
          const isActive = parseImportBoolean(row[fieldMapping.isActive]);

          if (!name || !type) {
            skipped++;
            details.push({
              type: "skipped",
              rowNumber: rowNum,
              rowData: row,
              reason: "Thiếu tên bệnh hoặc loại bệnh",
            });
          } else if (!group) {
            errors++;
            details.push({
              type: "error",
              rowNumber: rowNum,
              rowData: row,
              reason: "Nhóm bệnh không hợp lệ",
            });
          } else {
            await addPlantDisease({
              name,
              group,
              type,
              description,
              isActive,
            });
            success++;
          }
        } else if (variant === "accounts") {
          const name = row[fieldMapping.name]?.trim();
          const username = row[fieldMapping.username]?.trim();
          const password = row[fieldMapping.password]?.trim();

          if (!name || !username || !password) {
            skipped++;
            details.push({
              type: "skipped",
              rowNumber: rowNum,
              rowData: row,
              reason: "Thiếu tên, username hoặc mật khẩu",
            });
          } else {
            await addUser({ name, username, role: "FARMER", password });
            success++;
          }
        }
      } catch (error) {
        if (isDuplicateImportError(error)) {
          skipped++;
          details.push({
            type: "skipped",
            rowNumber: rowNum,
            rowData: row,
            reason: "Dữ liệu đã tồn tại (trùng lặp)",
          });
        } else {
          errors++;
          details.push({
            type: "error",
            rowNumber: rowNum,
            rowData: row,
            reason:
              error instanceof Error ? error.message : "Lỗi hệ thống khi lưu",
          });
        }
      }

      setCsvProgress(Math.round(((i + 1) / total) * 100));
    }

    setPage(1);
    try {
      await loadVariantData(1);
    } catch {
      // ignore
    }

    setImportResult({ success, skipped, errors, details });
    setCsvMode("result");
    notify(`Đã import xong ${success} bản ghi.`, "success");
  };

  const canEditActionItem = useMemo(() => {
    return true;
  }, []);

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
            onDelete={requestDeleteSelectedItem}
          />
          {variant === "plots" ? (
            <PlotFormSheet
              visible={addOpen}
              value={plotForm}
              onChange={setPlotForm}
              onClose={closeAddDrawer}
              onSubmit={addItem}
              editing={Boolean(editingPlot)}
              farms={farms}
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
                  <KeyboardFormScrollView
                    contentContainerStyle={
                      managementScreenStyles.managementEditDrawerContent
                    }
                  >
                    <InputText
                      containerStyle={managementScreenStyles.drawerFieldStack}
                      label="Điền mới nhóm bệnh cây"
                      value={diseaseForm.group}
                      onChangeText={(group) =>
                        setDiseaseForm((current) => ({
                          ...current,
                          group,
                        }))
                      }
                      placeholder="vd: Truyền nhiễm, Không truyền nhiễm..."
                    />
                    <Text style={managementScreenStyles.pickerSectionHeader}>
                      Hoặc chọn nhóm bệnh cây có sẵn:
                    </Text>
                    {availableDiseaseGroups.map((group) => {
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
                    <PrimaryButton
                      label="Xác nhận"
                      onPress={() => setDiseaseGroupPickerOpen(false)}
                    />
                  </KeyboardFormScrollView>
                ) : diseaseTypePickerOpen ? (
                  <KeyboardFormScrollView
                    contentContainerStyle={
                      managementScreenStyles.managementEditDrawerContent
                    }
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
                  </KeyboardFormScrollView>
                ) : (
                  <KeyboardFormScrollView
                    contentContainerStyle={
                      managementScreenStyles.managementEditDrawerContent
                    }
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
                    ) : variant === "farms" ? (
                      <>
                        <InputText
                          containerStyle={
                            managementScreenStyles.drawerFieldStack
                          }
                          label="Tên Farm"
                          value={farmForm.name}
                          onChangeText={(name) =>
                            setFarmForm((current) => ({ ...current, name }))
                          }
                          placeholder="Nhập tên farm"
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
                          style={{ height: 36, minHeight: 36, borderRadius: 8 }}
                          loading={saving}
                          onPress={addItem}
                          disabled={
                            variant === "accounts"
                              ? !accountForm.name.trim() ||
                                !accountForm.username.trim() ||
                                (!editingUser && !accountForm.password.trim())
                              : variant === "diseases"
                                ? !diseaseForm.type.trim() ||
                                  !diseaseForm.name.trim()
                                : variant === "farms"
                                  ? !farmForm.name.trim()
                                  : !cropForm.name.trim()
                          }
                        />
                      </View>
                    </View>
                  </KeyboardFormScrollView>
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
          <ConfirmDeleteDialog
            visible={Boolean(confirmDeleteItem)}
            itemLabel={getManagementItemLabel(confirmDeleteItem, variant)}
            variant={variant}
            onCancel={() => setConfirmDeleteItem(null)}
            onConfirm={deleteSelectedItem}
          />
          <BottomSheet
            visible={manageGroupsOpen}
            title="Quản lý nhóm & loại bệnh"
            onClose={() => {
              setManageGroupsOpen(false);
              setEditingGroupKey(null);
              setEditingTypeKey(null);
            }}
            full
          >
            <KeyboardFormScrollView
              contentContainerStyle={{ paddingBottom: 60 }}
            >
              {availableDiseaseGroups.map((group) => {
                const groupTypes = Array.from(
                  new Set(
                    allDiseases
                      .filter((d) => d.group === group)
                      .map((d) => d.type)
                      .filter(Boolean),
                  ),
                );

                const isEditingGroup = editingGroupKey === group;

                return (
                  <View
                    key={group}
                    style={managementScreenStyles.manageGroupSection}
                  >
                    <View style={managementScreenStyles.manageGroupHeaderRow}>
                      {isEditingGroup ? (
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <InputText
                            containerStyle={{ flex: 1 }}
                            value={editingGroupValue}
                            onChangeText={setEditingGroupValue}
                            placeholder="Tên nhóm mới"
                            variant="plain"
                          />
                          <Pressable
                            style={managementScreenStyles.rowActionButton}
                            onPress={() => handleRenameGroup(group)}
                          >
                            <Check size={16} color={COLORS.green} />
                          </Pressable>
                          <Pressable
                            style={managementScreenStyles.rowActionButton}
                            onPress={() => setEditingGroupKey(null)}
                          >
                            <X size={16} color={COLORS.muted} />
                          </Pressable>
                        </View>
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text
                            style={managementScreenStyles.manageGroupNameText}
                          >
                            {group}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <Pressable
                              style={managementScreenStyles.rowActionButton}
                              onPress={() => {
                                setEditingGroupKey(group);
                                setEditingGroupValue(group);
                              }}
                            >
                              <Edit2 size={20} color={COLORS.green} />
                            </Pressable>
                            <Pressable
                              style={managementScreenStyles.rowActionButton}
                              onPress={() => {
                                setManageGroupsOpen(false);
                                setTimeout(() => {
                                  setConfirmDeleteGroup(group);
                                  setDeleteSource("main");
                                }, 300);
                              }}
                            >
                              <Trash2 size={20} color={COLORS.danger} />
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={managementScreenStyles.manageTypesContainer}>
                      {groupTypes.map((type) => {
                        const typeKey = `${group}:${type}`;
                        const isEditingType = editingTypeKey === typeKey;

                        return (
                          <View
                            key={type}
                            style={managementScreenStyles.manageTypeRow}
                          >
                            {isEditingType ? (
                              <View
                                style={{
                                  flex: 1,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <InputText
                                  containerStyle={{ flex: 1 }}
                                  value={editingTypeValue}
                                  onChangeText={setEditingTypeValue}
                                  placeholder="Tên loại mới"
                                  variant="plain"
                                />
                                <Pressable
                                  style={managementScreenStyles.rowActionButton}
                                  onPress={() => handleRenameType(group, type)}
                                >
                                  <Check size={16} color={COLORS.green} />
                                </Pressable>
                                <Pressable
                                  style={managementScreenStyles.rowActionButton}
                                  onPress={() => setEditingTypeKey(null)}
                                >
                                  <X size={16} color={COLORS.muted} />
                                </Pressable>
                              </View>
                            ) : (
                              <View
                                style={{
                                  flex: 1,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Text
                                  style={
                                    managementScreenStyles.manageTypeNameText
                                  }
                                >
                                  {type}
                                </Text>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    gap: 12,
                                    alignItems: "center",
                                  }}
                                >
                                  <Pressable
                                    style={
                                      managementScreenStyles.rowActionButton
                                    }
                                    onPress={() => {
                                      setEditingTypeKey(typeKey);
                                      setEditingTypeValue(type);
                                    }}
                                  >
                                    <Edit2 size={18} color={COLORS.green} />
                                  </Pressable>
                                  <Pressable
                                    style={
                                      managementScreenStyles.rowActionButton
                                    }
                                    onPress={() => {
                                      setManageGroupsOpen(false);
                                      setTimeout(() => {
                                        setConfirmDeleteType({ group, type });
                                        setDeleteSource("main");
                                      }, 300);
                                    }}
                                  >
                                    <Trash2 size={18} color={COLORS.danger} />
                                  </Pressable>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                      {groupTypes.length === 0 && (
                        <Text
                          style={{
                            color: COLORS.muted,
                            fontSize: 12,
                            fontStyle: "italic",
                            paddingLeft: 12,
                            paddingVertical: 4,
                          }}
                        >
                          Chưa có loại bệnh trong nhóm này
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </KeyboardFormScrollView>
          </BottomSheet>
          <ConfirmDeleteDialog
            visible={Boolean(confirmDeleteGroup)}
            itemLabel={`Nhóm bệnh '${confirmDeleteGroup}' (sẽ xóa tất cả bệnh cây thuộc nhóm này)`}
            variant="diseases"
            onCancel={() => {
              const source = deleteSource;
              setConfirmDeleteGroup(null);
              setDeleteSource(null);
              setTimeout(() => {
                if (source === "main") {
                  setManageGroupsOpen(true);
                } else if (source === "picker") {
                  setAddOpen(true);
                  setDiseaseGroupPickerOpen(true);
                }
              }, 300);
            }}
            onConfirm={async () => {
              if (confirmDeleteGroup) {
                const source = deleteSource;
                await handleDeleteGroup(confirmDeleteGroup);
                setDeleteSource(null);
                setTimeout(() => {
                  if (source === "main") {
                    setManageGroupsOpen(true);
                  } else if (source === "picker") {
                    setAddOpen(true);
                    setDiseaseGroupPickerOpen(true);
                  }
                }, 300);
              }
            }}
          />
          <ConfirmDeleteDialog
            visible={Boolean(confirmDeleteType)}
            itemLabel={`Loại bệnh '${confirmDeleteType?.type}' trong nhóm '${confirmDeleteType?.group}'`}
            variant="diseases"
            onCancel={() => {
              const source = deleteSource;
              setConfirmDeleteType(null);
              setDeleteSource(null);
              setTimeout(() => {
                if (source === "main") {
                  setManageGroupsOpen(true);
                } else if (source === "picker") {
                  setAddOpen(true);
                  setDiseaseTypePickerOpen(true);
                }
              }, 300);
            }}
            onConfirm={async () => {
              if (confirmDeleteType) {
                const source = deleteSource;
                await handleDeleteType(
                  confirmDeleteType.group,
                  confirmDeleteType.type,
                );
                setDeleteSource(null);
                setTimeout(() => {
                  if (source === "main") {
                    setManageGroupsOpen(true);
                  } else if (source === "picker") {
                    setAddOpen(true);
                    setDiseaseTypePickerOpen(true);
                  }
                }, 300);
              }
            }}
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
        {(["plots", "farms", "crops", "diseases", "accounts"] as const).map(
          (id) => (
            <Pressable
              key={id}
              testID={`admin-${id}`}
              onPress={() => changeVariant(id)}
              style={managementScreenStyles.managementHiddenTab}
            >
              <Text>
                {id === "plots"
                  ? "Mã số luống"
                  : id === "farms"
                    ? "Farm"
                    : id === "crops"
                      ? "Loại cây"
                      : id === "diseases"
                        ? "Bệnh cây"
                        : "Tài khoản"}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      <ScrollView
        style={managementScreenStyles.managementList}
        contentContainerStyle={[
          managementScreenStyles.managementListContent,
          { paddingBottom: 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {variant === "diseases" ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={[
                managementScreenStyles.diseaseGroupSegmentContainer,
                { marginBottom: 0 },
              ]}
            >
              {availableDiseaseGroups.map((group) => {
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
            </ScrollView>
            <Pressable
              style={managementScreenStyles.manageGroupTypeButton}
              onPress={() => setManageGroupsOpen(true)}
            >
              <Sliders size={18} color={COLORS.green} />
            </Pressable>
          </View>
        ) : null}
        {variant === "plots" ? (
          <PlotManagementTable
            rows={visibleRows as PlotInfo[]}
            total={totalItems}
            onAction={setActionItem}
          />
        ) : variant === "farms" ? (
          <FarmManagementTable
            rows={visibleRows as FarmInfo[]}
            total={totalItems}
            onAction={setActionItem}
          />
        ) : variant === "crops" ? (
          <CropManagementTable
            rows={visibleRows as CropTypeInfo[]}
            total={totalItems}
            onAction={setActionItem}
          />
        ) : variant === "diseases" ? (
          <PlantDiseaseManagementTable
            rows={visibleRows as PlantDiseaseInfo[]}
            total={totalItems}
            onAction={setActionItem}
          />
        ) : (
          <AccountManagementTable
            rows={visibleRows as User[]}
            total={totalItems}
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
    flexGrow: 1,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: 12,
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
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
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
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCancelText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "600",
  },
  manageGroupTypeButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  manageGroupSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  manageGroupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  manageGroupNameText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  manageTypesContainer: {
    padding: 8,
    gap: 6,
  },
  manageTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  manageTypeNameText: {
    color: COLORS.body,
    fontSize: 13,
    fontWeight: "500",
  },
  rowActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});
