import { COLORS } from "@/constants/theme";
import { LocationData, WeatherCondition } from "@/types";
import {
  formatCaptureLocationName,
  formatCoordinateValue,
  formatDate,
  formatMetric,
} from "@/utils/captureDisplay";
import {
  getWeatherBadgeBgColor,
  getWeatherBadgeTextColor,
  getWeatherLabel,
} from "@/utils/weatherMetrics";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { DetailRow } from "./DetailRow";
import { MetricGrid } from "./MetricGrid";
import { WeatherTypeIcon } from "./WeatherTypeIcon";

export function StationDetail({
  data,
  t24,
  t48,
  captureLocation,
  latitude,
  longitude,
  updatedAt,
}: {
  data: WeatherCondition;
  t24?: WeatherCondition;
  t48?: WeatherCondition;
  captureLocation?: LocationData;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
}) {
  const [activeTab, setActiveTab] = useState<"t0" | "t24" | "t48">( "t0");

  const activeData =
    activeTab === "t0"
      ? data
      : activeTab === "t24"
        ? t24 || data
        : t48 || data;

  const tabs = [
    { id: "t0" as const, label: "Hiện tại (T0)" },
    { id: "t24" as const, label: "T-24" },
    { id: "t48" as const, label: "T-48" },
  ];

  return (
    <ScrollView
      style={stationDetailStyles.stationDetailScroll}
      contentContainerStyle={stationDetailStyles.stationDetailContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <View style={stationDetailStyles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                stationDetailStyles.tabButton,
                isActive && stationDetailStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  stationDetailStyles.tabButtonText,
                  isActive && stationDetailStyles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          stationDetailStyles.weatherTypeCard,
          { backgroundColor: getWeatherBadgeBgColor(activeData.weatherCode) },
        ]}
      >
        <View style={stationDetailStyles.weatherTypeIconWrap}>
          <WeatherTypeIcon code={activeData.weatherCode} size={20} />
        </View>
        <Text
          style={[
            stationDetailStyles.weatherTypeValue,
            { color: getWeatherBadgeTextColor(activeData.weatherCode) },
          ]}
        >
          {getWeatherLabel(activeData.weatherCode)}
        </Text>
      </View>

      <View style={stationDetailStyles.stationDetailBlock}>
        <Text style={stationDetailStyles.stationDetailTitle}>Vị trí chụp</Text>
        <DetailRow
          label="Tên vị trí"
          value={formatCaptureLocationName(captureLocation)}
        />
        <DetailRow
          label="Vĩ độ"
          value={formatCoordinateValue(captureLocation?.latitude ?? latitude)}
        />
        <DetailRow
          label="Kinh độ"
          value={formatCoordinateValue(captureLocation?.longitude ?? longitude)}
        />
        <DetailRow
          label="Độ chính xác GPS"
          value={
            typeof captureLocation?.accuracy === "number"
              ? `${formatMetric(captureLocation.accuracy, 1)} m`
              : undefined
          }
        />
        <DetailRow
          label="Thời điểm chụp"
          value={
            captureLocation?.timestamp
              ? formatDate(captureLocation.timestamp)
              : undefined
          }
        />
        <DetailRow
          label="Cập nhật thời tiết"
          value={
            activeData.updatedAt
              ? formatDate(activeData.updatedAt)
              : updatedAt
                ? formatDate(updatedAt)
                : undefined
          }
        />
      </View>
      <View style={stationDetailStyles.stationDetailBlock}>
        <Text style={stationDetailStyles.stationDetailTitle}>
          Dữ liệu thời tiết ({activeTab === "t0" ? "T0" : activeTab === "t24" ? "T-24" : "T-48"})
        </Text>
        <MetricGrid data={activeData} />
      </View>
    </ScrollView>
  );
}

const stationDetailStyles = StyleSheet.create({
  stationDetailScroll: {
    flex: 1,
  },
  stationDetailContent: {
    paddingBottom: 28,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.field,
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
    gap: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  tabButtonTextActive: {
    color: COLORS.green,
  },
  weatherTypeCard: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  weatherTypeValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  weatherTypeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  stationDetailBlock: {
    gap: 10,
    marginBottom: 20,
  },
  stationDetailTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
});
