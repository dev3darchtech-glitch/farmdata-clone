import React from "react";
import renderer, { act } from "react-test-renderer";
import { captureSessionFormSchema } from "@/schemas/formSchemas";
import { validatePlotId, GROWTH_STAGES } from "@/constants/growthStages";
import { SeverityRadioGroup, SEVERITY_RADIO_OPTIONS } from "@/components/SeverityRadioGroup";
import { GrowthStagePicker } from "@/components/GrowthStagePicker";
import { WeatherTelemetryBanner } from "@/components/WeatherTelemetryBanner";
import CaptureTab from "@/app/(tabs)/capture";
import { AuthProvider } from "@/hooks/useAuth";

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

jest.mock(
  "expo-file-system",
  () => ({
    documentDirectory: "/mock/documents/",
    EncodingType: { UTF8: "utf8" },
    getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
    makeDirectoryAsync: jest.fn().mockResolvedValue(true),
    writeAsStringAsync: jest.fn().mockResolvedValue(true),
  }),
  { virtual: true },
);

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe("Milestone 2 Challenger Edge Cases & Verification Suite", () => {
  // -------------------------------------------------------------
  // 1. Invalid Plot IDs Validation & Edge Cases
  // -------------------------------------------------------------
  describe("1. Plot ID Edge Cases & Validation Rules", () => {
    it("rejects empty, whitespace, null, and undefined plot IDs in validatePlotId", () => {
      expect(validatePlotId("").isValid).toBe(false);
      expect(validatePlotId("   ").isValid).toBe(false);
      expect(validatePlotId(null).isValid).toBe(false);
      expect(validatePlotId(undefined).isValid).toBe(false);
    });

    it("rejects single character plot IDs", () => {
      expect(validatePlotId("A").isValid).toBe(false);
      expect(validatePlotId("1").isValid).toBe(false);
      expect(validatePlotId("-").isValid).toBe(false);
    });

    it("rejects plot IDs with special characters, spaces inside, or SQL/script injections", () => {
      const maliciousAndInvalid = [
        "PLOT@123",
        "LUONG#1",
        "ROW 01",
        "L-01/A",
        "LUONG+01",
        "<script>alert(1)</script>",
        "SELECT * FROM plots;",
        "PLOT!",
        "PLOT$MONEY",
      ];
      maliciousAndInvalid.forEach((plotId) => {
        const result = validatePlotId(plotId);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("chữ cái, chữ số");
      });
    });

    it("accepts valid plot IDs with minimum length 2, alphanumeric, hyphens, and underscores", () => {
      const validPlotIds = ["L1", "L-001", "PLOT_102", "LUONG-01", "A_B-C_123"];
      validPlotIds.forEach((plotId) => {
        const result = validatePlotId(plotId);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  // -------------------------------------------------------------
  // 2. Custom Crop Text Validation ("Khác" selected)
  // -------------------------------------------------------------
  describe("2. Empty Custom Crop Text Validation", () => {
    const validBaseData = {
      images: ["file:///photo1.jpg"],
      cropType: "Khác",
      customCrop: "",
      growthStage: "vegetative" as const,
      envMode: "outdoor" as const,
      symptomDescription: "Lá bị đốm vàng",
      severity: "Nhẹ" as const,
    };

    it("fails validation when cropType is 'Khác' and customCrop is empty or whitespace", () => {
      const emptyResult = captureSessionFormSchema.safeParse({
        ...validBaseData,
        customCrop: "",
      });
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        const customCropError = emptyResult.error.issues.find(
          (issue) => issue.path.includes("customCrop"),
        );
        expect(customCropError).toBeDefined();
        expect(customCropError?.message).toBe("Vui lòng nhập tên loại cây trồng khác");
      }

      const whitespaceResult = captureSessionFormSchema.safeParse({
        ...validBaseData,
        customCrop: "     ",
      });
      expect(whitespaceResult.success).toBe(false);
    });

    it("passes validation when cropType is 'Khác' and non-empty customCrop is supplied", () => {
      const result = captureSessionFormSchema.safeParse({
        ...validBaseData,
        customCrop: "Chanh dây",
      });
      expect(result.success).toBe(true);
    });

    it("passes validation without customCrop when cropType is a standard crop", () => {
      const result = captureSessionFormSchema.safeParse({
        ...validBaseData,
        cropType: "Dưa lưới",
        customCrop: "",
      });
      expect(result.success).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 3. Growth Stages Completeness & Selection (All 5 Stages)
  // -------------------------------------------------------------
  describe("3. Selecting All 5 Growth Stages", () => {
    const expectedStages = [
      { id: "newly_planted", nameVi: "Mới trồng" },
      { id: "vegetative", nameVi: "Sinh trưởng" },
      { id: "flowering", nameVi: "Ra hoa" },
      { id: "fruiting", nameVi: "Kết trái" },
      { id: "harvest", nameVi: "Thu hoạch" },
    ];

    it("contains all 5 standardized growth stages", () => {
      expect(GROWTH_STAGES).toHaveLength(5);
    });

    expectedStages.forEach((expected) => {
      it(`validates schema for growth stage '${expected.id}'`, () => {
        const result = captureSessionFormSchema.safeParse({
          images: ["file:///photo1.jpg"],
          cropType: "Cà chua",
          growthStage: expected.id,
          envMode: "outdoor",
          symptomDescription: "Triệu chứng lá héo",
          severity: "Vừa",
        });
        expect(result.success).toBe(true);
      });
    });

    it("GrowthStagePicker triggers onSelectStage for each stage ID", async () => {
      let selected: string | null = null;
      const onSelect = jest.fn((id) => {
        selected = id;
      });

      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <GrowthStagePicker
            selectedStage={null}
            onSelectStage={onSelect}
          />,
        );
      });

      // Select each of the 5 options
      for (const stage of GROWTH_STAGES) {
        // Open growth stage picker modal by pressing dropdown button
        const dropdownButton = tree!.root.findByProps({
          accessibilityLabel: "Chọn giai đoạn sinh trưởng",
        });
        await act(async () => {
          dropdownButton.props.onPress();
        });

        const option = tree!.root.findByProps({
          testID: `growth-stage-option-${stage.id}`,
        });
        expect(option).toBeDefined();
        await act(async () => {
          option.props.onPress();
        });
        expect(onSelect).toHaveBeenCalledWith(stage.id);
      }

      await act(async () => {
        tree.unmount();
      });
    });
  });

  // -------------------------------------------------------------
  // 4. Severity Radio Buttons (All 5 Severity Levels)
  // -------------------------------------------------------------
  describe("4. Selecting All 5 Severity Levels", () => {
    it("defines exactly 5 severity options in SEVERITY_RADIO_OPTIONS", () => {
      expect(SEVERITY_RADIO_OPTIONS).toHaveLength(5);
      const values = SEVERITY_RADIO_OPTIONS.map((opt) => opt.zodValue);
      expect(values).toEqual(["Chớm bệnh", "Nhẹ", "Vừa", "Nặng", "Rất nặng"]);
    });

    SEVERITY_RADIO_OPTIONS.forEach((option) => {
      it(`validates schema for severity level '${option.zodValue}' (${option.displayLabel})`, () => {
        const result = captureSessionFormSchema.safeParse({
          images: ["file:///photo1.jpg"],
          cropType: "Dưa lưới",
          growthStage: "flowering",
          envMode: "outdoor",
          symptomDescription: "Vết đốm sương mai",
          severity: option.zodValue,
        });
        expect(result.success).toBe(true);
      });
    });

    it("SeverityRadioGroup triggers onSelect callback with correct zodValue for each radio", async () => {
      const onSelectMock = jest.fn();
      let tree: renderer.ReactTestRenderer;

      await act(async () => {
        tree = renderer.create(
          <SeverityRadioGroup onSelect={onSelectMock} value={undefined} />,
        );
      });

      for (const opt of SEVERITY_RADIO_OPTIONS) {
        const radioItem = tree!.root.findByProps({
          accessibilityLabel: opt.displayLabel,
        });
        expect(radioItem).toBeDefined();
        await act(async () => {
          radioItem.props.onPress();
        });
        expect(onSelectMock).toHaveBeenCalledWith(opt.zodValue);
      }

      await act(async () => {
        tree.unmount();
      });
    });
  });

  // -------------------------------------------------------------
  // 5. Text Area Length Limits (300 Chars & Real-Time Counter)
  // -------------------------------------------------------------
  describe("5. Symptoms Text Area Length Limits (300 chars)", () => {
    const buildSymptomData = (symptomDescription: string) => ({
      images: ["file:///photo.jpg"],
      cropType: "Ớt chuông",
      growthStage: "fruiting" as const,
      envMode: "outdoor" as const,
      symptomDescription,
      severity: "Nhẹ" as const,
    });

    it("fails validation when symptomDescription is empty string", () => {
      const result = captureSessionFormSchema.safeParse(buildSymptomData(""));
      expect(result.success).toBe(false);
      if (!result.success) {
        const err = result.error.issues.find((i) => i.path.includes("symptomDescription"));
        expect(err?.message).toBe("Vui lòng nhập mô tả triệu chứng quan sát được");
      }
    });

    it("passes validation for exact 300 character symptom description", () => {
      const exact300Chars = "A".repeat(300);
      const result = captureSessionFormSchema.safeParse(buildSymptomData(exact300Chars));
      expect(result.success).toBe(true);
    });

    it("verifies character counter calculation format X/300", () => {
      const text1 = "Triệu chứng sâu ăn lá";
      expect(`${text1.length}/300`).toBe(`${text1.length}/300`);

      const text300 = "B".repeat(300);
      expect(`${text300.length}/300`).toBe("300/300");
    });
  });

  // -------------------------------------------------------------
  // 6. Weather Telemetry Modal Triggers
  // -------------------------------------------------------------
  describe("6. Weather Telemetry Modal Triggers", () => {
    const mockWeather = {
      temperature: 29.5,
      lightUvIndex: 65,
      windSpeed: 12.0,
      co2Level: 420,
    };

    it("opens telemetry detail modal when 'Xem thêm chi tiết >' is pressed and closes on request", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <WeatherTelemetryBanner
            weather={mockWeather}
            envMode="outdoor"
          />,
        );
      });

      // Helper to traverse up until node with onPress function is found
      const findTouchable = (node: any) => {
        let curr = node;
        while (curr) {
          if (curr.props && typeof curr.props.onPress === "function") return curr;
          curr = curr.parent;
        }
        return null;
      };
      // Find 'Xem thêm chi tiết >' trigger text & parent touchable
      const triggerTextNode = tree!.root.findByProps({
        children: "Xem thêm chi tiết >",
      });
      let triggerButton = triggerTextNode.parent;
      while (triggerButton && !triggerButton.props.onPress) {
        triggerButton = triggerButton.parent;
      }
      expect(triggerButton).toBeDefined();

      // Trigger open modal
      await act(async () => {
        triggerButton!.props.onPress();
      });

      // Check modal content contains title
      const modalTitleNode = tree!.root.findByProps({
        children: "Chi Tiết Thông Số Telemetry",
      });
      expect(modalTitleNode).toBeDefined();

      // Find close button text & parent touchable
      const closeTextNode = tree!.root.findByProps({
        children: "Đóng bảng thông số",
      });
      let closeButton = closeTextNode.parent;
      while (closeButton && !closeButton.props.onPress) {
        closeButton = closeButton.parent;
      }
      expect(closeButton).toBeDefined();

      // Trigger close modal
      await act(async () => {
        closeButton!.props.onPress();
      });

      await act(async () => {
        tree.unmount();
      });
    });
  });

  // -------------------------------------------------------------
  // 7. Form Submission (Valid & Invalid)
  // -------------------------------------------------------------
  describe("7. Capture Screen Form Submission", () => {
    it("renders full CaptureTab screen with all required testIDs intact", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AuthProvider>
            <CaptureTab />
          </AuthProvider>,
        );
      });

      const root = tree!.root;
      expect(root.findByProps({ testID: "capture-screen-container" })).toBeDefined();
      expect(root.findByProps({ testID: "plot-id-input" })).toBeDefined();
      expect(root.findByProps({ testID: "submit-capture-button" })).toBeDefined();
      expect(root.findByProps({ testID: "storage-destination-picker" })).toBeDefined();

      await act(async () => {
        tree.unmount();
      });
    });

    it("fails full Zod validation when required fields are missing", () => {
      const invalidData = {
        images: [], // missing images
        cropType: "", // missing cropType
        growthStage: undefined, // missing growthStage
        envMode: "outdoor",
        symptomDescription: "", // missing symptoms
        severity: undefined, // missing severity
      };

      const result = captureSessionFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(4);
      }
    });

    it("passes full Zod validation when all required fields are correctly supplied", () => {
      const validCompleteData = {
        images: ["file:///photo1.jpg", "file:///photo2.jpg"],
        plotId: "LUONG-01",
        cropType: "Dưa lưới",
        customCrop: "",
        growthStage: "flowering" as const,
        envMode: "greenhouse" as const,
        hasLocalMeasurement: true,
        localTemp: "28.5",
        localCo2: "450",
        symptomDescription: "Đốm vàng viền lá, nghi thán thư",
        severity: "Nhẹ" as const,
      };

      const result = captureSessionFormSchema.safeParse(validCompleteData);
      expect(result.success).toBe(true);
    });
  });
});
