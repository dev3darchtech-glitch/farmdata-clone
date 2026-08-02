import {
  DEFAULT_MOCK_LOCATION,
  formatCoordinates,
  generateIsoTimestamp,
  getCurrentLocation,
  validateCoordinates,
} from "@/services/locationService";
import * as Location from "expo-location";

describe("Location Service Tests", () => {
  describe("formatCoordinates", () => {
    it("formats positive lat and lon with default precision (N, E)", () => {
      const formatted = formatCoordinates(10.776889, 106.700806);
      expect(formatted).toBe("10.7769° N, 106.7008° E");
    });

    it("formats negative lat and lon correctly (S, W)", () => {
      const formatted = formatCoordinates(-33.8688, -151.2093, 2);
      expect(formatted).toBe("33.87° S, 151.21° W");
    });

    it('returns "Invalid coordinates" for out-of-bound or NaN coordinates', () => {
      expect(formatCoordinates(100, 50)).toBe("Invalid coordinates");
      expect(formatCoordinates(-95, 200)).toBe("Invalid coordinates");
      expect(formatCoordinates(NaN, 50)).toBe("Invalid coordinates");
    });
  });

  describe("validateCoordinates", () => {
    it("returns true for valid coordinate pairs", () => {
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
      expect(validateCoordinates(10.7769, 106.7009)).toBe(true);
    });

    it("returns false for latitude outside [-90, 90]", () => {
      expect(validateCoordinates(90.1, 100)).toBe(false);
      expect(validateCoordinates(-91, 100)).toBe(false);
    });

    it("returns false for longitude outside [-180, 180]", () => {
      expect(validateCoordinates(10, 180.1)).toBe(false);
      expect(validateCoordinates(10, -180.5)).toBe(false);
    });

    it("returns false for non-numeric inputs or NaN", () => {
      expect(validateCoordinates(NaN, 100)).toBe(false);
      expect(validateCoordinates(10, NaN)).toBe(false);
      // @ts-ignore
      expect(validateCoordinates("10", 100)).toBe(false);
    });
  });

  describe("generateIsoTimestamp", () => {
    it("generates a valid ISO 8601 UTC timestamp string", () => {
      const timestamp = generateIsoTimestamp();
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(timestamp).toMatch(isoRegex);
      expect(new Date(timestamp).getTime()).not.toBeNaN();
    });

    it("formats a specific Date object accurately", () => {
      const fixedDate = new Date("2026-07-23T12:00:00.000Z");
      const timestamp = generateIsoTimestamp(fixedDate);
      expect(timestamp).toBe("2026-07-23T12:00:00.000Z");
    });
  });

  describe("getCurrentLocation", () => {
    it("requests foreground permissions and returns GPS position data", async () => {
      const location = await getCurrentLocation();
      expect(location).toBeDefined();
      expect(location.latitude).toBe(10.7769);
      expect(location.longitude).toBe(106.7009);
      expect(location.accuracy).toBe(5.0);
      expect(location.timestamp).toBeDefined();
    });

    it("throws LOCATION_PERMISSION_DENIED when permission is denied", async () => {
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValueOnce({
        status: "denied",
      });

      await expect(getCurrentLocation()).rejects.toThrow("LOCATION_PERMISSION_DENIED");
    });

    it("throws error when position lookup throws an exception", async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
        new Error("GPS service unavailable"),
      );

      await expect(getCurrentLocation()).rejects.toThrow("GPS service unavailable");
    });
  });
});
