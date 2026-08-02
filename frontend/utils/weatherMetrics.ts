import {
  getCaptureWeatherLabel
} from "@/components/shared/CaptureFormParts";
import { COLORS } from "@/constants/theme";
import { WeatherCondition } from "@/types";
import { formatMetric, type WeatherMetricKey } from "@/utils/captureDisplay";
import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Sun,
  Thermometer,
  Wind
} from "lucide-react-native";

export function getWeatherLabel(code?: number, isRaining?: boolean): string {
  return getCaptureWeatherLabel(code, isRaining);
}

export function metricLabel(key: WeatherMetricKey) {
  return {
    temperature: "Nhiệt độ (°C)",
    lightUvIndex: "Ánh sáng (W/m²)",
    windSpeed: "Tốc độ gió (m/s)",
    co2Level: "CO2 (ppm)",
    humidity: "Độ ẩm (%)",
    weatherCode: "Mã thời tiết",
  }[key];
}

export function metricValue(data: WeatherCondition, key: WeatherMetricKey) {
  const value = data[key];
  if (typeof value !== "number" || Number.isNaN(value)) return "--";

  if (key === "temperature") return formatMetric(value);
  if (key === "windSpeed") return formatMetric(value / 3.6, 1);
  if (key === "co2Level") return formatMetric(value);
  if (key === "humidity") return formatMetric(value);

  return formatMetric(value, key === "lightUvIndex" ? 1 : 0);
}

export function metricValueWithUnit(
  data: WeatherCondition,
  key: WeatherMetricKey,
) {
  const value = metricValue(data, key);
  if (value === "--") return value;
  return {
    temperature: `${value}°C`,
    lightUvIndex: `${value} W/m²`,
    windSpeed: `${value} m/s`,
    co2Level: `${value} ppm`,
    humidity: `${value}%`,
    weatherCode: value,
  }[key];
}

export function metricIconMeta(key: WeatherMetricKey) {
  return {
    temperature: { Icon: Thermometer, color: "#f97316" },
    humidity: { Icon: Droplets, color: "#3b82f6" },
    lightUvIndex: { Icon: Sun, color: "#f59e0b" },
    windSpeed: { Icon: Wind, color: "#64748b" },
    co2Level: { Icon: Gauge, color: "#565656" },
    weatherCode: { Icon: CloudSun, color: COLORS.green },
  }[key];
}

export function getWeatherBadgeBgColor(code?: number, isRaining?: boolean): string {
  if (isRaining) return "#e0f2fe";

  if (code === 0) return "#fef3c7";
  if (code === 1 || code === 2) return "#fef3c7";
  if (code === 3) return "#f1f5f9";
  if (code === 45 || code === 48) return "#f1f5f9";
  if (
    code !== undefined &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(
      code,
    )
  ) {
    return "#e0f2fe";
  }
  return "#ecfeff";
}

export function getWeatherBadgeTextColor(code?: number, isRaining?: boolean): string {
  if (isRaining) return "#0284c7";

  if (code === 0) return "#d97706";
  if (code === 1 || code === 2) return "#d97706";
  if (code === 3) return "#475569";
  if (code === 45 || code === 48) return "#475569";
  if (
    code !== undefined &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(
      code,
    )
  ) {
    return "#0284c7";
  }
  return "#0891b2";
}

const RAIN_RELATED_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];

export function getWeatherOption(code?: number, isRaining?: boolean) {
  if (isRaining) {
    return {
      code: code ?? 51,
      categoryCode: 51,
      label: "Mưa",
      Icon: CloudRain,
    };
  }
  if (code === 0) {
    return { code: 0, categoryCode: 0, label: "Trời quang", Icon: Sun };
  }
  if (code === 1 || code === 2) {
    return { code: code ?? 2, categoryCode: 2, label: "Có mây", Icon: CloudSun };
  }
  if (code === 3) {
    return { code: 3, categoryCode: 3, label: "Nhiều mây", Icon: Cloud };
  }
  if (code === 45 || code === 48) {
    return { code: code ?? 45, categoryCode: 45, label: "Sương mù", Icon: CloudFog };
  }
  if (
    code !== undefined &&
    RAIN_RELATED_CODES.includes(code)
  ) {
    return {
      code,
      categoryCode: 51,
      label: "Có khả năng mưa quanh khu vực",
      Icon: CloudRain,
    };
  }
  return {
    code: code ?? -1,
    categoryCode: -1,
    label: "--",
    Icon: Cloud,
  };
}
