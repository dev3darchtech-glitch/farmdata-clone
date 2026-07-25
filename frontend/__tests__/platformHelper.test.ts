import {
  getKeyboardAvoidingBehavior,
  getPlatformFont,
  getPlatformShadow,
  isAndroid,
  isIOS,
  isWeb,
  triggerHaptic,
} from "../utils/platformHelper";

describe("Platform Helper Utility", () => {
  it("exports boolean flags for platform detection", () => {
    expect(typeof isIOS).toBe("boolean");
    expect(typeof isAndroid).toBe("boolean");
    expect(typeof isWeb).toBe("boolean");
  });

  it("returns platform font families", () => {
    const monoFont = getPlatformFont("mono");
    const serifFont = getPlatformFont("serif");
    const sansFont = getPlatformFont("sans");

    expect(monoFont).toBeDefined();
    expect(serifFont).toBeDefined();
    expect(sansFont).toBeDefined();
  });

  it("returns platform shadows with elevation fallback", () => {
    const shadowLow = getPlatformShadow("low");
    const shadowMed = getPlatformShadow("medium");
    const shadowHigh = getPlatformShadow("high");

    expect(shadowLow).toBeDefined();
    expect(shadowMed).toBeDefined();
    expect(shadowHigh).toBeDefined();
  });

  it("returns keyboard avoiding behavior", () => {
    const behavior = getKeyboardAvoidingBehavior();
    expect(behavior === "padding" || behavior === undefined).toBe(true);
  });

  it("triggers haptic feedback gracefully without throwing errors", async () => {
    await expect(triggerHaptic("light")).resolves.not.toThrow();
    await expect(triggerHaptic("success")).resolves.not.toThrow();
  });
});
