import React from "react";
import renderer, { act } from "react-test-renderer";
import {
  AddPlotModal,
  AddCropModal,
  AdminSidebarDrawer,
} from "@/components/management";
import ManagementScreen from "@/app/(tabs)/management";
import { plotFormSchema, cropFormSchema } from "@/schemas/formSchemas";
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
    { id: "1", code: "L-001", name: "Khu A", areaSquareMeters: 100 },
    { id: "2", code: "L-002", name: "Khu B", areaSquareMeters: 150 },
  ]),
  getCropTypes: jest.fn().mockResolvedValue([
    { id: "1", name: "Cà chua", category: "Rau ăn quả", icon: "🍅" },
    { id: "2", name: "Dưa lưới", category: "Rau ăn quả", icon: "🍈" },
  ]),
  getUsers: jest.fn().mockResolvedValue([
    { id: "1", name: "Nguyễn Văn A", email: "a@farm.vn", role: "farmer" },
    { id: "2", name: "Trần Thị B", email: "b@farm.vn", role: "admin" },
  ]),
  addPlot: jest.fn().mockImplementation(async (data) => ({
    id: "3",
    code: data.code,
    name: data.name,
    areaSquareMeters: data.areaSquareMeters || 0,
  })),
  addCropType: jest.fn().mockImplementation(async (data) => ({
    id: "3",
    name: data.name,
    category: data.category || "Rau ăn quả",
    icon: data.icon || "🌿",
  })),
  importCSV: jest.fn().mockResolvedValue({ success: 124, skipped: 3, errors: 1 }),
}));

const findTotalCountText = (root: any, expectedCount: number) => {
  const textNodes = root.findAllByType("Text" as any);
  return textNodes.find((node: any) => {
    const c = node.props.children;
    const str = Array.isArray(c) ? c.join("") : String(c);
    return str.includes("TỔNG SỐ:") && str.includes(String(expectedCount));
  });
};

describe("Challenger M2-1 Empirical Verification Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // 1. Sub-Tab Switching (Plots, Crops, Accounts)
  // ------------------------------------------------------------------
  describe("1. Sub-Tab Switching (Plots, Crops, Accounts)", () => {
    it("renders initial Plots tab with correct counts, placeholder, and table header", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });
      expect(searchInput.props.placeholder).toBe("Tìm mã luống");

      const totalLabel = findTotalCountText(tree!.root, 2);
      expect(totalLabel).toBeDefined();

      const headerText = tree!.root.findAllByType("Text" as any).find(
        (node: any) => node.props.children === "Mã số luống"
      );
      expect(headerText).toBeDefined();
    });

    it("switches to Crops sub-tab when pressing admin-crops button", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const cropsBtn = tree!.root.findByProps({ testID: "admin-crops" });
      await act(async () => {
        cropsBtn.props.onPress();
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });
      expect(searchInput.props.placeholder).toBe("Tìm loại cây");

      const headerText = tree!.root.findAllByType("Text" as any).find(
        (node: any) => node.props.children === "Loại cây"
      );
      expect(headerText).toBeDefined();
    });

    it("switches to Accounts sub-tab when pressing admin-accounts button", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const accountsBtn = tree!.root.findByProps({ testID: "admin-accounts" });
      await act(async () => {
        accountsBtn.props.onPress();
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });
      expect(searchInput.props.placeholder).toBe("Tìm tài khoản");

      const headerText = tree!.root.findAllByType("Text" as any).find(
        (node: any) => node.props.children === "Tài khoản"
      );
      expect(headerText).toBeDefined();
    });

    it("resets search query when switching sub-tabs", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });
      await act(async () => {
        searchInput.props.onChangeText("L-001");
      });
      expect(searchInput.props.value).toBe("L-001");

      // Switch sub-tab to crops
      const cropsBtn = tree!.root.findByProps({ testID: "admin-crops" });
      await act(async () => {
        cropsBtn.props.onPress();
      });

      const updatedSearchInput = tree!.root.findByProps({ testID: "search-input" });
      expect(updatedSearchInput.props.value).toBe("");
    });

    it("switches sub-tabs via AdminSidebarDrawer onSelectTab callback", async () => {
      const onSelectTab = jest.fn();
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={jest.fn()}
            onSelectTab={onSelectTab}
          />
        );
      });

      const textNodes = tree!.root.findAllByType("Text" as any);
      const cropTextNode = textNodes.find(
        (n: any) => n.props.children === "Quản lý loại cây"
      );
      expect(cropTextNode).toBeDefined();

      let cropsLink: any = cropTextNode ? cropTextNode.parent : null;
      while (cropsLink && typeof cropsLink.props.onPress !== "function") {
        cropsLink = cropsLink.parent;
      }
      expect(cropsLink).toBeDefined();

      await act(async () => {
        cropsLink.props.onPress();
      });

      expect(onSelectTab).toHaveBeenCalledWith("crops");
    });
  });

  // ------------------------------------------------------------------
  // 2. Form Submission Validation (Add Plot & Add Crop Modals)
  // ------------------------------------------------------------------
  describe("2. Form Submission Validation (Add Plot & Add Crop Modals)", () => {
    describe("AddPlotModal Zod Validation & Submission", () => {
      it("validates plot schema correctly with Zod", () => {
        const invalidEmpty = plotFormSchema.safeParse({ code: "", name: "" });
        expect(invalidEmpty.success).toBe(false);
        if (!invalidEmpty.success) {
          const codeErr = invalidEmpty.error.issues.find((i) => i.path.includes("code"));
          const nameErr = invalidEmpty.error.issues.find((i) => i.path.includes("name"));
          expect(codeErr?.message).toBe("Mã số luống là bắt buộc");
          expect(nameErr?.message).toBe("Tên lô / luống là bắt buộc");
        }

        const validPlot = plotFormSchema.safeParse({
          code: "L-005",
          name: "Khu C",
          areaSquareMeters: 200,
        });
        expect(validPlot.success).toBe(true);
      });

      it("trims and converts code to uppercase on submit in ManagementScreen", async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
          tree = renderer.create(<ManagementScreen />);
        });

        // Open Add Plot modal
        const addBtn = tree!.root.findByProps({ testID: "add-new-trigger" });
        await act(async () => {
          addBtn.props.onPress();
        });

        const codeInput = tree!.root.findByProps({ testID: "add-plot-code-input" });
        const nameInput = tree!.root.findByProps({ testID: "add-plot-name-input" });

        await act(async () => {
          codeInput.props.onChangeText("  l-009  ");
          nameInput.props.onChangeText("  Khu D  ");
        });

        const submitBtn = tree!.root.findByProps({ testID: "submit-add-plot-button" });
        await act(async () => {
          await submitBtn.props.onPress();
        });

        expect(adminService.addPlot).toHaveBeenCalledWith({
          code: "L-009",
          name: "Khu D",
          areaSquareMeters: undefined,
        });
      });
    });

    describe("AddCropModal Zod Validation & Submission", () => {
      it("validates crop schema correctly with Zod", () => {
        const invalidEmpty = cropFormSchema.safeParse({ name: "", category: "Rau" });
        expect(invalidEmpty.success).toBe(false);
        if (!invalidEmpty.success) {
          const nameErr = invalidEmpty.error.issues.find((i) => i.path.includes("name"));
          expect(nameErr?.message).toBe("Tên loại cây là bắt buộc");
        }

        const validCrop = cropFormSchema.safeParse({
          name: "Ớt chuông",
          category: "Rau ăn quả",
        });
        expect(validCrop.success).toBe(true);
      });

      it("trims crop name and uses default fallback category 'Rau ăn quả' if category is blank", async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
          tree = renderer.create(<ManagementScreen />);
        });

        // Switch to crops sub-tab first
        const cropsBtn = tree!.root.findByProps({ testID: "admin-crops" });
        await act(async () => {
          cropsBtn.props.onPress();
        });

        // Open Add Crop modal
        const addBtn = tree!.root.findByProps({ testID: "add-new-trigger" });
        await act(async () => {
          addBtn.props.onPress();
        });

        const nameInput = tree!.root.findByProps({ testID: "add-crop-name-input" });
        const categoryInput = tree!.root.findByProps({ testID: "add-crop-category-input" });

        await act(async () => {
          nameInput.props.onChangeText("  Bắp cải  ");
          categoryInput.props.onChangeText("   ");
        });

        const submitBtn = tree!.root.findByProps({ testID: "submit-add-crop-button" });
        await act(async () => {
          await submitBtn.props.onPress();
        });

        expect(adminService.addCropType).toHaveBeenCalledWith({
          name: "Bắp cải",
          category: "Rau ăn quả",
          icon: "🌿",
        });
      });
    });
  });

  // ------------------------------------------------------------------
  // 3. Search Queries (Filtering & Edge Cases)
  // ------------------------------------------------------------------
  describe("3. Search Queries (Filtering & Edge Cases)", () => {
    it("filters plots by code or name case-insensitively", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });

      // Filter by code lower-case
      await act(async () => {
        searchInput.props.onChangeText("l-001");
      });
      let totalLabel = findTotalCountText(tree!.root, 1);
      expect(totalLabel).toBeDefined();

      // Filter by name
      await act(async () => {
        searchInput.props.onChangeText("khu b");
      });
      totalLabel = findTotalCountText(tree!.root, 1);
      expect(totalLabel).toBeDefined();
    });

    it("filters crops by name or category case-insensitively", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const cropsBtn = tree!.root.findByProps({ testID: "admin-crops" });
      await act(async () => {
        cropsBtn.props.onPress();
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });

      await act(async () => {
        searchInput.props.onChangeText("cà chua");
      });
      const totalLabel = findTotalCountText(tree!.root, 1);
      expect(totalLabel).toBeDefined();
    });

    it("filters accounts by name or email case-insensitively", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const accountsBtn = tree!.root.findByProps({ testID: "admin-accounts" });
      await act(async () => {
        accountsBtn.props.onPress();
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });

      await act(async () => {
        searchInput.props.onChangeText("b@farm.vn");
      });
      const totalLabel = findTotalCountText(tree!.root, 1);
      expect(totalLabel).toBeDefined();
    });

    it("handles special characters in search input without regex crash", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const searchInput = tree!.root.findByProps({ testID: "search-input" });
      const specialQuery = "[.*+?^${}()|\\/]";

      await act(async () => {
        expect(() => {
          searchInput.props.onChangeText(specialQuery);
        }).not.toThrow();
      });

      const totalLabel = findTotalCountText(tree!.root, 0);
      expect(totalLabel).toBeDefined();
    });
  });

  // ------------------------------------------------------------------
  // 4. Service Integrations (adminService.ts)
  // ------------------------------------------------------------------
  describe("4. Service Integrations (adminService.ts)", () => {
    it("calls getPlots, getCropTypes, and getUsers on screen load", async () => {
      await act(async () => {
        renderer.create(<ManagementScreen />);
      });

      expect(adminService.getPlots).toHaveBeenCalled();
      expect(adminService.getCropTypes).toHaveBeenCalled();
      expect(adminService.getUsers).toHaveBeenCalled();
    });

    it("handles error in adminService APIs gracefully without breaking screen render", async () => {
      (adminService.getPlots as jest.Mock).mockRejectedValueOnce(
        new Error("Network disconnect")
      );

      const spyConsoleErr = jest.spyOn(console, "error").mockImplementation(() => {});

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      expect(tree!.root.findByProps({ testID: "management-screen" })).toBeDefined();
      spyConsoleErr.mockRestore();
    });
  });
});
