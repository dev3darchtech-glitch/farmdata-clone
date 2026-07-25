import CaptureTab from "@/app/(tabs)/capture";
import ManagementTab from "@/app/(tabs)/management";
import PostsTab from "@/app/(tabs)/posts";
import { AuthProvider } from "@/hooks/useAuth";
import {
  classifySymptomSeverity,
  validateSymptomPercentage,
} from "@/services/symptomService";
import {
  createDefaultGreenhouseData,
  MOCK_OUTDOOR_WEATHER,
  validateEnvironmentalData,
  validateGreenhouseParams,
} from "@/services/weatherService";
import { EnvironmentalData } from "@/types";
import React from "react";
import renderer, { act } from "react-test-renderer";

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

describe("M6 Challenger Verification Suite — UI_SPEC 4 Main Screens", () => {
  describe("Task 1 & 2: Main Screen Rendering & Component Verification", () => {
    test("CaptureTab renders without crashing and contains required testIDs", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AuthProvider>
            <CaptureTab />
          </AuthProvider>,
        );
      });
      const root = tree!.root;
      expect(
        root.findByProps({ testID: "capture-screen-container" }),
      ).toBeDefined();
      expect(root.findByProps({ testID: "plot-id-input" })).toBeDefined();
      expect(
        root.findByProps({ testID: "submit-capture-button" }),
      ).toBeDefined();
      expect(
        root.findByProps({ testID: "storage-destination-picker" }),
      ).toBeDefined();

      await act(async () => {
        tree.unmount();
      });
    });

    test("PostsTab renders without crashing", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AuthProvider>
            <PostsTab />
          </AuthProvider>,
        );
      });
      expect(tree!.toTree()).toBeDefined();

      await act(async () => {
        tree.unmount();
      });
    });

    test("ManagementTab renders without crashing", async () => {
      let tree: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <AuthProvider>
            <ManagementTab />
          </AuthProvider>,
        );
      });
      expect(tree!.toTree()).toBeDefined();

      await act(async () => {
        tree.unmount();
      });
    });
  });

  describe("Task 4: Edge Case Verification", () => {
    test("Symptom severity badge mapping boundaries", () => {
      expect(classifySymptomSeverity(0)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(10)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(10.0001)).toBe("Nhẹ");
      expect(classifySymptomSeverity(25)).toBe("Nhẹ");
      expect(classifySymptomSeverity(25.0001)).toBe("Vừa");
      expect(classifySymptomSeverity(50)).toBe("Vừa");
      expect(classifySymptomSeverity(50.0001)).toBe("Rất nặng");
      expect(classifySymptomSeverity(75)).toBe("Rất nặng");
      expect(classifySymptomSeverity(100)).toBe("Rất nặng");

      // Edge values
      expect(classifySymptomSeverity(-5)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(105)).toBe("Rất nặng");
      expect(classifySymptomSeverity(NaN)).toBe("Rất nặng");
    });

    test("Symptom percentage validation boundaries", () => {
      expect(validateSymptomPercentage(0).isValid).toBe(true);
      expect(validateSymptomPercentage(100).isValid).toBe(true);
      expect(validateSymptomPercentage(-0.1).isValid).toBe(false);
      expect(validateSymptomPercentage(100.1).isValid).toBe(false);
      expect(validateSymptomPercentage(NaN).isValid).toBe(false);
    });

    test("Environment parameter validation boundaries & outdoor vs greenhouse rules", () => {
      // Outdoor valid data
      const outdoorRes = validateEnvironmentalData(MOCK_OUTDOOR_WEATHER);
      expect(outdoorRes.isValid).toBe(true);

      // Greenhouse valid data requires mode 'greenhouse' with all 12 params defined and within physical bounds
      const validGreenhouseData: EnvironmentalData = {
        mode: "greenhouse",
        current: {
          temperature: 25,
          lightUvIndex: 500,
          windSpeed: 5,
          co2Level: 600,
        },
        t24: {
          temperature: 24,
          lightUvIndex: 450,
          windSpeed: 4,
          co2Level: 580,
        },
        t48: {
          temperature: 23,
          lightUvIndex: 400,
          windSpeed: 3,
          co2Level: 560,
        },
      };
      const ghRes = validateGreenhouseParams(validGreenhouseData);
      expect(ghRes.isValid).toBe(true);

      // Default greenhouse params (containing NaNs) fails validation
      const invalidGhRes = validateGreenhouseParams(
        createDefaultGreenhouseData(),
      );
      expect(invalidGhRes.isValid).toBe(false);
      expect(Object.keys(invalidGhRes.errors).length).toBeGreaterThanOrEqual(
        12,
      );
    });
  });
});
