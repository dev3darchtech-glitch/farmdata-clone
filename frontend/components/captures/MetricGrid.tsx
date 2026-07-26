import { COLORS } from "@/constants/theme";
import { WeatherCondition } from "@/types";
import { WEATHER_CARD_METRIC_KEYS } from "@/utils/captureDisplay";
import {
  metricIconMeta,
  metricLabel,
  metricValueWithUnit,
} from "@/utils/weatherMetrics";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function MetricGrid({ data }: { data: WeatherCondition }) {
  return (
    <View style={metricGridStyles.metricGrid}>
      {WEATHER_CARD_METRIC_KEYS.map((key) => {
        const { Icon, color } = metricIconMeta(key);

        return (
          <View key={key} style={metricGridStyles.metricCell}>
            <View style={metricGridStyles.metricLabelRow}>
              <Icon size={16} color={color} />
              <Text style={metricGridStyles.metricLabel}>
                {metricLabel(key)}
              </Text>
            </View>
            <Text style={metricGridStyles.metricValue}>
              {metricValueWithUnit(data, key)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const metricGridStyles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCell: {
    width: "47%",
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: COLORS.greenSoft,
    padding: 12,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    flex: 1,
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 18,
  },
  metricValue: {
    marginTop: 8,
    color: COLORS.green,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
});
