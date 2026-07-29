import {
  PHYSICAL_BOUNDS,
  createEmptyOutdoorWeatherData,
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

    it("detects light level out of bounds (< 0 or > 100,000)", () => {
      const negUv = validateWeatherCondition(
        { ...validCondition, lightUvIndex: -1 },
        "test",
      );
      expect(negUv["test.lightUvIndex"]).toContain("Cường độ ánh sáng");

      const extremeUv = validateWeatherCondition(
        { ...validCondition, lightUvIndex: 120000 },
        "test",
      );
      expect(extremeUv["test.lightUvIndex"]).toContain("Cường độ ánh sáng");
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
      const seriesTimes = Array.from({ length: 193 }, (_, index) => {
        const base = new Date(Date.UTC(2026, 6, 26, 17, 30, 0));
        const current = new Date(base.getTime() + index * 15 * 60 * 1000);
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const hour = String(current.getUTCHours()).padStart(2, "0");
        const minute = String(current.getUTCMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}`;
      });
      const mockApiResponse = {
        current: {
          temperature_2m: 30.5,
          relative_humidity_2m: 70,
          windspeed_10m: 15.2,
          weather_code: 2,
          shortwave_radiation: 350,
          time: seriesTimes[192],
        },
        minutely_15: {
          temperature_2m: Array(193).fill(28.0),
          relative_humidity_2m: Array(193).fill(70),
          windspeed_10m: Array(193).fill(11.0),
          shortwave_radiation: Array(193).fill(350),
          weather_code: Array(193).fill(2),
          time: seriesTimes,
        },
      };
      const airQualityTimes = Array.from({ length: 49 }, (_, index) => {
        const base = new Date(Date.UTC(2026, 6, 26, 17, 0, 0));
        const current = new Date(base.getTime() + index * 60 * 60 * 1000);
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const hour = String(current.getUTCHours()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:00`;
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockApiResponse),
      } as any).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            carbon_dioxide: 421,
          },
          hourly: {
            time: airQualityTimes,
            carbon_dioxide: Array(49).fill(421),
          },
        }),
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.mode).toBe("outdoor");
      expect(result.isFallback).toBe(false);
      expect(result.current.temperature).toBe(30.5);
      expect(result.current.windSpeed).toBe(15.2);
      expect(result.current.lightUvIndex).toBe(350);
      expect(result.current.co2Level).toBe(421);
      expect(result.t24.temperature).toBe(28.0);
      expect(result.t48.temperature).toBe(28.0);
    });

    it("uses the current weather timestamp instead of the last forecast slot", async () => {
      const seriesTimes = Array.from({ length: 193 }, (_, index) => {
        const base = new Date(Date.UTC(2026, 6, 26, 17, 30, 0));
        const current = new Date(base.getTime() + index * 15 * 60 * 1000);
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const hour = String(current.getUTCHours()).padStart(2, "0");
        const minute = String(current.getUTCMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}`;
      });
      const shortwaveRadiation = Array.from(
        { length: 193 },
        (_, index) => index * 10,
      );
      const relativeHumidity = Array.from({ length: 193 }, (_, index) => 50 + index);
      const temperatures = Array.from({ length: 193 }, (_, index) => 20 + index);
      const windSpeeds = Array.from({ length: 193 }, (_, index) => 5 + index);

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            temperature_2m: 31.2,
            relative_humidity_2m: relativeHumidity[192],
            windspeed_10m: 12.6,
            weather_code: 3,
            shortwave_radiation: shortwaveRadiation[192],
            time: seriesTimes[192],
          },
          minutely_15: {
            temperature_2m: temperatures,
            relative_humidity_2m: relativeHumidity,
            windspeed_10m: windSpeeds,
            shortwave_radiation: shortwaveRadiation,
            weather_code: Array(193).fill(3),
            time: seriesTimes,
          },
        }),
      } as any).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            carbon_dioxide: 419,
          },
          hourly: {
            time: [],
            carbon_dioxide: [],
          },
        }),
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.current.lightUvIndex).toBe(shortwaveRadiation[192]);
      expect(result.current.humidity).toBe(relativeHumidity[192]);
      expect(result.t24.lightUvIndex).toBe(shortwaveRadiation[96]);
      expect(result.t48.lightUvIndex).toBe(shortwaveRadiation[0]);
    });

    it("keeps the real quarter-hour timestamp for T0, T24, and T48", async () => {
      const seriesTimes = Array.from({ length: 193 }, (_, index) => {
        const base = new Date(Date.UTC(2026, 6, 26, 16, 45, 0));
        const current = new Date(base.getTime() + index * 15 * 60 * 1000);
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const hour = String(current.getUTCHours()).padStart(2, "0");
        const minute = String(current.getUTCMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}`;
      });
      const shortwaveRadiation = Array.from(
        { length: seriesTimes.length },
        (_, index) => index,
      );

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            temperature_2m: 30,
            relative_humidity_2m: 70,
            windspeed_10m: 10,
            weather_code: 1,
            shortwave_radiation: shortwaveRadiation[192],
            time: "2026-07-28T16:45",
          },
          minutely_15: {
            temperature_2m: Array(seriesTimes.length).fill(28),
            relative_humidity_2m: Array(seriesTimes.length).fill(70),
            windspeed_10m: Array(seriesTimes.length).fill(11),
            shortwave_radiation: shortwaveRadiation,
            weather_code: Array(seriesTimes.length).fill(1),
            time: seriesTimes,
          },
        }),
      } as any).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            carbon_dioxide: 425,
          },
          hourly: {
            time: [],
            carbon_dioxide: [],
          },
        }),
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      const currentIndex = seriesTimes.indexOf("2026-07-28T16:45");
      expect(result.current.lightUvIndex).toBe(shortwaveRadiation[currentIndex]);
      expect(result.t24.updatedAt).toBe("2026-07-27T09:45:00.000Z");
      expect(result.t48.updatedAt).toBe("2026-07-26T09:45:00.000Z");
    });

    it("stores T0, T24, and T48 timestamps with Vietnam timezone semantics", async () => {
      const seriesTimes = Array.from({ length: 193 }, (_, index) => {
        const base = new Date(Date.UTC(2026, 6, 26, 17, 30, 0));
        const current = new Date(base.getTime() + index * 15 * 60 * 1000);
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const hour = String(current.getUTCHours()).padStart(2, "0");
        const minute = String(current.getUTCMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}`;
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            temperature_2m: 30,
            relative_humidity_2m: 70,
            windspeed_10m: 10,
            weather_code: 1,
            shortwave_radiation: 350,
            time: seriesTimes[192],
          },
          minutely_15: {
            temperature_2m: Array(193).fill(28),
            relative_humidity_2m: Array(193).fill(70),
            windspeed_10m: Array(193).fill(11),
            shortwave_radiation: Array(193).fill(350),
            weather_code: Array(193).fill(1),
            time: seriesTimes,
          },
        }),
      } as any).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            carbon_dioxide: 430,
          },
          hourly: {
            time: [],
            carbon_dioxide: [],
          },
        }),
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.current.updatedAt).toBe("2026-07-28T10:30:00.000Z");
      expect(result.t24.updatedAt).toBe("2026-07-27T10:30:00.000Z");
      expect(result.t48.updatedAt).toBe("2026-07-26T10:30:00.000Z");
    });

    it("returns empty station data on network error", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network request failed"));

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.mode).toBe("outdoor");
      expect(result.isFallback).toBe(true);
      expect(Number.isNaN(result.current.temperature)).toBe(true);
      expect(result.latitude).toBe(lat);
      expect(result.longitude).toBe(lon);
    });

    it("returns empty station data on HTTP 429 rate limit response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.mode).toBe("outdoor");
      expect(result.isFallback).toBe(true);
      expect(Number.isNaN(result.current.windSpeed)).toBe(true);
    });

    it("returns empty station data when timeout occurs", async () => {
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          const err = new Error("Aborted");
          err.name = "AbortError";
          reject(err);
        });
      });

      const result = await fetchOutdoorWeather(lat, lon);

      expect(result.isFallback).toBe(true);
      expect(Number.isNaN(result.current.co2Level)).toBe(true);
    });

    it("keeps CO2 empty when the air-quality API does not return data", async () => {
      const seriesTimes = Array.from({ length: 193 }, (_, index) => {
        const base = new Date(Date.UTC(2026, 6, 26, 17, 30, 0));
        const current = new Date(base.getTime() + index * 15 * 60 * 1000);
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const hour = String(current.getUTCHours()).padStart(2, "0");
        const minute = String(current.getUTCMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}`;
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          current: {
            temperature_2m: 30.5,
            relative_humidity_2m: 70,
            windspeed_10m: 15.2,
            weather_code: 2,
            shortwave_radiation: 350,
            time: seriesTimes[192],
          },
          minutely_15: {
            temperature_2m: Array(193).fill(28.0),
            relative_humidity_2m: Array(193).fill(70),
            windspeed_10m: Array(193).fill(11.0),
            shortwave_radiation: Array(193).fill(350),
            weather_code: Array(193).fill(2),
            time: seriesTimes,
          },
        }),
      } as any).mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
      } as any);

      const result = await fetchOutdoorWeather(lat, lon);

      expect(Number.isNaN(result.current.co2Level)).toBe(true);
      expect(Number.isNaN(result.t12?.co2Level)).toBe(true);
      expect(Number.isNaN(result.t24.co2Level)).toBe(true);
      expect(Number.isNaN(result.t48.co2Level)).toBe(true);
    });

    it("falls back immediately for invalid coordinates without making fetch call", async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const result = await fetchOutdoorWeather(999, -500);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.isFallback).toBe(true);
      expect(result.latitude).toBe(999);
      expect(result.longitude).toBe(-500);
      expect(Number.isNaN(result.current.temperature)).toBe(true);
      expect(Number.isNaN(result.t24.temperature)).toBe(true);
      expect(Number.isNaN(result.t48.temperature)).toBe(true);
    });
  });
});
