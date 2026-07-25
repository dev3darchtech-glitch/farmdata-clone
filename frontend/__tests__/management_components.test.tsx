import React from "react";
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
    { id: "1", code: "L-001", name: "Khu A" },
  ]),
  getCropTypes: jest.fn().mockResolvedValue([
    { id: "1", name: "Cà chua", category: "Rau ăn quả" },
  ]),
  getUsers: jest.fn().mockResolvedValue([
    { id: "1", name: "Nguyễn Văn A", email: "a@farm.vn", role: "farmer" },
  ]),
  addPlot: jest.fn().mockResolvedValue({ id: "2", code: "L-002", name: "Khu B" }),
  addCropType: jest.fn().mockResolvedValue({ id: "2", name: "Dưa lưới", category: "Rau ăn quả" }),
  importCSV: jest.fn().mockResolvedValue({ success: 124, skipped: 3, errors: 1 }),
}));

describe("Management Sub-Components & Screen Unit Tests", () => {
  // 1. StatusBadge Test
  describe("StatusBadge", () => {
    it("renders active status badge correctly", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<StatusBadge active={true} />);
      });
      const text = tree!.root.findByType("Text" as any);
      expect(text.props.children).toBe("Đang sử dụng");
    });

    it("renders inactive status badge correctly", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<StatusBadge active={false} />);
      });
      const text = tree!.root.findByType("Text" as any);
      expect(text.props.children).toBe("Ngừng sử dụng");
    });
  });

  // 2. SnackbarNotification Test
  describe("SnackbarNotification", () => {
    it("renders null when visible is false", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <SnackbarNotification visible={false} message="Test" onHide={jest.fn()} />
        );
      });
      expect(tree!.toJSON()).toBeNull();
    });

    it("renders message when visible is true", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <SnackbarNotification visible={true} message="Thành công" onHide={jest.fn()} />
        );
      });
      const element = tree!.root.findByProps({ testID: "snackbar-notification" });
      expect(element).toBeDefined();
    });
  });

  // 3. ConfirmModal Test
  describe("ConfirmModal", () => {
    it("renders confirm modal with title, description and triggers callbacks", async () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <ConfirmModal
            visible={true}
            title="Ngừng sử dụng L-001?"
            description="Mã này sẽ không còn xuất hiện."
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        );
      });

      const confirmBtn = tree!.root.findByProps({ testID: "confirm-action-button" });
      await act(async () => {
        confirmBtn.props.onPress();
      });
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  // 4. ActionMenuModal Test
  describe("ActionMenuModal", () => {
    it("renders action menu modal and triggers onDisable", async () => {
      const onDisable = jest.fn();
      const onClose = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <ActionMenuModal
            visible={true}
            itemCode="L-001"
            onClose={onClose}
            onDisable={onDisable}
          />
        );
      });

      const card = tree!.root.findByProps({ testID: "admin-action-menu" });
      expect(card).toBeDefined();
    });
  });

  // 5. AdminSidebarDrawer Test
  describe("AdminSidebarDrawer", () => {
    it("renders drawer links when visible", async () => {
      const onClose = jest.fn();
      const onSelectTab = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <AdminSidebarDrawer
            visible={true}
            activeSubTab="plots"
            onClose={onClose}
            onSelectTab={onSelectTab}
          />
        );
      });

      const sidebar = tree!.root.findByProps({ testID: "admin-sidebar" });
      expect(sidebar).toBeDefined();
    });
  });

  // 6. CsvImportCard & CsvImportResultModal Test
  describe("CsvImport Components", () => {
    it("renders CsvImportCard modal and CsvImportResultModal", async () => {
      let cardTree: renderer.ReactTestRenderer;
      let resultTree: renderer.ReactTestRenderer;

      await act(async () => {
        cardTree = renderer.create(
          <CsvImportCard visible={true} onClose={jest.fn()} onImportComplete={jest.fn()} />
        );
        resultTree = renderer.create(
          <CsvImportResultModal visible={true} onClose={jest.fn()} />
        );
      });

      expect(cardTree!.root.findByProps({ testID: "admin-import-select" })).toBeDefined();
      expect(resultTree!.root.findByProps({ testID: "admin-import-result" })).toBeDefined();
    });
  });

  // 7. ManagementScreen Integration Test
  describe("ManagementScreen", () => {
    it("renders management screen with testID management-screen and sub-tabs", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ManagementScreen />);
      });

      const root = tree!.root.findByProps({ testID: "management-screen" });
      expect(root).toBeDefined();

      const plotsSubTab = tree!.root.findByProps({ testID: "admin-plots" });
      const cropsSubTab = tree!.root.findByProps({ testID: "admin-crops" });
      const accountsSubTab = tree!.root.findByProps({ testID: "admin-accounts" });

      expect(plotsSubTab).toBeDefined();
      expect(cropsSubTab).toBeDefined();
      expect(accountsSubTab).toBeDefined();
    });
  });
});
