import { COLORS } from "@/constants/theme";
import { metricLabel } from "@/utils/weatherMetrics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";

export function TemperatureSlider({
  value,
  onChange,
  onSlidingChange,
}: {
  value: number;
  onChange: (value: number) => void;
  onSlidingChange?: (isSliding: boolean) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragValue, setDragValue] = useState(() =>
    Math.min(50, Math.max(0, value || 0)),
  );
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const lastValueRef = useRef(dragValue);
  const isSlidingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onSlidingChangeRef = useRef(onSlidingChange);
  const clampedValue = Math.min(50, Math.max(0, dragValue || 0));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSlidingChangeRef.current = onSlidingChange;
  }, [onSlidingChange]);

  useEffect(() => {
    if (isSlidingRef.current) return;
    const nextValue = Math.min(50, Math.max(0, value || 0));
    lastValueRef.current = nextValue;
    setDragValue(nextValue);
  }, [value]);

  const paddingX = 11;
  const activeWidth = trackWidth ? trackWidth - paddingX * 2 : 0;
  const progress = activeWidth ? (clampedValue / 50) * activeWidth : 0;

  const updateFromPageX = (pageX: number) => {
    const width = trackWidthRef.current;
    if (!width) return;

    const localX = pageX - trackPageXRef.current;
    const clampedX = Math.min(width - paddingX, Math.max(paddingX, localX));
    const activeRange = width - paddingX * 2;
    if (!activeRange) return;

    const activeX = clampedX - paddingX;
    const next = Math.round((activeX / activeRange) * 50);
    if (next === lastValueRef.current) return;

    lastValueRef.current = next;
    setDragValue(next);
    onChangeRef.current(next);
  };

  const measureTrack = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      trackWidthRef.current = width || trackWidthRef.current;
    });
  };

  const setSliding = (next: boolean) => {
    if (isSlidingRef.current === next) return;
    isSlidingRef.current = next;
    onSlidingChangeRef.current?.(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          setSliding(true);
          measureTrack();
          updateFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (event) => {
          updateFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderRelease: () => {
          setSliding(false);
        },
        onPanResponderTerminate: () => {
          setSliding(false);
        },
        onShouldBlockNativeResponder: () => true,
      }),
    [],
  );

  return (
    <View style={temperatureSliderStyles.sliderField}>
      <View style={temperatureSliderStyles.sliderHeader}>
        <FieldLabel>{metricLabel("temperature")}</FieldLabel>
        <Text style={temperatureSliderStyles.sliderValue}>{clampedValue}</Text>
      </View>
      <View
        ref={trackRef}
        style={temperatureSliderStyles.sliderTrack}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          trackWidthRef.current = width;
          setTrackWidth(width);
          measureTrack();
        }}
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
        <Text style={temperatureSliderStyles.sliderScaleText}>50</Text>
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
