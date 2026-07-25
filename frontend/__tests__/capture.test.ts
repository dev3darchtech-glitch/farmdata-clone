import {
  GROWTH_STAGES,
  VALID_GROWTH_STAGE_IDS,
  getGrowthStageById,
  isValidGrowthStage,
  validatePlotId,
} from "@/constants/growthStages";
import { generateIsoTimestamp } from "@/services/locationService";
import { CaptureRecord, GrowthStageId, LocationData } from "@/types";

describe("Capture & Growth Stages Tests", () => {
  describe("Growth Stages Completeness", () => {
    it("defines exactly 5 standardized growth stages", () => {
      expect(GROWTH_STAGES).toHaveLength(5);
      expect(VALID_GROWTH_STAGE_IDS).toHaveLength(5);
    });

    it("contains all 5 expected growth stage IDs", () => {
      const expectedIds: GrowthStageId[] = [
        "newly_planted",
        "vegetative",
        "flowering",
        "fruiting",
        "harvest",
      ];
      const actualIds = GROWTH_STAGES.map((s) => s.id);
      expect(actualIds).toEqual(expectedIds);
    });

    it("includes required Vietnamese titles and English labels for all stages", () => {
      const expectedVietnameseTitles = [
        "Mới trồng",
        "Sinh trưởng",
        "Ra hoa",
        "Kết trái",
        "Thu hoạch",
      ];

      GROWTH_STAGES.forEach((stage, index) => {
        expect(stage.nameVi).toBe(expectedVietnameseTitles[index]);
        expect(stage.nameEn).toBeTruthy();
        expect(stage.description).toBeTruthy();
      });
    });
  });

  describe("Growth Stage Validation & Helpers", () => {
    it("validates correct growth stage IDs", () => {
      expect(isValidGrowthStage("newly_planted")).toBe(true);
      expect(isValidGrowthStage("vegetative")).toBe(true);
      expect(isValidGrowthStage("flowering")).toBe(true);
      expect(isValidGrowthStage("fruiting")).toBe(true);
      expect(isValidGrowthStage("harvest")).toBe(true);
    });

    it("rejects invalid, null, or empty growth stage IDs", () => {
      expect(isValidGrowthStage("seedling")).toBe(false);
      expect(isValidGrowthStage("invalid_stage")).toBe(false);
      expect(isValidGrowthStage("")).toBe(false);
      expect(isValidGrowthStage(null)).toBe(false);
      expect(isValidGrowthStage(undefined)).toBe(false);
    });

    it("retrieves growth stage info by ID", () => {
      const stage = getGrowthStageById("flowering");
      expect(stage).toBeDefined();
      expect(stage?.nameVi).toBe("Ra hoa");
      expect(stage?.nameEn).toBe("Flowering");

      const invalidStage = getGrowthStageById("unknown");
      expect(invalidStage).toBeUndefined();
    });
  });

  describe("Plot ID Validation", () => {
    it("rejects empty or whitespace plot IDs", () => {
      expect(validatePlotId("")).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
      expect(validatePlotId("   ")).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
      expect(validatePlotId(null)).toEqual({
        isValid: false,
        error: "Mã số luống không được để trống",
      });
    });

    it("rejects plot IDs with fewer than 2 characters", () => {
      expect(validatePlotId("A")).toEqual({
        isValid: false,
        error: "Mã số luống phải có ít nhất 2 ký tự",
      });
    });

    it("rejects plot IDs containing invalid special characters", () => {
      const result = validatePlotId("LUONG@01");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("chữ cái, chữ số");
    });

    it("accepts valid plot IDs (alphanumeric, hyphens, underscores)", () => {
      expect(validatePlotId("LUONG-01")).toEqual({ isValid: true });
      expect(validatePlotId("PLOT_A2")).toEqual({ isValid: true });
      expect(validatePlotId("ROW123")).toEqual({ isValid: true });
      expect(validatePlotId("L01")).toEqual({ isValid: true });
    });
  });

  describe("CaptureRecord Structure", () => {
    it("creates a complete valid CaptureRecord instance", () => {
      const mockLocation: LocationData = {
        latitude: 10.7769,
        longitude: 106.7009,
        accuracy: 4.5,
        timestamp: generateIsoTimestamp(),
        isMocked: false,
      };

      const record: CaptureRecord = {
        id: "REC-12345",
        plotId: "LUONG-01",
        imageUri: "file:///data/photos/crop_01.jpg",
        location: mockLocation,
        timestamp: mockLocation.timestamp,
        growthStage: "vegetative",
      };

      expect(record.id).toBe("REC-12345");
      expect(record.plotId).toBe("LUONG-01");
      expect(record.imageUri).toBe("file:///data/photos/crop_01.jpg");
      expect(record.location.latitude).toBe(10.7769);
      expect(record.location.longitude).toBe(106.7009);
      expect(record.growthStage).toBe("vegetative");
      expect(record.timestamp).toBeTruthy();
    });
  });
});
