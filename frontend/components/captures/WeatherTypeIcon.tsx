import {
  getWeatherBadgeTextColor,
  getWeatherOption,
} from "@/utils/weatherMetrics";
import React from "react";

export function WeatherTypeIcon({
  code,
  size = 24,
}: {
  code?: number;
  size?: number;
}) {
  const weatherOpt = getWeatherOption(code);
  const Icon = weatherOpt.Icon;
  const color = getWeatherBadgeTextColor(code);
  return <Icon size={size} color={color} strokeWidth={2} />;
}
