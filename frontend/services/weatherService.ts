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
    humidity: undefined,
    weatherCode: undefined,
    updatedAt: undefined,
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
    t12: createEmptyWeatherCondition(),
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

function toVietnamSeriesTime(value?: string): string | undefined {
  const parsedIso = toVietnamIsoString(value);
  if (!parsedIso) return undefined;

  const localDate = new Date(new Date(parsedIso).getTime() + 7 * 3600 * 1000);
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(localDate.getUTCDate()).padStart(2, "0");
  const hour = String(localDate.getUTCHours()).padStart(2, "0");
  const minute = String(localDate.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function shiftVietnamSeriesTime(
  value: string | undefined,
  hoursDelta: number,
): string | undefined {
  const parsedIso = toVietnamIsoString(value);
  if (!parsedIso) return undefined;

  const shifted = new Date(
    new Date(parsedIso).getTime() + hoursDelta * 3600 * 1000,
  );
  return toVietnamSeriesTime(shifted.toISOString());
}

function resolveCurrentSeriesIndex(
  seriesTimes: string[],
  currentWeatherTime?: string,
): number {
  if (!seriesTimes.length) return 0;
  if (!currentWeatherTime) return Math.max(0, seriesTimes.length - 1);

  const exactIndex = seriesTimes.indexOf(currentWeatherTime);
  if (exactIndex >= 0) return exactIndex;

  for (let index = seriesTimes.length - 1; index >= 0; index -= 1) {
    if (seriesTimes[index] <= currentWeatherTime) {
      return index;
    }
  }

  return 0;
}

function buildWeatherSnapshot(params: {
  index: number;
  seriesHumidity: number[];
  seriesLightLevels: number[];
  seriesTemps: number[];
  seriesTimes: string[];
  seriesWeatherCodes: number[];
  seriesWinds: number[];
  seriesPrecipitation?: number[];
  seriesRain?: number[];
  seriesShowers?: number[];
  seriesCloudCover?: number[];
  seriesIsDay?: number[];
}): WeatherCondition {
  const {
    index,
    seriesHumidity,
    seriesLightLevels,
    seriesTemps,
    seriesTimes,
    seriesWeatherCodes,
    seriesWinds,
    seriesPrecipitation = [],
    seriesRain = [],
    seriesShowers = [],
    seriesCloudCover = [],
    seriesIsDay = [],
  } = params;
  if (
    index < 0 ||
    index >= seriesTimes.length ||
    typeof seriesTimes[index] !== "string"
  ) {
    return createEmptyWeatherCondition();
  }

  const resolvedIndex = index;
  const resolvedTime = seriesTimes[resolvedIndex];

  const curPrecipitation =
    typeof seriesPrecipitation[resolvedIndex] === "number"
      ? seriesPrecipitation[resolvedIndex]
      : undefined;
  const curRain =
    typeof seriesRain[resolvedIndex] === "number"
      ? seriesRain[resolvedIndex]
      : undefined;
  const curShowers =
    typeof seriesShowers[resolvedIndex] === "number"
      ? seriesShowers[resolvedIndex]
      : undefined;
  const isRaining = resolveIsRaining({
    rain: curRain,
    showers: curShowers,
    precipitation: curPrecipitation,
  });

  return {
    temperature:
      typeof seriesTemps[resolvedIndex] === "number"
        ? seriesTemps[resolvedIndex]
        : NaN,
    lightUvIndex:
      typeof seriesLightLevels[resolvedIndex] === "number"
        ? seriesLightLevels[resolvedIndex]
        : NaN,
    windSpeed:
      typeof seriesWinds[resolvedIndex] === "number"
        ? seriesWinds[resolvedIndex]
        : NaN,
    co2Level: NaN,
    humidity:
      typeof seriesHumidity[resolvedIndex] === "number"
        ? seriesHumidity[resolvedIndex]
        : undefined,
    weatherCode:
      typeof seriesWeatherCodes[resolvedIndex] === "number"
        ? seriesWeatherCodes[resolvedIndex]
        : undefined,
    isRaining,
    precipitation: seriesPrecipitation[resolvedIndex],
    rain: seriesRain[resolvedIndex],
    showers: seriesShowers[resolvedIndex],
    cloudCover: seriesCloudCover[resolvedIndex],
    isDay:
      typeof seriesIsDay[resolvedIndex] === "number"
        ? seriesIsDay[resolvedIndex] === 1
        : undefined,
    updatedAt: resolvedTime ? toVietnamIsoString(resolvedTime) : undefined,
  };
}

function resolveSeriesValueAtOrBefore(
  seriesTimes: string[],
  values: number[],
  targetTime?: string,
): number | undefined {
  if (!targetTime || !seriesTimes.length) return undefined;

  for (let index = seriesTimes.length - 1; index >= 0; index -= 1) {
    if (
      seriesTimes[index] <= targetTime &&
      typeof values[index] === "number" &&
      !Number.isNaN(values[index])
    ) {
      return values[index];
    }
  }

  return undefined;
}

export function resolveIsRaining(params: {
  rain?: number;
  showers?: number;
  precipitation?: number;
}): boolean | undefined {
  const { rain, showers, precipitation } = params;

  const hasRainData =
    typeof rain === "number" || typeof showers === "number";

  if (hasRainData) {
    return (rain ?? 0) + (showers ?? 0) > 0.05;
  }

  if (typeof precipitation === "number") {
    return precipitation > 0.05;
  }

  return undefined;
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

    const currentVariables = [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "weather_code",
      "shortwave_radiation",
      "precipitation",
      "rain",
      "showers",
      "cloud_cover",
      "is_day",
    ].join(",");

    const minutelyVariables = [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "weather_code",
      "shortwave_radiation",
      "precipitation",
      "rain",
      "showers",
      "cloud_cover",
      "is_day",
    ].join(",");

    const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentVariables}&minutely_15=${minutelyVariables}&past_minutely_15=192&forecast_minutely_15=1&timezone=Asia%2FHo_Chi_Minh`;
    const airQualityApiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=carbon_dioxide&hourly=carbon_dioxide&past_hours=48&forecast_hours=1&timezone=Asia%2FHo_Chi_Minh`;

    const [response, airQualityResponse] = await Promise.all([
      fetch(weatherApiUrl, { signal: controller.signal }),
      (async () => {
        try {
          return await fetch(airQualityApiUrl, { signal: controller.signal });
        } catch {
          return null;
        }
      })(),
    ]);
    clearTimeout(timeoutId);

    if (!response.ok) {
      return createEmptyOutdoorWeatherData(lat, lon);
    }

    const [json, airQualityJson] = await Promise.all([
      response.json(),
      airQualityResponse?.ok
        ? airQualityResponse.json().catch(() => null)
        : null,
    ]);

    const curTemp = json?.current?.temperature_2m;
    const curWind =
      json?.current?.wind_speed_10m ?? json?.current?.windspeed_10m;
    const curWeatherCode = json?.current?.weather_code;
    const curHumidityValue = json?.current?.relative_humidity_2m;
    const curLightValue = json?.current?.shortwave_radiation;
    const currentWeatherTime = json?.current?.time;

    const seriesTemps: number[] = json?.minutely_15?.temperature_2m ?? [];
    const seriesHumidity: number[] =
      json?.minutely_15?.relative_humidity_2m ?? [];
    const seriesWinds: number[] =
      json?.minutely_15?.wind_speed_10m ??
      json?.minutely_15?.windspeed_10m ??
      [];
    const seriesLightLevels: number[] =
      json?.minutely_15?.shortwave_radiation ?? [];
    const seriesWeatherCodes: number[] = json?.minutely_15?.weather_code ?? [];
    const seriesTimes: string[] = json?.minutely_15?.time ?? [];
    const seriesPrecipitation: number[] = json?.minutely_15?.precipitation ?? [];
    const seriesRain: number[] = json?.minutely_15?.rain ?? [];
    const seriesShowers: number[] = json?.minutely_15?.showers ?? [];
    const seriesCloudCover: number[] = json?.minutely_15?.cloud_cover ?? [];
    const seriesIsDay: number[] = json?.minutely_15?.is_day ?? [];

    const currentIndex = resolveCurrentSeriesIndex(
      seriesTimes,
      currentWeatherTime,
    );
    const intervalsPerDay = 24 * 4; // 96 intervals per 24h (15-min intervals)
    const intervalsT12 = 12 * 4; // 48 intervals per 12h
    const t12Index = Math.max(0, currentIndex - intervalsT12);
    const t24Index = Math.max(0, currentIndex - intervalsPerDay);
    const t48Index = Math.max(0, currentIndex - intervalsPerDay * 2);

    const currentTimestamp = toVietnamIsoString(currentWeatherTime);
    const currentSeriesTime = toVietnamSeriesTime(currentWeatherTime);
    const t12TargetTime = shiftVietnamSeriesTime(currentWeatherTime, -12);
    const t24TargetTime = shiftVietnamSeriesTime(currentWeatherTime, -24);
    const t48TargetTime = shiftVietnamSeriesTime(currentWeatherTime, -48);
    const airQualityCurrentCo2 = airQualityJson?.current?.carbon_dioxide;
    const airQualitySeriesTimes: string[] = airQualityJson?.hourly?.time ?? [];
    const airQualitySeriesCo2: number[] =
      airQualityJson?.hourly?.carbon_dioxide ?? [];

    const currentRain =
      typeof json?.current?.rain === "number"
        ? json.current.rain
        : undefined;
    const currentShowers =
      typeof json?.current?.showers === "number"
        ? json.current.showers
        : undefined;
    const currentPrecipitation =
      typeof json?.current?.precipitation === "number"
        ? json.current.precipitation
        : undefined;

    const isRaining = resolveIsRaining({
      rain: currentRain,
      showers: currentShowers,
      precipitation: currentPrecipitation,
    });

    const currentSnapshot: WeatherCondition = {
      temperature: typeof curTemp === "number" ? curTemp : NaN,
      lightUvIndex: typeof curLightValue === "number" ? curLightValue : NaN,
      windSpeed: typeof curWind === "number" ? curWind : NaN,
      co2Level:
        typeof airQualityCurrentCo2 === "number" &&
        !Number.isNaN(airQualityCurrentCo2)
          ? airQualityCurrentCo2
          : typeof currentSeriesTime === "string"
            ? (resolveSeriesValueAtOrBefore(
                airQualitySeriesTimes,
                airQualitySeriesCo2,
                currentSeriesTime,
              ) ?? NaN)
            : NaN,
      humidity:
        typeof curHumidityValue === "number" ? curHumidityValue : undefined,
      weatherCode:
        typeof curWeatherCode === "number"
          ? curWeatherCode
          : typeof seriesWeatherCodes[currentIndex] === "number"
            ? seriesWeatherCodes[currentIndex]
            : undefined,
      isRaining,
      precipitation: currentPrecipitation,
      rain: currentRain,
      showers: currentShowers,
      cloudCover:
        typeof json?.current?.cloud_cover === "number"
          ? json.current.cloud_cover
          : undefined,
      isDay:
        typeof json?.current?.is_day === "number"
          ? json.current.is_day === 1
          : undefined,
      updatedAt: currentTimestamp,
    };
    const t12Snapshot = buildWeatherSnapshot({
      index: t12Index,
      seriesHumidity,
      seriesLightLevels,
      seriesTemps,
      seriesTimes,
      seriesWeatherCodes,
      seriesWinds,
      seriesPrecipitation,
      seriesRain,
      seriesShowers,
      seriesCloudCover,
      seriesIsDay,
    });
    t12Snapshot.co2Level =
      resolveSeriesValueAtOrBefore(
        airQualitySeriesTimes,
        airQualitySeriesCo2,
        t12TargetTime,
      ) ?? NaN;
    const t24Snapshot = buildWeatherSnapshot({
      index: t24Index,
      seriesHumidity,
      seriesLightLevels,
      seriesTemps,
      seriesTimes,
      seriesWeatherCodes,
      seriesWinds,
      seriesPrecipitation,
      seriesRain,
      seriesShowers,
      seriesCloudCover,
      seriesIsDay,
    });
    t24Snapshot.co2Level =
      resolveSeriesValueAtOrBefore(
        airQualitySeriesTimes,
        airQualitySeriesCo2,
        t24TargetTime,
      ) ?? NaN;
    const t48Snapshot = buildWeatherSnapshot({
      index: t48Index,
      seriesHumidity,
      seriesLightLevels,
      seriesTemps,
      seriesTimes,
      seriesWeatherCodes,
      seriesWinds,
      seriesPrecipitation,
      seriesRain,
      seriesShowers,
      seriesCloudCover,
      seriesIsDay,
    });
    t48Snapshot.co2Level =
      resolveSeriesValueAtOrBefore(
        airQualitySeriesTimes,
        airQualitySeriesCo2,
        t48TargetTime,
      ) ?? NaN;

    const outdoorData: EnvironmentalData = {
      mode: "outdoor",
      latitude: Number(json?.latitude ?? lat),
      longitude: Number(json?.longitude ?? lon),
      current: currentSnapshot,
      t12: t12Snapshot,
      t24: t24Snapshot,
      t48: t48Snapshot,
      isOverridden: false,
      isFallback: false,
      timestamp: currentTimestamp,
    };

    return outdoorData;
  } catch {
    return createEmptyOutdoorWeatherData(lat, lon);
  }
}
