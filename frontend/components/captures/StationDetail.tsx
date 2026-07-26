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
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DetailRow } from "./DetailRow";
import { MetricGrid } from "./MetricGrid";
import { WeatherTypeIcon } from "./WeatherTypeIcon";

export function StationDetail({
  data,
  captureLocation,
  latitude,
  longitude,
  updatedAt,
}: {
  data: WeatherCondition;
  captureLocation?: LocationData;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
}) {
  return (
    <ScrollView
      style={stationDetailStyles.stationDetailScroll}
      contentContainerStyle={stationDetailStyles.stationDetailContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          stationDetailStyles.weatherTypeCard,
          { backgroundColor: getWeatherBadgeBgColor(data.weatherCode) },
        ]}
      >
        <View style={stationDetailStyles.weatherTypeIconWrap}>
          <WeatherTypeIcon code={data.weatherCode} size={20} />
        </View>
        <Text
          style={[
            stationDetailStyles.weatherTypeValue,
            { color: getWeatherBadgeTextColor(data.weatherCode) },
          ]}
        >
          {getWeatherLabel(data.weatherCode)}
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
          value={updatedAt ? formatDate(updatedAt) : undefined}
        />
      </View>
      <View style={stationDetailStyles.stationDetailBlock}>
        <Text style={stationDetailStyles.stationDetailTitle}>
          Dữ liệu thời tiết
        </Text>
        <MetricGrid data={data} />
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
