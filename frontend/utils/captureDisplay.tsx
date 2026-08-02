import { getGrowthStageById, GROWTH_STAGES } from "@/constants/growthStages";
import { COLORS } from "@/constants/theme";
import {
  EnvMode,
  GrowthStageId,
  LocationData,
  PlotInfo,
  Post,
  SymptomSeverity,
  UserRole,
} from "@/types";
import {
  Apple,
  CameraIcon,
  Carrot,
  Cherry,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  FileText,
  Flame,
  Flower2,
  LayoutDashboardIcon,
  Leaf,
  LeafyGreen,
  Salad,
  Sprout,
  Sun,
  Tractor,
  TreePine,
  UserIcon,
  Vegan,
} from "lucide-react-native";
import React from "react";

export type SheetKind =
  | "plot"
  | "farm"
  | "crop"
  | "stage"
  | "station"
  | "measurement"
  | "diseaseGroup"
  | "diseaseType"
  | "diseaseName"
  | "success"
  | "error"
  | "filter"
  | "sort"
  | "add";
export type TabRouteId = "capture" | "posts" | "management" | "profile";
export type TabTransitionDirection = "forward" | "backward";
export type WeatherMetricKey =
  | "temperature"
  | "lightUvIndex"
  | "windSpeed"
  | "co2Level"
  | "humidity"
  | "weatherCode";

export const WEATHER_EDITABLE_METRIC_KEYS: WeatherMetricKey[] = [
  "temperature",
  "humidity",
  "lightUvIndex",
  "windSpeed",
  "co2Level",
];

export const WEATHER_CARD_METRIC_KEYS: WeatherMetricKey[] = [
  ...WEATHER_EDITABLE_METRIC_KEYS,
  "weatherCode",
];

export function normalizeRole(role?: string | null) {
  return String(role || "farmer").toLowerCase() === "admin"
    ? "admin"
    : "farmer";
}

export function tabItemsForRole(role: UserRole | string = "farmer") {
  return normalizeRole(role) === "admin"
    ? [
        {
          id: "posts" as const,
          label: "Bài đăng",
          route: "/(tabs)/posts",
          icon: FileText,
        },
        {
          id: "capture" as const,
          label: "Chụp ảnh",
          route: "/(tabs)/capture",
          icon: CameraIcon,
        },
        {
          id: "management" as const,
          label: "Quản lý",
          route: "/(tabs)/management",
          icon: LayoutDashboardIcon,
        },
        {
          id: "profile" as const,
          label: "Cá nhân",
          route: "/(tabs)/profile",
          icon: UserIcon,
        },
      ]
    : [
        {
          id: "posts" as const,
          label: "Bài đăng",
          route: "/(tabs)/posts",
          icon: FileText,
        },
        {
          id: "capture" as const,
          label: "Chụp ảnh",
          route: "/(tabs)/capture",
          icon: CameraIcon,
        },
        {
          id: "profile" as const,
          label: "Cá nhân",
          route: "/(tabs)/profile",
          icon: UserIcon,
        },
      ];
}

export function tabDirectionForTarget(
  items: ReturnType<typeof tabItemsForRole>,
  active: TabRouteId,
  target: TabRouteId,
): TabTransitionDirection {
  const activeIndex = items.findIndex((item) => item.id === active);
  const targetIndex = items.findIndex((item) => item.id === target);

  if (activeIndex < 0 || targetIndex < 0) return "forward";
  return targetIndex === (activeIndex + 1) % items.length
    ? "forward"
    : "backward";
}

export function tabHrefWithDirection(
  route: string,
  direction: TabTransitionDirection,
) {
  return {
    pathname: route,
    params: {
      tabDirection: direction,
    },
  };
}

export function stageName(id?: GrowthStageId) {
  return getGrowthStageById(id)?.nameVi || "Chọn một trong 5 giai đoạn";
}

export function stagePostName(id?: GrowthStageId) {
  const index = GROWTH_STAGES.findIndex((stage) => stage.id === id);
  return index >= 0 ? `Giai đoạn ${index + 1}` : stageName(id);
}

export function stageSheetName(id: GrowthStageId) {
  return {
    newly_planted: "1. Mới trồng",
    vegetative: "2. Sinh trưởng",
    flowering: "3. Ra hoa",
    fruiting: "4. Kết trái",
    harvest: "5. Thu hoạch",
  }[id];
}

export function stageSheetDescription(id: GrowthStageId, fallback: string) {
  return (
    {
      newly_planted: "Hạt nảy mầm, cây con",
      vegetative: "Cây phát triển thân lá",
      flowering: "Xuất hiện nụ hoa",
      fruiting: "Quá trình hình thành và lớn dần",
      harvest: "Quả chín, thu hoạch",
    }[id] || fallback
  );
}

export function envName(env?: EnvMode) {
  return env === "greenhouse" ? "Nhà kính" : "Ngoài trời";
}

export function severityLabel(severity?: SymptomSeverity) {
  if (!severity) return "";
  const labels: Record<SymptomSeverity, string> = {
    "Chớm bệnh": "Chớm (1 - 10%)",
    Nhẹ: "Nhẹ (>10 - 25%)",
    Vừa: "Vừa (>25 - 50%)",
    Nặng: "Nặng (>50 - 75%)",
    "Rất nặng": "Rất nặng (>75%)",
  };
  return labels[severity];
}

export function severityDotColor(severity?: SymptomSeverity) {
  switch (severity) {
    case "Chớm bệnh":
      return "#22c55e";
    case "Nhẹ":
      return "#f59e0b";
    case "Vừa":
      return "#ea580c";
    case "Nặng":
    case "Rất nặng":
      return "#dc2626";
    default:
      return COLORS.muted;
  }
}

export function metricLabel(key: WeatherMetricKey) {
  return {
    temperature: "Nhiệt độ",
    lightUvIndex: "Ánh sáng",
    windSpeed: "Gió",
    co2Level: "CO₂",
    humidity: "Độ ẩm",
    weatherCode: "Thời tiết",
  }[key];
}

export function formatMetric(value?: number, fractionDigits = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(fractionDigits);
}

export function formatCoordinateValue(value?: number) {
  return typeof value === "number" && !Number.isNaN(value)
    ? value.toFixed(6)
    : "--";
}

export function formatCaptureLocationName(location?: LocationData) {
  return (
    location?.region ||
    location?.formattedAddress ||
    location?.name ||
    [location?.region, location?.region, location?.country]
      .filter(Boolean)
      .join(", ") ||
    "Vị trí chụp"
  );
}

export function plotSheetMeta(plot: PlotInfo) {
  const area = plot.areaSquareMeters
    ? `${plot.areaSquareMeters} m²`
    : undefined;
  return [envName(plot.envMode), plot.name.trim(), area]
    .filter(Boolean)
    .join(" • ");
}

export function normalizePostIdentity(post: Post & { _id?: string }) {
  return {
    ...post,
    id:
      post.id ||
      post._id ||
      post.sessionId ||
      `${post.createdAt}-${post.cropType}-${post.plotId || "no-plot"}`,
  };
}

export function postListKey(post: Post & { _id?: string }, index: number) {
  return [
    post.id || post._id || post.sessionId || "post",
    post.createdAt || "no-date",
    index,
  ].join("-");
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function formatPostDate(value: string) {
  return formatDate(value).replace(",", " -");
}

export function WeatherStatusIcon({
  code,
  size = 24,
  color,
}: {
  code?: number;
  size?: number;
  color?: string;
}) {
  const iconColor = color || COLORS.green;

  if (code === 0) return <Sun size={size} color={iconColor} />;
  if (code === 1 || code === 2) {
    return <CloudSun size={size} color={iconColor} />;
  }
  if (code === 3) return <Cloud size={size} color={iconColor} />;
  if (code === 45 || code === 48) {
    return <CloudFog size={size} color={iconColor} />;
  }
  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return <CloudSnow size={size} color={iconColor} />;
  }
  if (code && code >= 51) return <CloudRain size={size} color={iconColor} />;

  return <CloudSun size={size} color={iconColor} />;
}

export type LucideIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export function stageIcon(id: GrowthStageId): LucideIconComponent {
  return {
    newly_planted: Sprout,
    vegetative: TreePine,
    flowering: Flower2,
    fruiting: Apple,
    harvest: Tractor,
  }[id];
}

export function cropIcon(name: string): LucideIconComponent {
  const normalized = name.toLowerCase();
  if (normalized.includes("cà chua")) return Leaf;
  if (normalized.includes("dưa")) return Cherry;
  if (normalized.includes("ớt")) return Flame;
  if (normalized.includes("khoai")) return Carrot;
  if (normalized.includes("xà lách")) return Salad;
  if (normalized.includes("bắp cải")) return LeafyGreen;
  if (normalized.includes("hành")) return Vegan;
  return Sprout;
}

export function getCropColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("cà chua")) return "#dc2626";
  if (normalized.includes("dưa")) return "#f97316";
  if (normalized.includes("ớt")) return "#ea580c";
  if (normalized.includes("khoai")) return "#854d0e";
  if (normalized.includes("xà lách")) return "#16a34a";
  if (normalized.includes("bắp cải")) return "#65a30d";
  if (normalized.includes("hành")) return "#059669";
  return "#15803d";
}

export function getCropBgColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("cà chua")) return "#fee2e2";
  if (normalized.includes("dưa")) return "#ffedd5";
  if (normalized.includes("ớt")) return "#ffedd5";
  if (normalized.includes("khoai")) return "#fef9c3";
  if (normalized.includes("xà lách")) return "#dcfce7";
  if (normalized.includes("bắp cải")) return "#f0fdf4";
  if (normalized.includes("hành")) return "#ecfdf5";
  return "#eef7e9";
}
