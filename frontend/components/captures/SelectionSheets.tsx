import {
  CAPTURE_WEATHER_OPTIONS,
  CaptureCropOptions,
  CapturePlotOptions,
  CaptureStageOptions,
} from "@/components/shared/CaptureFormParts";
import { COLORS } from "@/constants/theme";
import {
  CropTypeInfo,
  GrowthStageId,
  LocalWeatherMeasurement,
  LocationData,
  PlotInfo,
  WeatherCondition,
} from "@/types";
import { SheetKind } from "@/utils/captureDisplay";
import { getWeatherLabel } from "@/utils/weatherMetrics";
import { router } from "expo-router";
import { Check, ChevronDown, Cloud, Sprout, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "../shared/BottomSheet";
import { InputText } from "../shared/InputText";
import { PrimaryButton } from "../shared/PrimaryButton";
import {
  CaptureErrorDialog,
  CaptureSuccessDialog,
} from "./CaptureResultDialogs";
import { StationDetail } from "./StationDetail";
import { TemperatureSlider } from "./TemperatureSlider";

type SelectionSheetsProps = {
  sheet: SheetKind | null;
  setSheet: (sheet: SheetKind | null) => void;
  plots: PlotInfo[];
  crops: CropTypeInfo[];
  plotId?: string;
  cropType: string;
  growthStage?: GrowthStageId;
  stationWeather: WeatherCondition;
  stationUpdatedAt?: string;
  stationLatitude?: number;
  stationLongitude?: number;
  captureLocation?: LocationData;
  onPlot: (value?: string) => void;
  onCrop: (value: string) => void;
  onStage: (value: GrowthStageId) => void;
  localMeasurements?: LocalWeatherMeasurement;
  onMeasurements: (value: LocalWeatherMeasurement) => void;
  error: string;
};

export function SelectionSheets(props: SelectionSheetsProps) {
  const close = () => {
    props.setSheet(null);
    setShowWeatherDropdown(false);
  };
  const [measurement, setMeasurement] = useState<LocalWeatherMeasurement>(
    () => {
      if (props.localMeasurements) return props.localMeasurements;
      return {
        temperature: undefined,
        humidity: undefined,
        lightUvIndex: undefined,
        windSpeed: undefined,
        co2Level: undefined,
        weatherCode: 0,
      };
    },
  );
  const [localStrings, setLocalStrings] = useState(() => {
    const initial = props.localMeasurements;
    return {
      humidity: initial?.humidity !== undefined ? String(initial.humidity) : "",
      light:
        initial?.lightUvIndex !== undefined ? String(initial.lightUvIndex) : "",
      wind: initial?.windSpeed !== undefined ? String(initial.windSpeed) : "",
      co2: initial?.co2Level !== undefined ? String(initial.co2Level) : "",
    };
  });
  const [weatherType, setWeatherType] = useState(() =>
    getWeatherLabel(
      (props.localMeasurements || { weatherCode: 0 }).weatherCode,
    ),
  );
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  const [soilMeasurements, setSoilMeasurements] = useState(() => {
    const initial = props.localMeasurements;
    return {
      ph: initial?.soilPh || "",
      ec: initial?.soilEc || "",
      dissolvedOxygen: initial?.soilDo || "",
      soilHumidity: initial?.soilHumidity || "",
    };
  });

  useEffect(() => {
    if (props.sheet === "measurement") {
      const initialWeather = props.localMeasurements || {
        temperature: undefined,
        humidity: undefined,
        lightUvIndex: undefined,
        windSpeed: undefined,
        co2Level: undefined,
        weatherCode: 0,
      };
      setMeasurement(initialWeather);
      setWeatherType(getWeatherLabel(initialWeather.weatherCode));
      setShowWeatherDropdown(false);
      setLocalStrings({
        humidity:
          initialWeather.humidity !== undefined
            ? String(initialWeather.humidity)
            : "",
        light:
          initialWeather.lightUvIndex !== undefined
            ? String(initialWeather.lightUvIndex)
            : "",
        wind:
          initialWeather.windSpeed !== undefined
            ? String(initialWeather.windSpeed)
            : "",
        co2:
          initialWeather.co2Level !== undefined
            ? String(initialWeather.co2Level)
            : "",
      });
      setSoilMeasurements({
        ph: initialWeather.soilPh || "",
        ec: initialWeather.soilEc || "",
        dissolvedOxygen: initialWeather.soilDo || "",
        soilHumidity: initialWeather.soilHumidity || "",
      });
    }
  }, [props.sheet, props.localMeasurements]);

  return (
    <>
      <BottomSheet
        visible={props.sheet === "plot"}
        title="Chọn mã số luống"
        onClose={close}
      >
        <CapturePlotOptions
          plotId={props.plotId}
          plots={props.plots}
          onSelect={props.onPlot}
          onClear={() => {
            props.onPlot(undefined);
            close();
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "crop"}
        title="Chọn loại cây"
        onClose={close}
      >
        <CaptureCropOptions
          cropType={props.cropType}
          crops={props.crops}
          onSelect={props.onCrop}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "stage"}
        title="Chọn giai đoạn sinh trưởng"
        onClose={close}
      >
        <CaptureStageOptions
          growthStage={props.growthStage}
          onSelect={props.onStage}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "station"}
        title="Chi tiết dữ liệu trạm"
        onClose={close}
      >
        <StationDetail
          data={props.stationWeather}
          captureLocation={props.captureLocation}
          latitude={props.stationLatitude}
          longitude={props.stationLongitude}
          updatedAt={props.stationUpdatedAt}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "measurement"}
        title="Số đo tại nơi"
        onClose={close}
        full
      >
        <View style={selectionSheetStyles.measurementSheetContent}>
          <Text style={selectionSheetStyles.measurementSheetSubtitle}>
            Nhập dữ liệu môi trường hiện tại
          </Text>
          <ScrollView
            style={selectionSheetStyles.measurementFieldsScroll}
            contentContainerStyle={selectionSheetStyles.measurementFormContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={selectionSheetStyles.measurementSection}>
              <View style={selectionSheetStyles.measurementSectionTitleRow}>
                <Cloud size={16} color={COLORS.green} />
                <Text style={selectionSheetStyles.measurementSectionTitle}>
                  Không khí & môi trường
                </Text>
              </View>
              <View
                style={[
                  selectionSheetStyles.measurementInputStack,
                  selectionSheetStyles.measurementInputStackFull,
                ]}
              >
                <Text style={selectionSheetStyles.measurementInputLabel}>
                  Loại thời tiết *
                </Text>
                <Pressable
                  style={selectionSheetStyles.measurementSelect}
                  onPress={() => setShowWeatherDropdown((current) => !current)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {(() => {
                      const SelectedOption = CAPTURE_WEATHER_OPTIONS.find(
                        (opt) => opt.label === weatherType,
                      );
                      const SelectedIcon = SelectedOption
                        ? SelectedOption.Icon
                        : Sun;
                      return <SelectedIcon size={20} color={COLORS.green} />;
                    })()}
                    <Text style={selectionSheetStyles.measurementSelectText}>
                      {weatherType}
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color={COLORS.body}
                    style={{
                      transform: [
                        { rotate: showWeatherDropdown ? "180deg" : "0deg" },
                      ],
                    }}
                  />
                </Pressable>

                {showWeatherDropdown ? (
                  <ScrollView
                    style={selectionSheetStyles.weatherDropdown}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {CAPTURE_WEATHER_OPTIONS.map((option) => {
                      const isSelected = weatherType === option.label;
                      const OptionIcon = option.Icon;
                      return (
                        <Pressable
                          key={option.code}
                          style={[
                            selectionSheetStyles.weatherDropdownItem,
                            isSelected &&
                              selectionSheetStyles.weatherDropdownItemSelected,
                          ]}
                          onPress={() => {
                            setWeatherType(option.label);
                            setMeasurement((current) => ({
                              ...current,
                              weatherCode: option.code,
                            }));
                            setShowWeatherDropdown(false);
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <OptionIcon
                              size={18}
                              color={isSelected ? COLORS.green : COLORS.body}
                            />
                            <Text
                              style={[
                                selectionSheetStyles.weatherDropdownItemText,
                                isSelected &&
                                  selectionSheetStyles.weatherDropdownItemTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </View>
                          {isSelected ? (
                            <Check size={16} color={COLORS.green} />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
              <TemperatureSlider
                value={measurement.temperature ?? 0}
                onChange={(value) =>
                  setMeasurement((current) => ({
                    ...current,
                    temperature: value,
                  }))
                }
              />
              <View style={selectionSheetStyles.measurementGrid}>
                <MeasurementInput
                  label="Độ ẩm không khí (%)"
                  value={localStrings.humidity}
                  placeholder="60"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      humidity: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="Ánh sáng (lux)"
                  value={localStrings.light}
                  placeholder="15000"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      light: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="Tốc độ gió (m/s)"
                  value={localStrings.wind}
                  placeholder="2.5"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      wind: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="CO2 (ppm)"
                  value={localStrings.co2}
                  placeholder="400"
                  onChangeText={(value) =>
                    setLocalStrings((current) => ({
                      ...current,
                      co2: value,
                    }))
                  }
                />
              </View>
            </View>
            <View style={selectionSheetStyles.measurementDivider} />
            <View style={selectionSheetStyles.measurementSection}>
              <View style={selectionSheetStyles.measurementSectionTitleRow}>
                <Sprout size={16} color={COLORS.green} />
                <Text style={selectionSheetStyles.measurementSectionTitle}>
                  Chỉ số đất
                </Text>
              </View>
              <View style={selectionSheetStyles.measurementGrid}>
                <MeasurementInput
                  label="pH"
                  value={soilMeasurements.ph}
                  placeholder="6.5"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      ph: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="EC (mS/cm)"
                  value={soilMeasurements.ec}
                  placeholder="1.2"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      ec: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="DO (mg/L)"
                  value={soilMeasurements.dissolvedOxygen}
                  placeholder="6.8"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      dissolvedOxygen: value,
                    }))
                  }
                />
                <MeasurementInput
                  label="Độ ẩm đất (%)"
                  value={soilMeasurements.soilHumidity}
                  placeholder="45"
                  onChangeText={(value) =>
                    setSoilMeasurements((current) => ({
                      ...current,
                      soilHumidity: value,
                    }))
                  }
                />
              </View>
            </View>
          </ScrollView>
          <View style={selectionSheetStyles.measurementActionArea}>
            <Pressable
              style={selectionSheetStyles.measurementCancelButton}
              onPress={close}
            >
              <Text style={selectionSheetStyles.measurementCancelText}>
                Hủy
              </Text>
            </Pressable>
            <View style={selectionSheetStyles.measurementSaveButtonWrap}>
              <PrimaryButton
                label="Lưu"
                onPress={() => {
                  const parseNum = (val: string): number | undefined => {
                    if (!val || !val.trim()) return undefined;
                    const clean = val.replace(/,/g, ".");
                    const parsed = parseFloat(clean);
                    return Number.isNaN(parsed) ? undefined : parsed;
                  };
                  const savedData: LocalWeatherMeasurement = {
                    temperature: measurement.temperature,
                    weatherCode: measurement.weatherCode,
                    humidity: parseNum(localStrings.humidity),
                    lightUvIndex: parseNum(localStrings.light),
                    windSpeed: parseNum(localStrings.wind),
                    co2Level: parseNum(localStrings.co2),
                    soilPh: soilMeasurements.ph || undefined,
                    soilEc: soilMeasurements.ec || undefined,
                    soilDo: soilMeasurements.dissolvedOxygen || undefined,
                    soilHumidity: soilMeasurements.soilHumidity || undefined,
                  };
                  props.onMeasurements(savedData);
                  close();
                }}
              />
            </View>
          </View>
        </View>
      </BottomSheet>
      <CaptureSuccessDialog
        visible={props.sheet === "success"}
        onCaptureNext={close}
        onViewPosts={() => router.replace("/(tabs)/posts")}
      />
      <CaptureErrorDialog
        visible={props.sheet === "error"}
        message={props.error || "Vui lòng kiểm tra kết nối và thử lại."}
        onRetry={close}
      />
    </>
  );
}

function MeasurementInput({
  label,
  value,
  placeholder,
  onChangeText,
  full,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  full?: boolean;
}) {
  return (
    <InputText
      containerStyle={[
        selectionSheetStyles.measurementInputStack,
        full && selectionSheetStyles.measurementInputStackFull,
      ]}
      keyboardType="numeric"
      label={label}
      labelStyle={selectionSheetStyles.measurementInputLabel}
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      onChangeText={onChangeText}
      style={selectionSheetStyles.measurementInput}
      variant="plain"
    />
  );
}

const selectionSheetStyles = StyleSheet.create({
  measurementSheetContent: {
    flex: 1,
  },
  measurementSheetSubtitle: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 20,
  },
  measurementFieldsScroll: {
    flex: 1,
  },
  measurementFormContent: {
    gap: 24,
    paddingBottom: 32,
  },
  measurementSection: {
    gap: 16,
  },
  measurementSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  measurementSectionTitle: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  measurementInputStack: {
    width: "48%",
    gap: 7,
  },
  measurementInputStackFull: {
    width: "100%",
  },
  measurementInputLabel: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  measurementInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    color: COLORS.muted,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  measurementSelect: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measurementSelectText: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 24,
  },
  weatherDropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    maxHeight: 150,
    overflow: "hidden",
  },
  weatherDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  weatherDropdownItemSelected: {
    backgroundColor: "#f0fdf4",
  },
  weatherDropdownItemText: {
    fontSize: 16,
    color: COLORS.body,
  },
  weatherDropdownItemTextSelected: {
    color: COLORS.green,
    fontWeight: "500",
  },
  measurementDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  measurementActionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    gap: 22,
    backgroundColor: "#fff",
  },
  measurementCancelButton: {
    width: 115,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  measurementCancelText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 24,
  },
  measurementSaveButtonWrap: {
    flex: 1,
  },
});
