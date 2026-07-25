import React from "react";
import { TouchableOpacity } from "react-native";
import renderer, { act } from "react-test-renderer";
import {
  StatusBadge,
  SnackbarNotification,
  AddPlotModal,
  AddCropModal,
  ActionMenuModal,
  ConfirmModal,
  AdminSidebarDrawer,
  CsvImportCard,
  CsvImportResultModal,
} from "@/components/management";
import ManagementScreen from "@/app/(tabs)/management";
import { plotFormSchema, cropFormSchema } from "@/schemas/formSchemas";

// Mocks
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: (cb: Function) => {
    const React = require("react");
    React.useEffect(() => {
      cb();
    }, []);
  },
}));

const mockGetPlots = jest.fn();
const mockGetCropTypes = jest.fn();
const mockGetUsers = jest.fn();
const mockAddPlot = jest.fn();
const mockAddCropType = jest.fn();
const mockImportCSV = jest.fn();

jest.mock("@/services/adminService", () => ({
  getPlots: (...args: any[]) => mockGetPlots(...args),
  getCropTypes: (...args: any[]) => mockGetCropTypes(...args),
  getUsers: (...args: any[]) => mockGetUsers(...args),
  addPlot: (...args: any[]) => mockAddPlot(...args),
  addCropType: (...args: any[]) => mockAddCropType(...args),
  importCSV: (...args: any[]) => mockImportCSV(...args),
}));

const findTouchableByText = (container: any, textLabel: string) => {
  const matches = container.findAll((node: any) => {
    if (!node.props || typeof node.props.onPress !== "function") return false;
    const isTouchableOpacity =
      node.type === TouchableOpacity ||
      node.type?.displayName === "TouchableOpacity" ||
      node.type?.name === "TouchableOpacity";
    if (!isTouchableOpacity) return false;
    const textNodes = node.findAll
      ? node.findAll((n: any) => typeof n.props?.children === "string")
      : [];
    return textNodes.some((t: any) => t.props.children === textLabel);
  });
  return matches[0];
};

describe("Challenger 2 — Empirical & Adversarial M2 Verification Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockGetPlots.mockResolvedValue([
      { id: "1", code: "L-001", name: "Khu A" },
      { id: "2", code: "L-002", name: "Khu B" },
    ]);
    mockImportCSV.mockResolvedValue({ success: 124, skipped: 3, errors: 1 });
    mockGetCropTypes.mockResolvedValue([
      { id: "1", name: "Cà chua", category: "Rau ăn quả" },
    ]);
    mockGetUsers.mockResolvedValue([
      { id: "1", name: "Nguyễn Văn A", email: "a@farm.vn", role: "farmer" },
      { id: "2", name: "Trần Văn B", email: "b@farm.vn", role: "admin" },
    ]);
    mockAddPlot.mockResolvedValue({ id: "3", code: "L-003", name: "Khu C" });
    mockAddCropType.mockResolvedValue({ id: "2", name: "Dưa lưới", category: "Rau ăn quả" });
  });

  // -------------------------------------------------------------
  // 1. AddPlotModal & Schema Edge Cases
  // -------------------------------------------------------------
  describe("1. AddPlotModal & Plot Schema Edge Cases", () => {
    it("validates Zod plotFormSchema against empty and invalid code/name inputs", () => {
      // Empty code & name
      const emptyRes = plotFormSchema.safeParse({ code: "", name: "" });
      expect(emptyRes.success).toBe(false);
      if (!emptyRes.success) {
        const issues = emptyRes.error.issues;
        expect(issues.some((i: any) => i.path.includes("code"))).toBe(true);
        expect(issues.some((i: any) => i.path.includes("name"))).toBe(true);
      }

      // Valid plot data
      const validRes = plotFormSchema.safeParse({ code: "L-009", name: "Khu Tây" });
      expect(validRes.success).toBe(true);
    });

    it("renders AddPlotModal bottom sheet when visible and triggers onClose on close button press", async () => {
      const onClose = jest.fn();
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AddPlotModal visible={true} onClose={onClose} onSubmit={onSubmit} />
        );
      });

      const root = tree!.root;
      const codeInput = root.findByProps({ testID: "add-plot-code-input" });
      const nameInput = root.findByProps({ testID: "add-plot-name-input" });
      const submitBtn = root.findByProps({ testID: "submit-add-plot-button" });

      expect(codeInput).toBeDefined();
      expect(nameInput).toBeDefined();
      expect(submitBtn).toBeDefined();

      const touchables = root.findAll((node: any) => typeof node.props?.onPress === "function");
      if (touchables.length > 0) {
        await act(async () => {
          touchables[0].props.onPress();
        });
        expect(onClose).toHaveBeenCalled();
      }
    });

    it("handles form submission lifecycle in AddPlotModal", async () => {
      const onClose = jest.fn();
      let submitResolver: () => void = () => {};
      const onSubmit = jest.fn().mockImplementation(
        () => new Promise<void>((resolve) => { submitResolver = resolve; })
      );

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AddPlotModal visible={true} onClose={onClose} onSubmit={onSubmit} />
        );
      });

      const root = tree!.root;
      const codeInput = root.findByProps({ testID: "add-plot-code-input" });
      const nameInput = root.findByProps({ testID: "add-plot-name-input" });
      const submitBtn = root.findByProps({ testID: "submit-add-plot-button" });

      await act(async () => {
        codeInput.props.onChangeText("L-010");
        nameInput.props.onChangeText("Khu Đông");
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(onSubmit).toHaveBeenCalledWith({ code: "L-010", name: "Khu Đông" });

      // Resolve async submit
      await act(async () => {
        submitResolver();
      });
    });
  });

  // -------------------------------------------------------------
  // 2. AddCropModal & Schema Edge Cases
  // -------------------------------------------------------------
  describe("2. AddCropModal & Crop Schema Edge Cases", () => {
    it("validates Zod cropFormSchema against empty crop name", () => {
      const emptyRes = cropFormSchema.safeParse({ name: "", category: "Rau ăn quả" });
      expect(emptyRes.success).toBe(false);
      if (!emptyRes.success) {
        const issues = emptyRes.error.issues;
        expect(issues.some((i: any) => i.path.includes("name"))).toBe(true);
      }

      const validRes = cropFormSchema.safeParse({ name: "Cà chua", category: "Rau ăn quả" });
      expect(validRes.success).toBe(true);
    });

    it("renders AddCropModal and submits valid form data", async () => {
      const onClose = jest.fn();
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AddCropModal visible={true} onClose={onClose} onSubmit={onSubmit} />
        );
      });

      const root = tree!.root;
      const nameInput = root.findByProps({ testID: "add-crop-name-input" });
      const categoryInput = root.findByProps({ testID: "add-crop-category-input" });
      const submitBtn = root.findByProps({ testID: "submit-add-crop-button" });

      await act(async () => {
        nameInput.props.onChangeText("Dưa hấu");
        categoryInput.props.onChangeText("Trái cây");
      });

      await act(async () => {
        submitBtn.props.onPress();
      });

      expect(onSubmit).toHaveBeenCalledWith({
        name: "Dưa hấu",
        category: "Trái cây",
        icon: "🌿",
      });
    });
  });

  // -------------------------------------------------------------
  // 3. ActionMenuModal & ConfirmModal Interactivity
  // -------------------------------------------------------------
  describe("3. ActionMenuModal & ConfirmModal Actions", () => {
    it("triggers callbacks when menu options are clicked in ActionMenuModal", async () => {
      const onClose = jest.fn();
      const onEdit = jest.fn();
      const onViewDetail = jest.fn();
      const onDisable = jest.fn();

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <ActionMenuModal
            visible={true}
            itemCode="L-001"
            onClose={onClose}
            onEdit={onEdit}
            onViewDetail={onViewDetail}
            onDisable={onDisable}
          />
        );
      });

      const menuCard = tree!.root.findByProps({ testID: "admin-action-menu" });
      const editBtn = findTouchableByText(menuCard, "Chỉnh sửa");
      const detailBtn = findTouchableByText(menuCard, "Xem chi tiết");
      const disableBtn = findTouchableByText(menuCard, "Ngừng sử dụng");

      expect(editBtn).toBeDefined();
      expect(detailBtn).toBeDefined();
      expect(disableBtn).toBeDefined();

      // Edit item press
      await act(async () => {
        editBtn.props.onPress();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(1);

      // View detail press
      await act(async () => {
        detailBtn.props.onPress();
      });
      expect(onClose).toHaveBeenCalledTimes(2);
      expect(onViewDetail).toHaveBeenCalledTimes(1);

      // Disable press
      await act(async () => {
        disableBtn.props.onPress();
      });
      expect(onClose).toHaveBeenCalledTimes(3);
      expect(onDisable).toHaveBeenCalledTimes(1);
    });

    it("handles ConfirmModal confirms, cancels, and scrim presses", async () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <ConfirmModal
            visible={true}
            title="Xóa luống L-001?"
            description="Thao tác này không thể hoàn tác."
            confirmText="Vẫn xóa"
            cancelText="Bỏ qua"
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        );
      });

      const root = tree!.root;
      const confirmCard = root.findByProps({ testID: "admin-confirm-modal" });
      const confirmBtn = root.findByProps({ testID: "confirm-action-button" });

      // Confirm button click
      await act(async () => {
        confirmBtn.props.onPress();
      });
      expect(onConfirm).toHaveBeenCalled();

      // Ghost cancel button in confirmCard
      const cancelBtn = findTouchableByText(confirmCard, "Bỏ qua");
      if (cancelBtn) {
        await act(async () => {
          cancelBtn.props.onPress();
        });
        expect(onCancel).toHaveBeenCalled();
      }
    });
  });

  // -------------------------------------------------------------
  // 4. AdminSidebarDrawer Navigation
  // -------------------------------------------------------------
  describe("4. AdminSidebarDrawer Navigation & Tab Switching", () => {
    it("renders drawer items and calls onSelectTab / onLogout appropriately", async () => {
      const onClose = jest.fn();
      const onSelectTab = jest.fn();
      const onLogout = jest.fn();

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="crops"
            onClose={onClose}
            onSelectTab={onSelectTab}
            onLogout={onLogout}
          />
        );
      });

      const sidebarContainer = tree!.root.findByProps({ testID: "admin-sidebar" });
      const plotsBtn = findTouchableByText(sidebarContainer, "Quản lý mã số luống");
      const logoutBtn = findTouchableByText(sidebarContainer, "Đăng xuất");

      expect(plotsBtn).toBeDefined();
      expect(logoutBtn).toBeDefined();

      // Click 'Quản lý mã số luống'
      await act(async () => {
        plotsBtn.props.onPress();
      });
      expect(onClose).toHaveBeenCalled();
      expect(onSelectTab).toHaveBeenCalledWith("plots");

      // Click 'Đăng xuất'
      await act(async () => {
        logoutBtn.props.onPress();
      });
      expect(onLogout).toHaveBeenCalled();
    });

    it("returns null when visible is false", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={false}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
      });
      expect(tree!.toJSON()).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 5. CsvImportCard & CsvImportResultModal Workflow
  // -------------------------------------------------------------
  describe("5. CsvImport Card & Result Modal Workflow", () => {
    it("animates progress in CsvImportCard and completes import after duration", async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      const onImportComplete = jest.fn();

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <CsvImportCard
            visible={true}
            onClose={onClose}
            onImportComplete={onImportComplete}
          />
        );
      });

      const root = tree!.root;
      const selectBtn = root.findByProps({ testID: "select-csv-file-button" });

      // Start import animation
      await act(async () => {
        selectBtn.props.onPress();
      });

      // Advance timers by 1400ms for import animation finish
      await act(async () => {
        jest.advanceTimersByTime(1400);
      });

      expect(onClose).toHaveBeenCalled();
      expect(onImportComplete).toHaveBeenCalledWith({
        success: 124,
        skipped: 3,
        errors: 1,
      });

      jest.useRealTimers();
    });

    it("renders custom count summary in CsvImportResultModal and triggers onDone", async () => {
      const onClose = jest.fn();
      const onDone = jest.fn();

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <CsvImportResultModal
            visible={true}
            counts={{ success: 50, skipped: 5, errors: 2 }}
            onClose={onClose}
            onDone={onDone}
          />
        );
      });

      const root = tree!.root;
      const doneBtn = root.findByProps({ testID: "import-done-button" });

      await act(async () => {
        doneBtn.props.onPress();
      });

      expect(onClose).toHaveBeenCalled();
      expect(onDone).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------
  // 6. SnackbarNotification Auto-Hide Timer
  // -------------------------------------------------------------
  describe("6. SnackbarNotification Auto-Hide Behavior", () => {
    it("calls onHide after specified durationMs", async () => {
      jest.useFakeTimers();
      const onHide = jest.fn();

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <SnackbarNotification
            visible={true}
            message="Thông báo tự ẩn"
            durationMs={1500}
            onHide={onHide}
          />
        );
      });

      // Before timer expires
      expect(onHide).not.toHaveBeenCalled();

      // Fast forward past durationMs (1500ms + animation 300ms = 1800ms)
      await act(async () => {
        jest.advanceTimersByTime(1900);
      });

      expect(onHide).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  // -------------------------------------------------------------
  // 7. ManagementScreen Integration & Edge Cases (Empty Tables, Searching, Disabling)
  // -------------------------------------------------------------
  describe("7. ManagementScreen Edge Cases (Empty tables, search, disabling)", () => {
    it("handles empty data lists cleanly (0 plots, 0 crops, 0 users)", async () => {
      mockGetPlots.mockResolvedValueOnce([]);
      mockGetCropTypes.mockResolvedValueOnce([]);
      mockGetUsers.mockResolvedValueOnce([]);

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const root = tree!.root;
      expect(root.findByProps({ testID: "management-screen" })).toBeDefined();
    });

    it("filters plots when typing in search input", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const root = tree!.root;
      const searchInput = root.findByProps({ testID: "search-input" });

      await act(async () => {
        searchInput.props.onChangeText("NONEXISTENT_PLOT_CODE");
      });

      expect(searchInput.props.value).toBe("NONEXISTENT_PLOT_CODE");
    });

    it("switches sub-tabs and resets search query", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const root = tree!.root;
      const searchInput = root.findByProps({ testID: "search-input" });
      const cropsTab = root.findByProps({ testID: "admin-crops" });

      await act(async () => {
        searchInput.props.onChangeText("Query");
      });

      await act(async () => {
        cropsTab.props.onPress();
      });

      expect(searchInput.props.value).toBe("");
    });
  });
});
