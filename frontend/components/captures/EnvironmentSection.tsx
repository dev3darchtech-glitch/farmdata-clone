import { COLORS } from "@/constants/theme";
import { EnvMode, LocationData, WeatherCondition } from "@/types";
import {
  envName,
  WEATHER_EDITABLE_METRIC_KEYS,
  WeatherStatusIcon,
} from "@/utils/captureDisplay";
import { CaptureSectionOrder, formatSectionTitle } from "@/utils/sectionTitle";
import {
  getWeatherBadgeBgColor,
  getWeatherBadgeTextColor,
  getWeatherLabel,
} from "@/utils/weatherMetrics";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";
import { LocationBadge } from "./LocationBadge";
import { WeatherMetricBadge } from "./WeatherMetricBadge";

export function EnvironmentSection({
  captureLocation,
  envMode,
  onEnvModeChange,
  onOpenStation,
  order,
  stationWeather,
}: {
  captureLocation?: LocationData;
  envMode: EnvMode;
  onEnvModeChange: (mode: EnvMode) => void;
  onOpenStation: () => void;
  order?: CaptureSectionOrder;
  stationWeather: WeatherCondition;
}) {
  return (
    <View style={environmentStyles.section}>
      <FieldLabel required>
        {formatSectionTitle("Môi trường", order)}
      </FieldLabel>
      <View style={environmentStyles.segmented}>
        {(["outdoor", "greenhouse"] as EnvMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[
              environmentStyles.segment,
              envMode === mode && environmentStyles.segmentActive,
            ]}
            onPress={() => onEnvModeChange(mode)}
          >
            <Text
              style={[
                environmentStyles.segmentText,
                envMode === mode && environmentStyles.segmentTextActive,
              ]}
            >
              {envName(mode)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={environmentStyles.stationCard} onPress={onOpenStation}>
        <View
          style={[
            environmentStyles.stationIconWrap,
            {
              backgroundColor: getWeatherBadgeBgColor(
                stationWeather.weatherCode,
                stationWeather.isRaining,
              ),
            },
          ]}
        >
          <WeatherStatusIcon
            code={stationWeather.weatherCode}
            size={24}
            color={getWeatherBadgeTextColor(
              stationWeather.weatherCode,
              stationWeather.isRaining,
            )}
            isRaining={stationWeather.isRaining}
          />
          <Text
            style={[
              environmentStyles.stationWeatherText,
              {
                color: getWeatherBadgeTextColor(
                  stationWeather.weatherCode,
                  stationWeather.isRaining,
                ),
              },
            ]}
          >
            {getWeatherLabel(
              stationWeather.weatherCode,
              stationWeather.isRaining,
            )}
          </Text>
        </View>
        <View style={environmentStyles.stationBody}>
          <View style={environmentStyles.stationBadgeGrid}>
            <LocationBadge location={captureLocation} />
            {WEATHER_EDITABLE_METRIC_KEYS.map((key) => (
              <WeatherMetricBadge
                key={key}
                data={stationWeather}
                metricKey={key}
              />
            ))}
          </View>
          <View style={environmentStyles.stationLinkRow}>
            <Text style={environmentStyles.stationLinkText}>
              Xem thêm chi tiết
            </Text>
            <ChevronRight size={14} color={COLORS.green} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const environmentStyles = StyleSheet.create({
  section: {
    gap: 16,
  },
  segmented: {
    flexDirection: "row",
    gap: 16,
  },
  segment: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  segmentActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
    borderWidth: 2,
  },
  segmentText: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  segmentTextActive: {
    color: "#fff",
  },
  stationCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  stationIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: "rgba(234,242,157,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    gap: 2,
  },
  stationWeatherText: {
    color: COLORS.body,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  stationBody: {
    flex: 1,
    gap: 8,
  },
  stationBadgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stationLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stationLinkText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 20,
  },
});
