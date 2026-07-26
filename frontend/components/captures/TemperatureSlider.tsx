import { COLORS } from "@/constants/theme";
import { metricLabel } from "@/utils/weatherMetrics";
import React, { useCallback, useMemo, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";

export function TemperatureSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const clampedValue = Math.min(40, Math.max(0, value || 0));

  const paddingX = 11;
  const activeWidth = trackWidth ? trackWidth - paddingX * 2 : 0;
  const progress = activeWidth ? (clampedValue / 40) * activeWidth : 0;

  const updateFromX = useCallback(
    (x: number) => {
      if (!trackWidth) return;
      const clampedX = Math.min(trackWidth - paddingX, Math.max(paddingX, x));
      const activeX = clampedX - paddingX;
      const next = (activeX / (trackWidth - paddingX * 2)) * 40;
      onChange(Math.round(next));
    },
    [onChange, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateFromX(event.nativeEvent.locationX);
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [updateFromX],
  );

  return (
    <View style={temperatureSliderStyles.sliderField}>
      <View style={temperatureSliderStyles.sliderHeader}>
        <FieldLabel>{metricLabel("temperature")}</FieldLabel>
        <Text style={temperatureSliderStyles.sliderValue}>{clampedValue}</Text>
      </View>
      <View
        style={temperatureSliderStyles.sliderTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            temperatureSliderStyles.sliderFill,
            { left: paddingX, width: progress },
          ]}
        />
        <View
          style={[
            temperatureSliderStyles.sliderThumb,
            { left: Math.max(0, progress + paddingX - 10) },
          ]}
        />
      </View>
      <View style={temperatureSliderStyles.sliderScale}>
        <Text style={temperatureSliderStyles.sliderScaleText}>0</Text>
        <Text style={temperatureSliderStyles.sliderScaleText}>40</Text>
      </View>
    </View>
  );
}

const temperatureSliderStyles = StyleSheet.create({
  sliderField: {
    gap: 10,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sliderValue: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  sliderTrack: {
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    overflow: "visible",
  },
  sliderFill: {
    position: "absolute",
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.green,
    top: 11,
  },
  sliderThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    borderWidth: 3,
    borderColor: "#fff",
    top: 4,
  },
  sliderScale: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderScaleText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
