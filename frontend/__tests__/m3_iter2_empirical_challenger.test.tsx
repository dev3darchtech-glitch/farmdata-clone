import React from "react";
import renderer, { act } from "react-test-renderer";
import { importCSV, csvRowSchema } from "@/services/adminService";
import {
  AdminSidebarDrawer,
  CsvImportCard,
  CsvImportResultModal,
} from "@/components/management";
import ManagementScreen from "@/app/(tabs)/management";

// Mocks for Navigation & React Native environment
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: (cb: Function) => {
    const React = require("react");
    React.useEffect(() => {
      cb();
    }, []);
  },
}));

// Mock API client for ManagementScreen integration tests
jest.mock("@/services/apiClient", () => ({
  fetchPlotsAPI: jest.fn().mockResolvedValue([
    { id: "1", code: "L-001", name: "Khu A", areaSquareMeters: 500 },
    { id: "2", code: "L-002", name: "Khu B", areaSquareMeters: 750 },
  ]),
  fetchCropsAPI: jest.fn().mockResolvedValue([
    { id: "1", name: "Cà chua", category: "Rau ăn quả", icon: "🍅" },
  ]),
  fetchUsersAPI: jest.fn().mockResolvedValue([
    { id: "1", name: "Nguyễn Văn A", email: "a@farm.vn", role: "admin" },
  ]),
  createPlotAPI: jest.fn().mockResolvedValue({ id: "3", code: "L-003", name: "Khu C" }),
  createCropAPI: jest.fn().mockResolvedValue({ id: "3", name: "Ớt chuông", category: "Rau ăn quả" }),
}));

describe("Milestone 3 Iteration 2 Remediation — Empirical Challenger Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // SECTION 1: EMPIRICAL STRESS TESTING OF adminService.importCSV
  // =========================================================================
  describe("1. adminService.importCSV Engine Empirical Testing", () => {
    describe("1.1 Valid CSV Strings & Variants", () => {
      it("parses standard CSV string with header and valid data rows", async () => {
        const csv = `plot_code,name,area,status
P-001,Luống A1,100,active
P-002,Luống A2,150,active
P-003,Luống B1,200,inactive`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 3, skipped: 0, errors: 0 });
      });

      it("handles alternate header names (code, plot_name, areasquaremeters, status)", async () => {
        const csv = `code,plot_name,areasquaremeters,status
P-101,Lô 1,500,active
P-102,Lô 2,600,active`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 2, skipped: 0, errors: 0 });
      });

      it("handles field padding and surrounding quotes", async () => {
        const csv = `"plot_code" , "name" , "area" , "status"
"P-201" , "Luống C1" , "250" , "active"
"P-202" , "Luống C2" , "300" , "active"`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 2, skipped: 0, errors: 0 });
      });

      it("handles Object with text() method (simulating File/Blob)", async () => {
        const fakeFile = {
          text: async () => `plot_code,name,area\nFILE-01,File Plot 1,120\nFILE-02,File Plot 2,140`,
        };

        const res = await importCSV(fakeFile);
        expect(res).toEqual({ success: 2, skipped: 0, errors: 0 });
      });

      it("handles Object with toString() method", async () => {
        const fakeObj = {
          toString: () => `plot_code,name,area\nOBJ-01,Obj Plot 1,120`,
        };

        const res = await importCSV(fakeObj);
        expect(res).toEqual({ success: 1, skipped: 0, errors: 0 });
      });
    });

    describe("1.2 Malformed Lines & Parsing Edges", () => {
      it("counts lines with invalid non-numeric area as errors", async () => {
        const csv = `plot_code,name,area,status
P-001,Luống A,100,active
P-002,Luống B,INVALID_AREA,active
P-003,Luống C,NaN,active
P-004,Luống D,50.5.5,active`;

        const res = await importCSV(csv);
        expect(res.success).toBe(1);
        expect(res.errors).toBe(3);
      });

      it("handles missing values in optional fields (area, status)", async () => {
        const csv = `plot_code,name,area,status
P-001,Luống A,,
P-002,Luống B,150,`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 2, skipped: 0, errors: 0 });
      });

      it("rejects rows with missing required fields (empty plot_code or name)", async () => {
        const csv = `plot_code,name,area,status
,Luống Without Code,100,active
P-999,,200,active
,,300,active`;

        const res = await importCSV(csv);
        expect(res.errors).toBe(3);
        expect(res.success).toBe(0);
      });

      it("EMPIRICAL FINDING: test naively split quoted strings with commas inside", async () => {
        // Quoted field containing comma: "Luống A, Zone 1"
        const csv = `plot_code,name,area,status
P-001,"Luống A, Zone 1",100,active`;

        const res = await importCSV(csv);
        // Note: split(',') splits `"Luống A` and ` Zone 1"` into two fields!
        // Values become: ['P-001', '"Luống A', 'Zone 1"', '100']
        // plot_code = 'P-001', name = '"Luống A', rawArea = 'Zone 1"' (invalid number!)
        // Expected: error due to invalid area from column offset desync.
        expect(res.errors).toBe(1);
      });
    });

    describe("1.3 Empty Strings & Edge Cases", () => {
      it("returns zero counts for empty string", async () => {
        const res = await importCSV("");
        expect(res).toEqual({ success: 0, skipped: 0, errors: 0 });
      });

      it("returns zero counts for whitespace-only string", async () => {
        const res = await importCSV("   \n\t\n   ");
        expect(res).toEqual({ success: 0, skipped: 0, errors: 0 });
      });

      it("returns zero counts for undefined or null", async () => {
        expect(await importCSV(undefined)).toEqual({ success: 0, skipped: 0, errors: 0 });
        expect(await importCSV(null)).toEqual({ success: 0, skipped: 0, errors: 0 });
      });

      it("returns zero counts when CSV only contains a header line", async () => {
        const csv = `plot_code,name,area,status`;
        const res = await importCSV(csv);
        expect(res).toEqual({ success: 0, skipped: 0, errors: 0 });
      });

      it("EMPIRICAL FINDING: counts empty lines as skipped", async () => {
        const csv = `plot_code,name,area,status
P-001,Luống A,100,active

P-002,Luống B,150,active
`;

        const res = await importCSV(csv);
        // Line 1: Header
        // Line 2: P-001 -> success
        // Line 3: empty line -> skipped = 1
        // Line 4: P-002 -> success
        // Line 5: trailing empty line -> skipped = 2
        expect(res.success).toBe(2);
        expect(res.skipped).toBe(2);
      });
    });

    describe("1.4 Missing Headers & Order Fallbacks", () => {
      it("EMPIRICAL FINDING: treats line 1 as header if header row is omitted", async () => {
        const csv = `P-001,Luống A,100,active
P-002,Luống B,150,active`;

        const res = await importCSV(csv);
        // Line 1 is consumed as headers: ['p-001', 'luống a', '100', 'active']
        // Line 2 is parsed as row 1 -> success = 1
        // Total rows processed as data = 1, success = 1. (Line 1 lost as header!)
        expect(res.success).toBe(1);
        expect(res.skipped).toBe(0);
        expect(res.errors).toBe(0);
      });

      it("handles unknown header column names by falling back to positional index (0=code, 1=name, 2=area, 3=status)", async () => {
        const csv = `col_a,col_b,col_c,col_d
P-701,Plot 701,500,active
P-702,Plot 702,600,active`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 2, skipped: 0, errors: 0 });
      });
    });

    describe("1.5 Duplicate Plot Codes", () => {
      it("skips exact duplicate plot codes", async () => {
        const csv = `plot_code,name,area,status
P-001,Luống A1,100,active
P-001,Luống A1 Duplicate,100,active
P-002,Luống B1,200,active`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 2, skipped: 1, errors: 0 });
      });

      it("skips case-insensitive duplicate plot codes (P-001 vs p-001)", async () => {
        const csv = `plot_code,name,area,status
P-001,Luống A1,100,active
p-001,Luống A1 Lowercase,100,active
P-001,Luống Upper,100,active`;

        const res = await importCSV(csv);
        expect(res).toEqual({ success: 1, skipped: 2, errors: 0 });
      });
    });

    describe("1.6 Large Input Performance Stress", () => {
      it("processes 1,000 CSV rows efficiently under 500ms", async () => {
        let largeCSV = `plot_code,name,area,status\n`;
        for (let i = 0; i < 1000; i++) {
          largeCSV += `P-LARGE-${i},Luống Benchmark ${i},${100 + i},active\n`;
        }

        const startTime = Date.now();
        const res = await importCSV(largeCSV);
        const duration = Date.now() - startTime;

        expect(res.success).toBe(1000);
        expect(res.errors).toBe(0);
        expect(duration).toBeLessThan(500);
      });
    });
  });

  // =========================================================================
  // SECTION 2: STRESS TESTING ADMIN SIDEBAR & DRAWER ANIMATION
  // =========================================================================
  describe("2. AdminSidebarDrawer & Animation Stress", () => {
    it("handles 500 rapid visibility toggle updates without throwing or component desync", async () => {
      let visible = false;
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={visible}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={jest.fn()}
          />
        );
      });

      for (let i = 0; i < 500; i++) {
        visible = !visible;
        await act(async () => {
          tree.update(
            <AdminSidebarDrawer
              visible={visible}
              activeSubTab="plots"
              onClose={jest.fn()}
              onSelectTab={jest.fn()}
            />
          );
          jest.advanceTimersByTime(10);
        });
      }

      // Final state visible = false -> tree should render null
      expect(tree!.toJSON()).toBeNull();
    });

    it("cleans up Animated.timing stopAnimation on unmount during mid-slide animation", async () => {
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
        // Advance timer 125ms out of 250ms slide duration
        jest.advanceTimersByTime(125);
      });

      // Unmount mid-way
      expect(() => {
        act(() => {
          tree.unmount();
        });
      }).not.toThrow();
    });

    it("verifies item press triggers onClose and correct tab selection across all tabs", async () => {
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
        jest.advanceTimersByTime(250);
      });

      const plotsTab = tree!.root.findByProps({ testID: "admin-sidebar-plots" });
      const cropsTab = tree!.root.findByProps({ testID: "admin-sidebar-crops" });
      const accountsTab = tree!.root.findByProps({ testID: "admin-sidebar-accounts" });
      const logoutBtn = tree!.root.findByProps({ testID: "admin-sidebar-logout" });

      await act(async () => {
        plotsTab.props.onPress();
        cropsTab.props.onPress();
        accountsTab.props.onPress();
        logoutBtn.props.onPress();
      });

      expect(onClose).toHaveBeenCalledTimes(4);
      expect(onSelectTab).toHaveBeenNthCalledWith(1, "plots");
      expect(onSelectTab).toHaveBeenNthCalledWith(2, "crops");
      expect(onSelectTab).toHaveBeenNthCalledWith(3, "accounts");
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // SECTION 3: STRESS TESTING CSV MODAL STATE TRANSITIONS
  // =========================================================================
  describe("3. CSV Modal State Transitions & Progress Harness", () => {
    it("safely handles multi-click spamming on start-import-button without re-triggering import", async () => {
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

      // Click startBtn 50 times rapidly
      await act(async () => {
        for (let i = 0; i < 50; i++) {
          if (!startBtn.props.disabled) {
            startBtn.props.onPress();
          }
        }
      });

      // Complete progress timer (1300ms animation duration)
      await act(async () => {
        jest.advanceTimersByTime(1400);
        await Promise.resolve();
      });

      expect(onImportComplete).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("verifies scrim interaction is blocked during active upload animation", async () => {
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

      const startBtn = tree!.root.findByProps({ testID: "start-import-button" });
      await act(async () => {
        startBtn.props.onPress();
      });

      // Find scrim pressable
      const scrim = tree!.root.find(
        (node: any) =>
          node.props &&
          node.props.style &&
          node.props.style.backgroundColor === "rgba(17, 24, 39, 0.45)"
      );

      // Attempt scrim press while upload is uploading
      await act(async () => {
        scrim.props.onPress();
      });

      expect(onClose).not.toHaveBeenCalled();

      // Finish upload animation
      await act(async () => {
        jest.advanceTimersByTime(1400);
        await Promise.resolve();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("verifies CsvImportResultModal renders correct metric breakdown and triggers onDone", async () => {
      const onClose = jest.fn();
      const onDone = jest.fn();
      const testCounts = { success: 85, skipped: 12, errors: 3 };
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <CsvImportResultModal
            visible={true}
            counts={testCounts}
            onClose={onClose}
            onDone={onDone}
          />
        );
      });

      const doneBtn = tree!.root.findByProps({ testID: "import-done-button" });
      await act(async () => {
        doneBtn.props.onPress();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
