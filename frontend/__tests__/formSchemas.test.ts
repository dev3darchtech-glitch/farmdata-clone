import { captureSessionFormSchema } from "@/schemas/formSchemas";

describe("captureSessionFormSchema", () => {
  it("accepts omitted optional local measurement fields", () => {
    const result = captureSessionFormSchema.safeParse({
      images: ["file://capture.jpg"],
      cropType: "Cà chua",
      growthStage: "flowering",
      envMode: "greenhouse",
      severity: "Nhẹ",
      symptomDescription: "Có đốm vàng trên lá",
    });

    expect(result.success).toBe(true);
  });
});
