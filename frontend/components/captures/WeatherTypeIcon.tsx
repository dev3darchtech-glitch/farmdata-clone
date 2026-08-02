import {
  getWeatherBadgeTextColor,
  getWeatherOption,
} from "@/utils/weatherMetrics";
import React from "react";

export function WeatherTypeIcon({
  code,
  size = 24,
  isRaining,
}: {
  code?: number;
  size?: number;
  isRaining?: boolean;
}) {
  const weatherOpt = getWeatherOption(code, isRaining);
  const Icon = weatherOpt.Icon;
  const color = getWeatherBadgeTextColor(code, isRaining);
  return <Icon size={size} color={color} strokeWidth={2} />;
}
