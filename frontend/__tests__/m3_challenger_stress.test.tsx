import React from "react";
import renderer, { act } from "react-test-renderer";
import {
  AdminSidebarDrawer,
  CsvImportCard,
  CsvImportResultModal,
} from "@/components/management";
import ManagementScreen from "@/app/(tabs)/management";
import * as adminService from "@/services/adminService";

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

jest.mock("@/services/adminService", () => ({
  getPlots: jest.fn().mockResolvedValue([
    { id: "1", code: "L-001", name: "Khu A", areaSquareMeters: 500 },
    { id: "2", code: "L-002", name: "Khu B", areaSquareMeters: 750 },
  ]),
  getCropTypes: jest.fn().mockResolvedValue([
    { id: "1", name: "Cà chua", category: "Rau ăn quả", icon: "🍅" },
    { id: "2", name: "Dưa lưới", category: "Rau ăn quả", icon: "🍈" },
  ]),
  getUsers: jest.fn().mockResolvedValue([
    { id: "1", name: "Nguyễn Văn A", email: "a@farm.vn", role: "admin" },
    { id: "2", name: "Trần Thị B", email: "b@farm.vn", role: "farmer" },
  ]),
  addPlot: jest.fn().mockResolvedValue({ id: "3", code: "L-003", name: "Khu C" }),
  addCropType: jest.fn().mockResolvedValue({ id: "3", name: "Ớt chuông", category: "Rau ăn quả" }),
  importCSV: jest.fn().mockResolvedValue({ success: 124, skipped: 3, errors: 1 }),
}));

describe("Milestone 3 Challenger — Admin Sidebar & CSV Import Engine Stress Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // 1. ADMIN SIDEBAR DRAWER SLIDE ANIMATION & RAPID TOGGLE STRESS
  // =========================================================================
  describe("1. AdminSidebarDrawer Slide Animations & Rapid Open/Close Toggles", () => {
    it("handles 100 rapid open/close state toggles without throwing exceptions or state desync", async () => {
      let visibleState = false;
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={visibleState}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
      });

      // Rapidly re-render 100 times back and forth
      for (let i = 0; i < 100; i++) {
        visibleState = !visibleState;
        await act(async () => {
          tree.update(
            <AdminSidebarDrawer
              visible={visibleState}
              activeSubTab="plots"
              onClose={jest.fn()}
              onSelectTab={jest.fn()}
            />
          );
          jest.advanceTimersByTime(50);
        });
      }

      // Final state visible = false -> expect return null
      expect(tree!.toJSON()).toBeNull();
    });

    it("renders drawer panel when visible = true and animates to open position", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
        jest.advanceTimersByTime(300);
      });

      const sidebar = tree!.root.findByProps({ testID: "admin-sidebar" });
      expect(sidebar).toBeDefined();
    });

    it("handles rapid menu item clicks and triggers onClose and onSelectTab/onLogout callbacks", async () => {
      const onClose = jest.fn();
      const onSelectTab = jest.fn();
      const onLogout = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={onClose}
            onSelectTab={onSelectTab}
            onLogout={onLogout}
          />
        );
        jest.advanceTimersByTime(300);
      });

      // Rapid click on plots menu item
      const plotsBtn = tree!.root.findByProps({ testID: "admin-sidebar-plots" });
      const cropsBtn = tree!.root.findByProps({ testID: "admin-sidebar-crops" });
      const logoutBtn = tree!.root.findByProps({ testID: "admin-sidebar-logout" });

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          plotsBtn.props.onPress();
        });
      }
      expect(onClose).toHaveBeenCalledTimes(10);
      expect(onSelectTab).toHaveBeenCalledWith("plots");

      await act(async () => {
        cropsBtn.props.onPress();
      });
      expect(onSelectTab).toHaveBeenCalledWith("crops");

      await act(async () => {
        logoutBtn.props.onPress();
      });
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("handles unmounting mid-animation gracefully without memory leaks", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
        // Advance timer partially (100ms out of 250ms animation)
        jest.advanceTimersByTime(100);
      });

      // Unmount component mid-animation
      expect(() => {
        act(() => {
          tree.unmount();
        });
      }).not.toThrow();

      // Finish remaining timers post-unmount
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
    });

    it("triggers onClose when clicking scrim background pressable", async () => {
      const onClose = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={onClose}
            onSelectTab={jest.fn()}
          />
        );
        jest.advanceTimersByTime(300);
      });

      const scrim = tree!.root.findByType("Pressable" as any);
      await act(async () => {
        scrim.props.onPress();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. CSV UPLOAD SIMULATION & PROGRESS BAR STATE TRANSITIONS STRESS
  // =========================================================================
  describe("2. CSV Upload Simulation & Progress Bar State Transitions", () => {
    it("executes full import lifecycle from select -> progress bar animation -> completion callback", async () => {
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

      // Initial state: admin-import-select
      expect(tree!.root.findByProps({ testID: "admin-import-select" })).toBeDefined();

      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      // State switches to uploading
      expect(tree!.root.findByProps({ testID: "admin-import-uploading" })).toBeDefined();

      // Advance animation timer (1400ms) & resolve importCSV promise
      await act(async () => {
        jest.advanceTimersByTime(1400);
        await Promise.resolve(); // Flush microtasks for importCSV
      });

      expect(adminService.importCSV).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(onImportComplete).toHaveBeenCalledWith({
        success: 124,
        skipped: 3,
        errors: 1,
      });
    });

    it("prevents duplicate upload triggers when dropZone / start-button is clicked rapidly multiple times", async () => {
      const onImportComplete = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportCard
            visible={true}
            onClose={jest.fn()}
            onImportComplete={onImportComplete}
          />
        );
      });

      const dropZone = tree!.root.findByProps({ testID: "select-csv-file-button" });
      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });

      // Rapidly trigger clicks 30 times
      await act(async () => {
        for (let i = 0; i < 30; i++) {
          if (!dropZone.props.disabled) {
            dropZone.props.onPress();
          }
          if (!startBtn.props.disabled) {
            startBtn.props.onPress();
          }
        }
      });

      // Complete timer
      await act(async () => {
        jest.advanceTimersByTime(1500);
        await Promise.resolve();
      });

      // importCSV should be called exactly ONCE
      expect(adminService.importCSV).toHaveBeenCalledTimes(1);
    });

    it("blocks modal dismissal via handleClose while import uploading is active", async () => {
      const onClose = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportCard
            visible={true}
            onClose={onClose}
            onImportComplete={jest.fn()}
          />
        );
      });

      // Start import
      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      // Press backdrop while uploading
      const scrim = tree!.root.findByType("Pressable" as any);
      await act(async () => {
        scrim.props.onPress();
      });

      // Close should NOT be called during upload
      expect(onClose).not.toHaveBeenCalled();

      // Finish import
      await act(async () => {
        jest.advanceTimersByTime(1500);
        await Promise.resolve();
      });

      // Now onClose is called when import finishes
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("EMPIRICAL TEST: checks unmounting during active progress animation (500ms into 1400ms)", async () => {
      const onImportComplete = jest.fn();
      const onClose = jest.fn();
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

      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      // Advance timers partially (500ms into 1400ms upload animation)
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Unmount mid-progress
      await act(async () => {
        tree.unmount();
      });

      // Advance remaining timers post-unmount
      await act(async () => {
        jest.advanceTimersByTime(1500);
        await Promise.resolve();
      });

      // Verify whether animation callback executed after unmount
      // Note: If component doesn't cancel animation on unmount, onClose/onImportComplete get called on unmounted instance
      expect(onImportComplete).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. CSV IMPORT DATA BOUNDARIES & ERROR HANDLING
  // =========================================================================
  describe("3. CSV Import Data Boundaries & API Error Handling", () => {
    it("handles importCSV service exception gracefully without crashing component", async () => {
      (adminService.importCSV as jest.Mock).mockRejectedValueOnce(
        new Error("Database connection error during CSV ingestion")
      );

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

      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
        await Promise.resolve();
      });

      // Falls back to default counts when service rejects
      expect(onClose).toHaveBeenCalled();
      expect(onImportComplete).toHaveBeenCalledWith({
        success: 124,
        skipped: 3,
        errors: 1,
      });
    });

    it("handles null or undefined return value from importCSV gracefully", async () => {
      (adminService.importCSV as jest.Mock).mockResolvedValueOnce(null);

      const onImportComplete = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportCard
            visible={true}
            onClose={jest.fn()}
            onImportComplete={onImportComplete}
          />
        );
      });

      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      await act(async () => {
        jest.advanceTimersByTime(1500);
        await Promise.resolve();
      });

      // Uses default counts { success: 124, skipped: 3, errors: 1 }
      expect(onImportComplete).toHaveBeenCalledWith({
        success: 124,
        skipped: 3,
        errors: 1,
      });
    });

    it("renders CsvImportResultModal with zero data counts (0 success, 0 skipped, 0 errors)", async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportResultModal
            visible={true}
            onClose={jest.fn()}
            counts={{ success: 0, skipped: 0, errors: 0 }}
          />
        );
      });

      const descNode = tree!.root.find(
        (node: any) =>
          node.props &&
          node.props.children &&
          Array.isArray(node.props.children) &&
          node.props.children[0] === "Đã xử lý " &&
          node.props.children[1] === 0
      );
      expect(descNode).toBeDefined();
    });

    it("renders CsvImportResultModal with missing/undefined counts prop using fallback values", async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportResultModal visible={true} onClose={jest.fn()} counts={undefined} />
        );
      });

      const card = tree!.root.findByProps({ testID: "admin-import-result" });
      expect(card).toBeDefined();

      // Total = 124 + 3 + 1 = 128
      const descNode = tree!.root.find(
        (node: any) =>
          node.props &&
          node.props.children &&
          Array.isArray(node.props.children) &&
          node.props.children[0] === "Đã xử lý " &&
          node.props.children[1] === 128
      );
      expect(descNode).toBeDefined();
    });

    it("triggers onClose and onDone when clicking Hoàn tất button in CsvImportResultModal", async () => {
      const onClose = jest.fn();
      const onDone = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportResultModal
            visible={true}
            onClose={onClose}
            onDone={onDone}
            counts={{ success: 50, skipped: 2, errors: 0 }}
          />
        );
      });

      const doneBtn = tree!.root.findByProps({ testID: "import-done-button" });

      // Rapidly click 10 times
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          doneBtn.props.onPress();
        });
      }

      expect(onClose).toHaveBeenCalledTimes(10);
      expect(onDone).toHaveBeenCalledTimes(10);
    });
  });

  // =========================================================================
  // 4. MANAGEMENT SCREEN E2E STRESS & INTEGRATION
  // =========================================================================
  describe("4. ManagementScreen E2E Stress & Integration", () => {
    it("handles rapid sub-tab toggles (plots -> crops -> accounts) while performing live search", async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
        await Promise.resolve();
      });

      const plotsSubTab = tree!.root.findByProps({ testID: "admin-plots" });
      const cropsSubTab = tree!.root.findByProps({ testID: "admin-crops" });
      const accountsSubTab = tree!.root.findByProps({ testID: "admin-accounts" });
      const searchInput = tree!.root.findByProps({ testID: "search-input" });

      // Rapid tab switching with search query changes
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          cropsSubTab.props.onPress();
          searchInput.props.onChangeText("Cà");
        });
        await act(async () => {
          accountsSubTab.props.onPress();
          searchInput.props.onChangeText("a@farm");
        });
        await act(async () => {
          plotsSubTab.props.onPress();
          searchInput.props.onChangeText("L-001");
        });
      }

      expect(tree!.root.findByProps({ testID: "management-screen" })).toBeDefined();
    });

    it("triggers full CSV import flow from ManagementScreen and refreshes data on done", async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
        await Promise.resolve();
      });

      // 1. Click Import CSV trigger button
      const importTrigger = tree!.root.findByProps({ testID: "import-csv-trigger" });
      await act(async () => {
        importTrigger.props.onPress();
      });

      // 2. Click Start Import in CsvImportCard
      const startImportBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startImportBtn.props.onPress();
      });

      // 3. Fast-forward upload animation (1400ms)
      await act(async () => {
        jest.advanceTimersByTime(1500);
        await Promise.resolve();
      });

      // 4. Click Hoàn tất in CsvImportResultModal
      const doneBtn = tree!.root.findByProps({ testID: "import-done-button" });
      await act(async () => {
        doneBtn.props.onPress();
        await Promise.resolve();
      });

      // Verify getPlots was called again (refreshData)
      expect(adminService.getPlots).toHaveBeenCalled();
    });

    it("triggers open sidebar from ManagementScreen top header menu button", async () => {
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
        await Promise.resolve();
      });

      const menuBtn = tree!.root.findByProps({ testID: "open-sidebar-button" });
      await act(async () => {
        menuBtn.props.onPress();
        jest.advanceTimersByTime(300);
      });

      const sidebar = tree!.root.findByProps({ testID: "admin-sidebar" });
      expect(sidebar).toBeDefined();
    });
  });
});
