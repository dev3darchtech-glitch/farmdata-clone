import {
  CAPTURE_WEATHER_OPTIONS,
  getCaptureWeatherLabel,
} from "@/components/shared/CaptureFormParts";
import { COLORS } from "@/constants/theme";
import { WeatherCondition } from "@/types";
import { formatMetric, type WeatherMetricKey } from "@/utils/captureDisplay";
import {
  CloudSun,
  Droplets,
  Gauge,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react-native";

export function getWeatherLabel(code?: number): string {
  return getCaptureWeatherLabel(code);
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

export function getWeatherBadgeBgColor(code?: number): string {
  if (code === 0) return "#fef3c7";
  if (code === 1 || code === 2) return "#fef3c7";
  if (code === 3) return "#f1f5f9";
  if (code === 45 || code === 48) return "#f1f5f9";
  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "#e0f2fe";
  }
  return "#ecfeff";
}

export function getWeatherBadgeTextColor(code?: number): string {
  if (code === 0) return "#d97706";
  if (code === 1 || code === 2) return "#d97706";
  if (code === 3) return "#475569";
  if (code === 45 || code === 48) return "#475569";
  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "#0284c7";
  }
  return "#0891b2";
}

export function getWeatherOption(code?: number) {
  return (
    CAPTURE_WEATHER_OPTIONS.find((option) => option.code === code) ||
    CAPTURE_WEATHER_OPTIONS[0]
  );
}
