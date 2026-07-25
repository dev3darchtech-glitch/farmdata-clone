import {
  MOCK_OUTDOOR_WEATHER,
  PHYSICAL_BOUNDS,
  createDefaultGreenhouseData,
  fetchOutdoorWeather,
  validateEnvironmentalData,
  validateGreenhouseParams,
  validateWeatherCondition,
} from "@/services/weatherService";
import { EnvironmentalData, WeatherCondition } from "@/types";

// Mock locationService validateCoordinates if needed, or use original
describe("Environmental Parameters & Weather Service Tests (M3)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("PHYSICAL_BOUNDS constants", () => {
    it("defines exact physical boundaries required by M3", () => {
      expect(PHYSICAL_BOUNDS.TEMPERATURE).toEqual({ MIN: -10, MAX: 60 });
      expect(PHYSICAL_BOUNDS.WIND_SPEED).toEqual({ MIN: 0, MAX: 150 });
      expect(PHYSICAL_BOUNDS.LIGHT_UV_INDEX).toEqual({ MIN: 0, MAX: 100000 });
      expect(PHYSICAL_BOUNDS.CO2_LEVEL).toEqual({ MIN: 200, MAX: 5000 });
    });
  });

  describe("createDefaultGreenhouseData", () => {
    it("creates greenhouse default state with NaN for all 12 metric fields", () => {
      const data = createDefaultGreenhouseData();
      expect(data.mode).toBe("greenhouse");
      expect(data.isOverridden).toBe(false);
      expect(data.isFallback).toBe(false);
      expect(data.timestamp).toBeTruthy();

      const timeframes: ("current" | "t24" | "t48")[] = [
        "current",
        "t24",
        "t48",
      ];
      const metrics: (keyof WeatherCondition)[] = [
        "temperature",
        "lightUvIndex",
        "windSpeed",
        "co2Level",
      ];

      timeframes.forEach((tf) => {
        metrics.forEach((m) => {
          expect(Number.isNaN(data[tf][m])).toBe(true);
        });
      });
    });
  });

  describe("validateWeatherCondition & validateEnvironmentalData (Physical Boundary Checking)", () => {
    const validCondition: WeatherCondition = {
      temperature: 25.0,
      lightUvIndex: 500,
      windSpeed: 10.0,
      co2Level: 400,
    };

    it("validates a correct weather condition within physical bounds", () => {
      const errors = validateWeatherCondition(validCondition, "current");
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("detects temperature out of bounds (< -10°C or > 60°C)", () => {
      const lowTemp = validateWeatherCondition(
        { ...validCondition, temperature: -15 },
        "test",
      );
      expect(lowTemp["test.temperature"]).toContain("Nhiệt độ");

      const highTemp = validateWeatherCondition(
        { ...validCondition, temperature: 65 },
        "test",
      );
      expect(highTemp["test.temperature"]).toContain("Nhiệt độ");
    });

    it("detects wind speed out of bounds (< 0 or > 150 km/h)", () => {
      const negativeWind = validateWeatherCondition(
        { ...validCondition, windSpeed: -5 },
        "test",
      );
      expect(negativeWind["test.windSpeed"]).toContain("Tốc độ gió");

      const extremeWind = validateWeatherCondition(
        { ...validCondition, windSpeed: 200 },
        "test",
      );
      expect(extremeWind["test.windSpeed"]).toContain("Tốc độ gió");
    });

    it("detects light / UV index out of bounds (< 0 or > 100,000)", () => {
      const negUv = validateWeatherCondition(
        { ...validCondition, lightUvIndex: -1 },
        "test",
      );
      expect(negUv["test.lightUvIndex"]).toContain("Cường độ sáng/UV");

      const extremeUv = validateWeatherCondition(
        { ...validCondition, lightUvIndex: 120000 },
        "test",
      );
      expect(extremeUv["test.lightUvIndex"]).toContain("Cường độ sáng/UV");
    });

    it("detects CO2 level out of bounds (< 200 or > 5,000 ppm)", () => {
      const lowCo2 = validateWeatherCondition(
        { ...validCondition, co2Level: 150 },
        "test",
      );
      expect(lowCo2["test.co2Level"]).toContain("Nồng độ CO2");

      const highCo2 = validateWeatherCondition(
        { ...validCondition, co2Level: 6000 },
        "test",
      );
      expect(highCo2["test.co2Level"]).toContain("Nồng độ CO2");
    });

    it("validates complete EnvironmentalData across T0, T-24, and T-48", () => {
      const validData: EnvironmentalData = {
        mode: "outdoor",
        current: validCondition,
        t24: validCondition,
        t48: validCondition,
      };

      const result = validateEnvironmentalData(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe("validateGreenhouseParams (Strict Mandatory Entry)", () => {
    it("rejects greenhouse data when fields contain NaN", () => {
      const defaultGreenhouse = createDefaultGreenhouseData();
      const result = validateGreenhouseParams(defaultGreenhouse);
      expect(result.isValid).toBe(false);
      // All 12 fields must have error messages
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(12);
    });

    it("rejects greenhouse data if mode is not greenhouse", () => {
      const outdoorData: EnvironmentalData = {
        mode: "outdoor",
        current: {
          temperature: 25,
          lightUvIndex: 10,
          windSpeed: 5,
          co2Level: 400,
        },
        t24: { temperature: 25, lightUvIndex: 10, windSpeed: 5, co2Level: 400 },
        t48: { temperature: 25, lightUvIndex: 10, windSpeed: 5, co2Level: 400 },
      };

      const result = validateGreenhouseParams(outdoorData);
      expect(result.isValid).toBe(false);
      expect(result.errors.mode).toBeDefined();
    });

    it("accepts valid complete greenhouse data with all 12 metrics specified within bounds", () => {
      const validGreenhouse: EnvironmentalData = {
        mode: "greenhouse",
        current: {
          temperature: 24.5,
          lightUvIndex: 850,
          windSpeed: 2.0,
          co2Level: 600,
        },
        t24: {
          temperature: 23.0,
          lightUvIndex: 800,
          windSpeed: 1.5,
          co2Level: 580,
        },
        t48: {
          temperature: 25.0,
          lightUvIndex: 900,
          windSpeed: 2.5,
          co2Level: 620,
        },
      };

      const result = validateGreenhouseParams(validGreenhouse);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("detects partial entry (e.g. missing T-48 co2Level)", () => {
      const partialGreenhouse: EnvironmentalData = {
        mode: "greenhouse",
        current: {
          temperature: 24.5,
          lightUvIndex: 850,
          windSpeed: 2.0,
          co2Level: 600,
        },
        t24: {
          temperature: 23.0,
          lightUvIndex: 800,
          windSpeed: 1.5,
          co2Level: 580,
        },
        t48: {
          temperature: 25.0,
          lightUvIndex: 900,
          windSpeed: 2.5,
          co2Level: NaN,
        },
      };

      const result = validateGreenhouseParams(partialGreenhouse);
      expect(result.isValid).toBe(false);
      expect(result.errors["t48.co2Level"]).toBeDefined();
    });
  });

  describe("fetchOutdoorWeather API & Fallback Mechanism", () => {
    const lat = 10.7769;
    const lon = 106.7009;

    it("successfully fetches outdoor weather data from API", async () => {
      const mockApiResponse = {
        current_weather: {
          temperature: 30.5,
          windspeed: 15.2,
        },
        hourly: {
          temperature_2m: Array(50).fill(28.0),
          windspeed_10m: Array(50).fill(11.0),
          uv_index: Array(50).fill(7.5),
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.mode).toBe("outdoor");
      expect(result.isFallback).toBe(false);
      expect(result.current.temperature).toBe(30.5);
      expect(result.current.windSpeed).toBe(15.2);
      expect(result.current.lightUvIndex).toBe(7.5);
      expect(result.current.co2Level).toBe(415);
      expect(result.t24.temperature).toBe(28.0);
      expect(result.t48.temperature).toBe(28.0);
    });

    it("falls back to MOCK_OUTDOOR_WEATHER on network error", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network request failed"));

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.mode).toBe("outdoor");
      expect(result.isFallback).toBe(true);
      expect(result.current.temperature).toBe(
        MOCK_OUTDOOR_WEATHER.current.temperature,
      );
    });

    it("falls back to MOCK_OUTDOOR_WEATHER on HTTP 429 rate limit response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.mode).toBe("outdoor");
      expect(result.isFallback).toBe(true);
      expect(result.current.windSpeed).toBe(
        MOCK_OUTDOOR_WEATHER.current.windSpeed,
      );
    });

    it("falls back to MOCK_OUTDOOR_WEATHER when timeout occurs", async () => {
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          const err = new Error("Aborted");
          err.name = "AbortError";
          reject(err);
        });
      });

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.isFallback).toBe(true);
      expect(result.current.co2Level).toBe(415);
    });

    it("falls back immediately for invalid coordinates without making fetch call", async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const result = await fetchOutdoorWeather(999, -500);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.isFallback).toBe(true);
    });
  });
});
