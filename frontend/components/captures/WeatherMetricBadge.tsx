import { COLORS } from "@/constants/theme";
import { WeatherCondition } from "@/types";
import { type WeatherMetricKey } from "@/utils/captureDisplay";
import {
  getWeatherBadgeTextColor,
  getWeatherLabel,
  getWeatherOption,
  metricIconMeta,
  metricValueWithUnit,
} from "@/utils/weatherMetrics";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function WeatherMetricBadge({
  data,
  metricKey,
}: {
  data: WeatherCondition;
  metricKey: WeatherMetricKey;
}) {
  const isWeather = metricKey === "weatherCode";
  const weatherOpt = isWeather
    ? getWeatherOption(data.weatherCode, data.isRaining)
    : null;

  const Icon = isWeather ? weatherOpt!.Icon : metricIconMeta(metricKey).Icon;
  const color = isWeather
    ? getWeatherBadgeTextColor(data.weatherCode, data.isRaining)
    : metricIconMeta(metricKey).color;
  const label = isWeather
    ? getWeatherLabel(data.weatherCode, data.isRaining)
    : metricValueWithUnit(data, metricKey);

  return (
    <View style={weatherMetricBadgeStyles.weatherMetricBadge}>
      <Icon size={16} color={color} />
      <Text style={weatherMetricBadgeStyles.weatherMetricBadgeText}>
        {label}
      </Text>
    </View>
  );
}

export const weatherMetricBadgeStyles = StyleSheet.create({
  weatherMetricBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  weatherMetricBadgeText: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700",
  },
});
