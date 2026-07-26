import {
  classifySymptomSeverity,
  validateSymptomData,
  validateSymptomDescription,
  validateSymptomPercentage,
} from "@/services/symptomService";

describe("Disease Symptom Assessment Engine Tests (M4)", () => {
  describe("classifySymptomSeverity (5-Tier Boundary Math)", () => {
    it('classifies <= 10% as "Chớm bệnh"', () => {
      expect(classifySymptomSeverity(0)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(5)).toBe("Chớm bệnh");
      expect(classifySymptomSeverity(10)).toBe("Chớm bệnh");
    });

    it('classifies 10.1% to 25% as "Nhẹ"', () => {
      expect(classifySymptomSeverity(10.1)).toBe("Nhẹ");
      expect(classifySymptomSeverity(15)).toBe("Nhẹ");
      expect(classifySymptomSeverity(25)).toBe("Nhẹ");
    });

    it('classifies 25.1% to 50% as "Vừa"', () => {
      expect(classifySymptomSeverity(25.1)).toBe("Vừa");
      expect(classifySymptomSeverity(35)).toBe("Vừa");
      expect(classifySymptomSeverity(50)).toBe("Vừa");
    });

    it('classifies 50.1% to 75% as "Nặng"', () => {
      expect(classifySymptomSeverity(50.1)).toBe("Nặng");
      expect(classifySymptomSeverity(75)).toBe("Nặng");
    });

    it('classifies > 75% as "Rất nặng"', () => {
      expect(classifySymptomSeverity(75.1)).toBe("Rất nặng");
      expect(classifySymptomSeverity(100)).toBe("Rất nặng");
    });
  });

  describe("validateSymptomPercentage", () => {
    it("returns isValid true for valid percentages (0 to 100)", () => {
      [0, 10, 25, 50, 75, 100].forEach((pct) => {
        const res = validateSymptomPercentage(pct);
        expect(res.isValid).toBe(true);
        expect(res.error).toBeUndefined();
      });
    });

    it("returns isValid false for percentage < 0", () => {
      const res = validateSymptomPercentage(-1);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("từ 0% đến 100%");
    });

    it("returns isValid false for percentage > 100", () => {
      const res = validateSymptomPercentage(105);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("từ 0% đến 100%");
    });

    it("returns isValid false for non-number inputs (NaN, null, undefined)", () => {
      const nanRes = validateSymptomPercentage(NaN);
      expect(nanRes.isValid).toBe(false);
      expect(nanRes.error).toContain("phải là một số");

      const nullRes = validateSymptomPercentage(null as any);
      expect(nullRes.isValid).toBe(false);

      const strRes = validateSymptomPercentage("abc" as any);
      expect(strRes.isValid).toBe(false);
    });
  });

  describe("validateSymptomDescription", () => {
    it("returns isValid true for valid non-empty description", () => {
      const res = validateSymptomDescription("Lá bị vàng lá gân xanh");
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("returns isValid false for empty or whitespace-only description", () => {
      expect(validateSymptomDescription("").isValid).toBe(false);
      expect(validateSymptomDescription("   ").isValid).toBe(false);
      expect(validateSymptomDescription(null as any).isValid).toBe(false);
      expect(validateSymptomDescription(undefined as any).isValid).toBe(false);
    });
  });

  describe("validateSymptomData", () => {
    it("validates a complete valid symptom data payload", () => {
      const res = validateSymptomData({
        description: "Đốm đen viền vàng trên lá cà chua",
        percentageArea: 15,
      });

      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
    });

    it("identifies errors in invalid symptom data payload", () => {
      const res = validateSymptomData({
        description: "",
        percentageArea: 120,
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.description).toBeDefined();
      expect(res.errors.percentageArea).toBeDefined();
    });
  });
});
