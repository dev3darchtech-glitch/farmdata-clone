import { COLORS } from "@/constants/theme";
import { LocalWeatherMeasurement } from "@/types";
import { formatMetric } from "@/utils/captureDisplay";
import { CaptureSectionOrder, formatSectionTitle } from "@/utils/sectionTitle";
import { getWeatherLabel } from "@/utils/weatherMetrics";
import { ChevronRight, CircleCheck } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";

export function LocalMeasurementSection({
  localMeasurements,
  onOpenMeasurement,
  order,
}: {
  localMeasurements?: LocalWeatherMeasurement;
  onOpenMeasurement: () => void;
  order?: CaptureSectionOrder;
}) {
  return (
    <View
      style={[measurementStyles.section, measurementStyles.sectionTopPadding]}
    >
      <FieldLabel required>
        {formatSectionTitle("Số đo tại nơi", order)}
      </FieldLabel>
      <Pressable
        style={[
          measurementStyles.measureButton,
          localMeasurements && {
            height: "auto",
            paddingVertical: 14,
            flexDirection: "column",
            alignItems: "stretch",
          },
        ]}
        onPress={onOpenMeasurement}
      >
        {localMeasurements ? (
          <View style={measurementStyles.measureEnteredContainer}>
            <View style={measurementStyles.measureHeader}>
              <View style={measurementStyles.measureStatusRow}>
                <CircleCheck size={18} color={COLORS.green} />
                <Text
                  style={[
                    measurementStyles.measureText,
                    { color: COLORS.green, fontWeight: "700" },
                  ]}
                >
                  Đã nhập số đo tại nơi
                </Text>
              </View>
              <View style={measurementStyles.measureActionRow}>
                <Text style={measurementStyles.linkText}>Chỉnh sửa</Text>
                <ChevronRight size={16} color={COLORS.green} />
              </View>
            </View>

            <View style={measurementStyles.measureTable}>
              <MeasurementRow
                leftLabel="Thời tiết"
                leftValue={
                  localMeasurements.weatherCode !== undefined
                    ? getWeatherLabel(localMeasurements.weatherCode)
                    : "--"
                }
                rightLabel="Nhiệt độ"
                rightValue={
                  localMeasurements.temperature !== undefined
                    ? `${localMeasurements.temperature}°C`
                    : "--"
                }
              />
              <MeasurementRow
                bordered
                leftLabel="Độ ẩm KK"
                leftValue={
                  localMeasurements.humidity !== undefined
                    ? `${localMeasurements.humidity}%`
                    : "--"
                }
                rightLabel="Ánh sáng"
                rightValue={
                  localMeasurements.lightUvIndex !== undefined
                    ? `${formatMetric(localMeasurements.lightUvIndex)} lx`
                    : "--"
                }
              />
              <MeasurementRow
                bordered
                leftLabel="Tốc độ gió"
                leftValue={
                  localMeasurements.windSpeed !== undefined
                    ? `${localMeasurements.windSpeed} m/s`
                    : "--"
                }
                rightLabel="CO2"
                rightValue={
                  localMeasurements.co2Level !== undefined
                    ? `${localMeasurements.co2Level} ppm`
                    : "--"
                }
              />
              <MeasurementRow
                bordered
                leftLabel="pH đất"
                leftValue={localMeasurements.soilPh || "--"}
                rightLabel="EC đất"
                rightValue={
                  localMeasurements.soilEc
                    ? `${localMeasurements.soilEc} mS`
                    : "--"
                }
              />
              <MeasurementRow
                bordered
                leftLabel="DO đất"
                leftValue={
                  localMeasurements.soilDo
                    ? `${localMeasurements.soilDo} mg/L`
                    : "--"
                }
                rightLabel="Độ ẩm đất"
                rightValue={
                  localMeasurements.soilHumidity
                    ? `${localMeasurements.soilHumidity}%`
                    : "--"
                }
              />
            </View>
          </View>
        ) : (
          <>
            <View style={measurementStyles.measureStatusRow}>
              <Text style={measurementStyles.measureIcon}>↯</Text>
              <Text style={measurementStyles.measureText}>Chưa nhập</Text>
            </View>
            <View style={measurementStyles.measureActionRow}>
              <Text style={measurementStyles.linkText}>Nhập dữ liệu</Text>
              <ChevronRight size={16} color={COLORS.green} />
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

function MeasurementRow({
  bordered,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  bordered?: boolean;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <View
      style={[
        measurementStyles.measureTableRow,
        bordered && measurementStyles.measureTableBorderTop,
      ]}
    >
      <View style={measurementStyles.measureTableCell}>
        <Text style={measurementStyles.measureCellLabel}>{leftLabel}</Text>
        <Text style={measurementStyles.measureCellValue} numberOfLines={1}>
          {leftValue}
        </Text>
      </View>
      <View
        style={[
          measurementStyles.measureTableCell,
          measurementStyles.measureTableBorderLeft,
        ]}
      >
        <Text style={measurementStyles.measureCellLabel}>{rightLabel}</Text>
        <Text style={measurementStyles.measureCellValue} numberOfLines={1}>
          {rightValue}
        </Text>
      </View>
    </View>
  );
}

const measurementStyles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionTopPadding: {
    paddingTop: 8,
  },
  measureButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measureStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  measureIcon: {
    color: COLORS.border,
    fontSize: 16,
    lineHeight: 20,
  },
  measureText: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  measureActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 20,
  },
  measureEnteredContainer: {
    width: "100%",
    gap: 12,
  },
  measureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  measureTable: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  measureTableRow: {
    flexDirection: "row",
    height: 48,
  },
  measureTableCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  measureTableBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  measureTableBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  measureCellLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  measureCellValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
});
