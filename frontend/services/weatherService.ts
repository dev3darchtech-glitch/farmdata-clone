import {
  EnvironmentalData,
  EnvironmentalValidationResult,
  WeatherCondition,
} from "@/types";
import { validateCoordinates } from "./locationService";

export const PHYSICAL_BOUNDS = {
  TEMPERATURE: { MIN: -10, MAX: 60 },
  WIND_SPEED: { MIN: 0, MAX: 150 },
  LIGHT_UV_INDEX: { MIN: 0, MAX: 100000 },
  CO2_LEVEL: { MIN: 200, MAX: 5000 },
} as const;

export const MOCK_OUTDOOR_WEATHER: EnvironmentalData = {
  mode: "outdoor",
  latitude: 10.790861,
  longitude: 106.71088,
  current: {
    temperature: 28.5,
    lightUvIndex: 6.5,
    windSpeed: 12.0,
    co2Level: 415,
    humidity: 74,
    weatherCode: 0,
  },
  t24: {
    temperature: 27.0,
    lightUvIndex: 5.8,
    windSpeed: 10.5,
    co2Level: 412,
    humidity: 76,
    weatherCode: 1,
  },
  t48: {
    temperature: 29.1,
    lightUvIndex: 7.2,
    windSpeed: 14.2,
    co2Level: 418,
    humidity: 71,
    weatherCode: 2,
  },
  isOverridden: false,
  isFallback: true,
  timestamp: new Date().toISOString(),
};

export function createDefaultGreenhouseData(): EnvironmentalData {
  return {
    mode: "greenhouse",
    latitude: undefined,
    longitude: undefined,
    current: {
      temperature: NaN,
      lightUvIndex: NaN,
      windSpeed: NaN,
      co2Level: NaN,
    },
    t24: { temperature: NaN, lightUvIndex: NaN, windSpeed: NaN, co2Level: NaN },
    t48: { temperature: NaN, lightUvIndex: NaN, windSpeed: NaN, co2Level: NaN },
    isOverridden: false,
    isFallback: false,
    timestamp: new Date().toISOString(),
  };
}

export function validateWeatherCondition(
  condition: WeatherCondition,
  prefix: string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!condition) {
    errors[`${prefix}._general`] = "Dữ liệu thời tiết không tồn tại";
    return errors;
  }

  if (
    typeof condition.temperature !== "number" ||
    Number.isNaN(condition.temperature) ||
    condition.temperature < PHYSICAL_BOUNDS.TEMPERATURE.MIN ||
    condition.temperature > PHYSICAL_BOUNDS.TEMPERATURE.MAX
  ) {
    errors[`${prefix}.temperature`] =
      `Nhiệt độ phải nằm trong khoảng ${PHYSICAL_BOUNDS.TEMPERATURE.MIN}°C đến ${PHYSICAL_BOUNDS.TEMPERATURE.MAX}°C`;
  }

  if (
    typeof condition.lightUvIndex !== "number" ||
    Number.isNaN(condition.lightUvIndex) ||
    condition.lightUvIndex < PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MIN ||
    condition.lightUvIndex > PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MAX
  ) {
    errors[`${prefix}.lightUvIndex`] =
      `Cường độ sáng/UV phải từ ${PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MIN} đến ${PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MAX}`;
  }

  if (
    typeof condition.windSpeed !== "number" ||
    Number.isNaN(condition.windSpeed) ||
    condition.windSpeed < PHYSICAL_BOUNDS.WIND_SPEED.MIN ||
    condition.windSpeed > PHYSICAL_BOUNDS.WIND_SPEED.MAX
  ) {
    errors[`${prefix}.windSpeed`] =
      `Tốc độ gió phải nằm trong khoảng ${PHYSICAL_BOUNDS.WIND_SPEED.MIN} đến ${PHYSICAL_BOUNDS.WIND_SPEED.MAX} km/h`;
  }

  if (
    typeof condition.co2Level !== "number" ||
    Number.isNaN(condition.co2Level) ||
    condition.co2Level < PHYSICAL_BOUNDS.CO2_LEVEL.MIN ||
    condition.co2Level > PHYSICAL_BOUNDS.CO2_LEVEL.MAX
  ) {
    errors[`${prefix}.co2Level`] =
      `Nồng độ CO2 phải từ ${PHYSICAL_BOUNDS.CO2_LEVEL.MIN} đến ${PHYSICAL_BOUNDS.CO2_LEVEL.MAX} ppm`;
  }

  return errors;
}

export function validateEnvironmentalData(
  data: EnvironmentalData,
): EnvironmentalValidationResult {
  if (!data) {
    return {
      isValid: false,
      errors: { _general: "Dữ liệu môi trường không tồn tại" },
    };
  }

  const errors: Record<string, string> = {
    ...validateWeatherCondition(data.current, "current"),
    ...validateWeatherCondition(data.t24, "t24"),
    ...validateWeatherCondition(data.t48, "t48"),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateGreenhouseParams(
  data: EnvironmentalData,
): EnvironmentalValidationResult {
  if (!data || data.mode !== "greenhouse") {
    return {
      isValid: false,
      errors: { mode: "Chế độ môi trường phải là Nhà kính (Greenhouse)" },
    };
  }

  const timeframes: (keyof Pick<
    EnvironmentalData,
    "current" | "t24" | "t48"
  >)[] = ["current", "t24", "t48"];
  const metrics: (keyof WeatherCondition)[] = [
    "temperature",
    "lightUvIndex",
    "windSpeed",
    "co2Level",
  ];

  const missingErrors: Record<string, string> = {};

  timeframes.forEach((tf) => {
    metrics.forEach((m) => {
      const val = data[tf]?.[m];
      if (val === undefined || val === null || Number.isNaN(val)) {
        missingErrors[`${tf}.${m}`] =
          `Trường ${m} cho khung giờ ${tf} là bắt buộc trong nhà kính`;
      }
    });
  });

  const physicalValidation = validateEnvironmentalData(data);
  const combinedErrors = { ...missingErrors, ...physicalValidation.errors };

  return {
    isValid: Object.keys(combinedErrors).length === 0,
    errors: combinedErrors,
  };
}

export async function fetchOutdoorWeather(
  lat: number,
  lon: number,
): Promise<EnvironmentalData> {
  if (!validateCoordinates(lat, lon)) {
    return {
      ...MOCK_OUTDOOR_WEATHER,
      latitude: lat,
      longitude: lon,
      isFallback: true,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,uv_index&past_days=2`;

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        ...MOCK_OUTDOOR_WEATHER,
        latitude: lat,
        longitude: lon,
        isFallback: true,
        timestamp: new Date().toISOString(),
      };
    }

    const json = await response.json();

    const curTemp = json?.current_weather?.temperature ?? 28.5;
    const curWind = json?.current_weather?.windspeed ?? 12.0;
    const curWeatherCode = json?.current_weather?.weathercode ?? 0;

    const hourlyTemps: number[] = json?.hourly?.temperature_2m ?? [];
    const hourlyHumidity: number[] = json?.hourly?.relative_humidity_2m ?? [];
    const hourlyWinds: number[] = json?.hourly?.windspeed_10m ?? [];
    const hourlyUvs: number[] = json?.hourly?.uv_index ?? [];

    const len = hourlyTemps.length;
    const t24Index = Math.max(0, len - 25);
    const t48Index = Math.max(0, len - 49);

    const curUv = len > 0 ? (hourlyUvs[len - 1] ?? 6.5) : 6.5;
    const curHumidity = len > 0 ? (hourlyHumidity[len - 1] ?? 74) : 74;

    const outdoorData: EnvironmentalData = {
      mode: "outdoor",
      latitude: Number(json?.latitude ?? lat),
      longitude: Number(json?.longitude ?? lon),
      current: {
        temperature: Number(curTemp),
        lightUvIndex: Number(curUv),
        windSpeed: Number(curWind),
        co2Level: 415,
        humidity: Number(curHumidity),
        weatherCode: Number(curWeatherCode),
      },
      t24: {
        temperature: hourlyTemps[t24Index] ?? 27.0,
        lightUvIndex: hourlyUvs[t24Index] ?? 5.8,
        windSpeed: hourlyWinds[t24Index] ?? 10.5,
        co2Level: 412,
        humidity: hourlyHumidity[t24Index] ?? 76,
        weatherCode: Number(curWeatherCode),
      },
      t48: {
        temperature: hourlyTemps[t48Index] ?? 29.1,
        lightUvIndex: hourlyUvs[t48Index] ?? 7.2,
        windSpeed: hourlyWinds[t48Index] ?? 14.2,
        co2Level: 418,
        humidity: hourlyHumidity[t48Index] ?? 71,
        weatherCode: Number(curWeatherCode),
      },
      isOverridden: false,
      isFallback: false,
      timestamp: new Date().toISOString(),
    };

    return outdoorData;
  } catch (error) {
    return {
      ...MOCK_OUTDOOR_WEATHER,
      latitude: lat,
      longitude: lon,
      isFallback: true,
      timestamp: new Date().toISOString(),
    };
  }
}
