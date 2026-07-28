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

export function createEmptyWeatherCondition(): WeatherCondition {
  return {
    temperature: NaN,
    lightUvIndex: NaN,
    windSpeed: NaN,
    co2Level: NaN,
  };
}

export function createEmptyOutdoorWeatherData(
  lat?: number,
  lon?: number,
): EnvironmentalData {
  return {
    mode: "outdoor",
    latitude: lat,
    longitude: lon,
    current: createEmptyWeatherCondition(),
    t24: createEmptyWeatherCondition(),
    t48: createEmptyWeatherCondition(),
    isOverridden: false,
    isFallback: true,
    timestamp: new Date().toISOString(),
  };
}

export function createDefaultGreenhouseData(): EnvironmentalData {
  return {
    mode: "greenhouse",
    latitude: undefined,
    longitude: undefined,
    current: createEmptyWeatherCondition(),
    t24: createEmptyWeatherCondition(),
    t48: createEmptyWeatherCondition(),
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
      `Cường độ ánh sáng phải từ ${PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MIN} đến ${PHYSICAL_BOUNDS.LIGHT_UV_INDEX.MAX}`;
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

function toVietnamIsoString(value?: string): string | undefined {
  if (!value) return undefined;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  const parsed = new Date(`${value}+07:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function resolveCurrentHourlyIndex(
  hourlyTimes: string[],
  currentWeatherTime?: string,
): number {
  if (!hourlyTimes.length) return 0;
  if (!currentWeatherTime) return Math.max(0, hourlyTimes.length - 1);

  const exactIndex = hourlyTimes.indexOf(currentWeatherTime);
  if (exactIndex >= 0) return exactIndex;

  const currentHour = currentWeatherTime.slice(0, 13) + ":00";
  const roundedHourIndex = hourlyTimes.indexOf(currentHour);
  if (roundedHourIndex >= 0) return roundedHourIndex;

  for (let index = hourlyTimes.length - 1; index >= 0; index -= 1) {
    if (hourlyTimes[index] <= currentWeatherTime) {
      return index;
    }
  }

  return 0;
}

export async function fetchOutdoorWeather(
  lat: number,
  lon: number,
): Promise<EnvironmentalData> {
  if (!validateCoordinates(lat, lon)) {
    return createEmptyOutdoorWeatherData(lat, lon);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,shortwave_radiation,weather_code&past_days=2&timezone=Asia%2FHo_Chi_Minh`;

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return createEmptyOutdoorWeatherData(lat, lon);
    }

    const json = await response.json();

    const curTemp = json?.current_weather?.temperature ?? 28.5;
    const curWind = json?.current_weather?.windspeed ?? 12.0;
    const curWeatherCode = json?.current_weather?.weathercode ?? 0;
    const currentWeatherTime = json?.current_weather?.time;

    const hourlyTemps: number[] = json?.hourly?.temperature_2m ?? [];
    const hourlyHumidity: number[] = json?.hourly?.relative_humidity_2m ?? [];
    const hourlyWinds: number[] = json?.hourly?.windspeed_10m ?? [];
    const hourlyLightLevels: number[] = json?.hourly?.shortwave_radiation ?? [];
    const hourlyWeatherCodes: number[] = json?.hourly?.weather_code ?? [];
    const hourlyTimes: string[] = json?.hourly?.time ?? [];

    const currentIndex = resolveCurrentHourlyIndex(
      hourlyTimes,
      currentWeatherTime,
    );
    const t24Index = Math.max(0, currentIndex - 24);
    const t48Index = Math.max(0, currentIndex - 48);

    const curLightLevel =
      hourlyLightLevels.length > 0
        ? (hourlyLightLevels[currentIndex] ?? 350)
        : 350;
    const curHumidity =
      hourlyHumidity.length > 0 ? (hourlyHumidity[currentIndex] ?? 74) : 74;

    const currentTimestamp =
      toVietnamIsoString(currentWeatherTime) ?? new Date().toISOString();

    const t24Timestamp = hourlyTimes[t24Index]
      ? (toVietnamIsoString(hourlyTimes[t24Index]) ??
        new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      : new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const t48Timestamp = hourlyTimes[t48Index]
      ? (toVietnamIsoString(hourlyTimes[t48Index]) ??
        new Date(Date.now() - 48 * 3600 * 1000).toISOString())
      : new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    const outdoorData: EnvironmentalData = {
      mode: "outdoor",
      latitude: Number(json?.latitude ?? lat),
      longitude: Number(json?.longitude ?? lon),
      current: {
        temperature: Number(curTemp),
        lightUvIndex: Number(curLightLevel),
        windSpeed: Number(curWind),
        co2Level: 415,
        humidity: Number(curHumidity),
        weatherCode: Number(curWeatherCode),
        updatedAt: currentTimestamp,
      },
      t24: {
        temperature: hourlyTemps[t24Index] ?? 27.0,
        lightUvIndex: hourlyLightLevels[t24Index] ?? 320,
        windSpeed: hourlyWinds[t24Index] ?? 10.5,
        co2Level: 412,
        humidity: hourlyHumidity[t24Index] ?? 76,
        weatherCode: Number(hourlyWeatherCodes[t24Index] ?? curWeatherCode),
        updatedAt: t24Timestamp,
      },
      t48: {
        temperature: hourlyTemps[t48Index] ?? 29.1,
        lightUvIndex: hourlyLightLevels[t48Index] ?? 410,
        windSpeed: hourlyWinds[t48Index] ?? 14.2,
        co2Level: 418,
        humidity: hourlyHumidity[t48Index] ?? 71,
        weatherCode: Number(hourlyWeatherCodes[t48Index] ?? curWeatherCode),
        updatedAt: t48Timestamp,
      },
      isOverridden: false,
      isFallback: false,
      timestamp: currentTimestamp,
    };

    return outdoorData;
  } catch (error) {
    return createEmptyOutdoorWeatherData(lat, lon);
  }
}
