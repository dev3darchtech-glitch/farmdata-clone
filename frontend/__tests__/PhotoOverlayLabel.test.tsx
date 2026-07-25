import { formatOverlayText } from "../components/PhotoOverlayLabel";

describe("PhotoOverlayLabel formatting rules", () => {
  it("formats overlay text with plot code correctly", () => {
    const props = {
      cropType: "Cà chua",
      plotId: "L-001",
      growthStage: "flowering" as const,
      envMode: "greenhouse" as const,
      symptomDescription: "Đốm vàng",
      severity: "Vừa" as const,
    };

    const { line1, line2, line3 } = formatOverlayText(props);

    expect(line1).toBe("Luống L-001 · Cà chua");
    expect(line2).toContain("Nhà kính");
    expect(line3).toBe("Đốm vàng · Mức độ vừa");
  });

  it("omits plot code prefix when plotId is absent or empty", () => {
    const propsNoPlot = {
      cropType: "Dưa leo",
      plotId: undefined,
      growthStage: "fruiting" as const,
      envMode: "outdoor" as const,
      symptomDescription: "Phấn trắng",
      severity: "Chớm bệnh" as const,
    };

    const { line1, line2, line3 } = formatOverlayText(propsNoPlot);

    expect(line1).toBe("Dưa leo");
    expect(line1).not.toContain("Không có mã luống");
    expect(line2).toContain("Ngoài trời");
    expect(line3).toBe("Phấn trắng · Mức độ chớm bệnh");
  });
});
