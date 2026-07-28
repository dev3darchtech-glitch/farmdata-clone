import {
  CAPTURE_WEATHER_OPTIONS,
  CaptureCropOptions,
  CapturePlotOptions,
  CaptureStageOptions,
} from "@/components/shared/CaptureFormParts";
import { COLORS, LAYOUT } from "@/constants/theme";
import {
  CropTypeInfo,
  GrowthStageId,
  LocalWeatherMeasurement,
  LocationData,
  PLANT_DISEASE_GROUPS,
  PlantDiseaseGroup,
  PlantDiseaseInfo,
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
import { KeyboardFormScrollView } from "../shared/KeyboardFormScrollView";
import { PrimaryButton } from "../shared/PrimaryButton";
import {
  CaptureErrorDialog,
  CaptureSuccessDialog,
} from "./CaptureResultDialogs";
import { DiseaseOptionList } from "./DiseaseOptionList";
import { MeasurementInput } from "./MeasurementInput";
import { StationDetail } from "./StationDetail";
import { TemperatureSlider } from "./TemperatureSlider";

type SelectionSheetsProps = {
  sheet: SheetKind | null;
  setSheet: (sheet: SheetKind | null) => void;
  plots: PlotInfo[];
  crops: CropTypeInfo[];
  plantDiseases: PlantDiseaseInfo[];
  plotId?: string;
  cropType: string;
  growthStage?: GrowthStageId;
  diseaseGroup?: PlantDiseaseGroup;
  diseaseType?: string;
  diseaseName?: string;
  stationWeather: WeatherCondition;
  stationT24?: WeatherCondition;
  stationT48?: WeatherCondition;
  stationUpdatedAt?: string;
  stationLatitude?: number;
  stationLongitude?: number;
  captureLocation?: LocationData;
  onPlot: (value?: string) => void;
  onCrop: (value: string) => void;
  onStage: (value: GrowthStageId) => void;
  onDiseaseGroup: (value: PlantDiseaseGroup) => void;
  onDiseaseType: (value: string) => void;
  onDiseaseName: (value: string) => void;
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
  const [isAdjustingTemperature, setIsAdjustingTemperature] = useState(false);
  const [soilMeasurements, setSoilMeasurements] = useState(() => {
    const initial = props.localMeasurements;
    return {
      ph: initial?.soilPh || "",
      ec: initial?.soilEc || "",
      dissolvedOxygen: initial?.soilDo || "",
      soilHumidity: initial?.soilHumidity || "",
    };
  });

  const activePlantDiseases = props.plantDiseases.filter(
    (disease) => disease.isActive !== false,
  );
  const diseaseGroupOptions = Array.from(
    new Set([
      ...PLANT_DISEASE_GROUPS,
      ...activePlantDiseases.map((disease) => disease.group),
    ]),
  );
  const diseaseTypeOptions = Array.from(
    new Set(
      activePlantDiseases
        .filter((disease) => disease.group === props.diseaseGroup)
        .map((disease) => disease.type),
    ),
  );
  const diseaseNameOptions = activePlantDiseases.filter(
    (disease) =>
      disease.group === props.diseaseGroup &&
      disease.type === props.diseaseType,
  );

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
          onSelect={(value) => {
            props.onPlot(value);
            close();
          }}
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
          onSelect={(value) => {
            props.onCrop(value);
            close();
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "stage"}
        title="Chọn giai đoạn sinh trưởng"
        onClose={close}
      >
        <CaptureStageOptions
          growthStage={props.growthStage}
          onSelect={(value) => {
            props.onStage(value);
            close();
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "diseaseGroup"}
        title="Chọn nhóm bệnh cây"
        onClose={close}
      >
        <DiseaseOptionList
          emptyText="Chưa có nhóm bệnh cây"
          options={diseaseGroupOptions.map((group) => ({
            key: group,
            label: group,
            value: group,
          }))}
          selectedValue={props.diseaseGroup}
          onSelect={(value) => {
            props.onDiseaseGroup(value as PlantDiseaseGroup);
            close();
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "diseaseType"}
        title="Chọn loại bệnh cây"
        onClose={close}
      >
        <DiseaseOptionList
          emptyText="Chọn nhóm bệnh cây trước"
          options={diseaseTypeOptions.map((type) => ({
            key: type,
            label: type,
            value: type,
          }))}
          selectedValue={props.diseaseType}
          onSelect={(value) => {
            props.onDiseaseType(value);
            close();
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "diseaseName"}
        title="Chọn tên bệnh cây"
        onClose={close}
      >
        <DiseaseOptionList
          emptyText="Chọn loại bệnh cây trước"
          options={diseaseNameOptions.map((disease) => ({
            key: disease.id || `${disease.type}-${disease.name}`,
            label: disease.name,
            value: disease.name,
            description: disease.type,
          }))}
          selectedValue={props.diseaseName}
          onSelect={(value) => {
            props.onDiseaseName(value);
            close();
          }}
        />
      </BottomSheet>
      <BottomSheet
        visible={props.sheet === "station"}
        title="Chi tiết dữ liệu trạm"
        onClose={close}
        full
      >
        <StationDetail
          data={props.stationWeather}
          t24={props.stationT24}
          t48={props.stationT48}
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
          <KeyboardFormScrollView
            style={selectionSheetStyles.measurementFieldsScroll}
            contentContainerStyle={selectionSheetStyles.measurementFormContent}
            nestedScrollEnabled
            scrollEnabled={!isAdjustingTemperature}
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
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
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
                onSlidingChange={setIsAdjustingTemperature}
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
          </KeyboardFormScrollView>
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
                style={{ height: 36, minHeight: 36, borderRadius: 8 }}
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
        onViewPosts={() => {
          close();
          router.replace("/(tabs)/posts");
        }}
      />
      <CaptureErrorDialog
        visible={props.sheet === "error"}
        message={props.error || "Vui lòng kiểm tra kết nối và thử lại."}
        onRetry={close}
      />
    </>
  );
}

const selectionSheetStyles = StyleSheet.create({
  measurementSheetContent: {
    flex: 1,
  },
  measurementSheetSubtitle: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
    marginBottom: LAYOUT.sectionGap,
  },
  measurementFieldsScroll: {
    flex: 1,
  },
  measurementFormContent: {
    gap: LAYOUT.screenGap,
    paddingBottom: LAYOUT.sheetBottom,
  },
  measurementSection: {
    gap: LAYOUT.sectionGap,
  },
  measurementSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  measurementSectionTitle: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 12,
  },
  measurementInputStack: {
    flexBasis: "47%",
    flexGrow: 1,
    maxWidth: "48%",
    gap: 4,
  },
  measurementInputStackFull: {
    width: "100%",
  },
  measurementInputLabel: {
    color: COLORS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  measurementSelect: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measurementSelectText: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
  },
  weatherDropdown: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    maxHeight: 150,
    overflow: "hidden",
  },
  weatherDropdownItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    fontSize: 13,
    color: COLORS.body,
  },
  weatherDropdownItemTextSelected: {
    color: COLORS.green,
    fontWeight: "600",
  },
  measurementDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  measurementActionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#fff",
  },
  measurementCancelButton: {
    width: 100,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  measurementCancelText: {
    color: COLORS.green,
    fontSize: 12,
    lineHeight: 16,
  },
  measurementSaveButtonWrap: {
    flex: 1,
  },
});
