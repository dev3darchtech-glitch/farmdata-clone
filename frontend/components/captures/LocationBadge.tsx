import { COLORS } from "@/constants/theme";
import { LocationData } from "@/types";
import { formatCaptureLocationName } from "@/utils/captureDisplay";
import { MapPin } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { weatherMetricBadgeStyles } from "./WeatherMetricBadge";

export function LocationBadge({ location }: { location?: LocationData }) {
  const value = formatCaptureLocationName(location);
  if (!value) return null;

  return (
    <View
      style={[
        weatherMetricBadgeStyles.weatherMetricBadge,
        locationBadgeStyles.locationMetricBadge,
      ]}
    >
      <MapPin size={16} color={COLORS.green} />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          weatherMetricBadgeStyles.weatherMetricBadgeText,
          locationBadgeStyles.locationMetricText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const locationBadgeStyles = StyleSheet.create({
  locationMetricBadge: {
    maxWidth: "100%",
  },
  locationMetricText: {
    flexShrink: 1,
  },
});
