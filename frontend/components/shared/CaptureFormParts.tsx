import { GROWTH_STAGES } from "@/constants/growthStages";
import { COLORS, LAYOUT } from "@/constants/theme";
import {
  CropTypeInfo,
  GrowthStageId,
  PlotInfo,
  SymptomSeverity,
} from "@/types";
import {
  cropIcon,
  getCropBgColor,
  getCropColor,
  plotSheetMeta,
  stageIcon,
  stageSheetDescription,
  stageSheetName,
} from "@/utils/captureDisplay";
import {
  Check,
  CircleCheck,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { InputText } from "./InputText";

export function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export const CAPTURE_WEATHER_OPTIONS = [
  { code: 0, label: "Nắng", Icon: Sun },
  { code: 1, label: "Ít mây", Icon: CloudSun },
  { code: 2, label: "Có mây", Icon: CloudSun },
  { code: 3, label: "Nhiều mây", Icon: Cloud },
  { code: 45, label: "Sương mù", Icon: CloudFog },
  { code: 51, label: "Mưa nhẹ", Icon: CloudRain },
  { code: 63, label: "Mưa vừa / to", Icon: CloudRain },
  { code: 80, label: "Mưa rào", Icon: CloudRain },
  { code: 71, label: "Mưa tuyết", Icon: CloudSnow },
];

export const CAPTURE_SEVERITY_OPTIONS: {
  color: string;
  description: string;
  label: string;
  value: SymptomSeverity;
}[] = [
  {
    value: "Chớm bệnh",
    label: "Chớm (1 - 10%)",
    description: "Dấu hiệu rất nhẹ, ảnh hưởng tối đa 10% diện tích lá.",
    color: "#facc15",
  },
  {
    value: "Nhẹ",
    label: "Nhẹ (>10 - 25%)",
    description: "Triệu chứng nhẹ, ảnh hưởng trên 10% đến 25% diện tích lá.",
    color: "#fb923c",
  },
  {
    value: "Vừa",
    label: "Vừa (>25 - 50%)",
    description:
      "Triệu chứng trung bình, ảnh hưởng trên 25% đến 50% diện tích lá.",
    color: "#ea580c",
  },
  {
    value: "Nặng",
    label: "Nặng (>50 - 75%)",
    description: "Triệu chứng nặng, ảnh hưởng trên 50% đến 75% diện tích lá.",
    color: "#ef4444",
  },
  {
    value: "Rất nặng",
    label: "Rất nặng (>75%)",
    description: "Triệu chứng rất nặng, ảnh hưởng hơn 75% diện tích lá.",
    color: "#991b1b",
  },
];

export function getCaptureWeatherLabel(code?: number): string {
  if (code === undefined || code === null) return "--";
  if (code === 0) return "Nắng";
  if (code === 1) return "Ít mây";
  if (code === 2) return "Có mây";
  if (code === 3) return "Nhiều mây";
  if (code === 45 || code === 48) return "Sương mù";
  if (code === 51) return "Mưa phùn nhẹ";
  if (code === 53) return "Mưa phùn vừa";
  if (code === 55) return "Mưa phùn dày";
  if (code === 56) return "Mưa phùn đóng băng nhẹ";
  if (code === 57) return "Mưa phùn đóng băng dày";
  if (code === 61) return "Mưa nhẹ";
  if (code === 63) return "Mưa vừa";
  if (code === 65) return "Mưa to";
  if (code === 66) return "Mưa đóng băng nhẹ";
  if (code === 67) return "Mưa đóng băng to";
  if (code === 71) return "Tuyết nhẹ";
  if (code === 73) return "Tuyết vừa";
  if (code === 75) return "Tuyết dày";
  if (code === 77) return "Hạt tuyết";
  if (code === 80) return "Mưa rào nhẹ";
  if (code === 81) return "Mưa rào vừa";
  if (code === 82) return "Mưa rào to";
  if (code === 85) return "Mưa tuyết nhẹ";
  if (code === 86) return "Mưa tuyết to";
  if (code === 95) return "Dông nhẹ / vừa";
  if (code === 96) return "Dông có mưa đá nhẹ";
  if (code === 99) return "Dông có mưa đá to";
  return "--";
}

export function CapturePlotOptions({
  contentPaddingBottom,
  onSelect,
  onClear,
  plotId,
  plots,
}: {
  contentPaddingBottom?: number;
  onSelect: (value: string) => void;
  onClear?: () => void;
  plotId?: string;
  plots: PlotInfo[];
}) {
  const [search, setSearch] = useState("");
  const filteredPlots = useMemo(() => {
    const cleanSearch = removeDiacritics(search.trim().toLowerCase());
    if (!cleanSearch) return plots;
    return plots.filter((plot) => {
      const matchesCode = removeDiacritics(plot.code.toLowerCase()).includes(
        cleanSearch,
      );
      const matchesName = removeDiacritics(plot.name.toLowerCase()).includes(
        cleanSearch,
      );
      const matchesDesc = plot.description
        ? removeDiacritics(plot.description.toLowerCase()).includes(cleanSearch)
        : false;
      return matchesCode || matchesName || matchesDesc;
    });
  }, [plots, search]);

  return (
    <View style={captureFormStyles.cropSheetContent}>
      <View style={captureFormStyles.cropSearchWrap}>
        <InputText
          containerStyle={{ flex: 1 }}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm mã luống"
          style={captureFormStyles.cropSearchInput}
          variant="plain"
        />
        {search ? (
          <Pressable onPress={() => setSearch("")} style={{ padding: 4 }}>
            <X size={18} color="#6b7280" />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        style={captureFormStyles.cropListScroll}
        contentContainerStyle={[
          captureFormStyles.cropListContent,
          { paddingBottom: contentPaddingBottom ?? 8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filteredPlots.length > 0 ? (
          filteredPlots.map((plot) => {
            const selected = plotId === plot.code;
            return (
              <Pressable
                key={plot.id || plot.code}
                testID={`plot-option-${plot.code}`}
                style={[
                  captureFormStyles.plotOption,
                  selected && captureFormStyles.plotOptionSelected,
                ]}
                onPress={() => onSelect(plot.code)}
              >
                <View style={captureFormStyles.plotOptionBody}>
                  <Text
                    style={[
                      captureFormStyles.plotOptionCode,
                      selected && captureFormStyles.plotOptionCodeSelected,
                    ]}
                  >
                    {plot.code}
                  </Text>
                  <Text style={captureFormStyles.plotOptionMeta}>
                    {plotSheetMeta(plot)}
                  </Text>
                </View>
                {selected ? (
                  <View style={captureFormStyles.plotOptionCheck}>
                    <Check size={12} color="#fff" />
                  </View>
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <View style={captureFormStyles.cropSearchEmpty}>
            <Text style={captureFormStyles.cropSearchEmptyText}>
              Không tìm thấy luống nào phù hợp
            </Text>
          </View>
        )}
      </ScrollView>
      {onClear ? (
        <View style={captureFormStyles.cropActionArea}>
          <Pressable
            style={captureFormStyles.sheetOutlineAction}
            testID="plot-clear-selection"
            onPress={onClear}
          >
            <Text style={captureFormStyles.sheetOutlineActionText}>
              Không chọn mã
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function CaptureCropOptions({
  contentPaddingBottom,
  cropType,
  crops,
  onSelect,
}: {
  contentPaddingBottom?: number;
  cropType: string;
  crops: CropTypeInfo[];
  onSelect: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredCrops = useMemo(() => {
    const cleanSearch = removeDiacritics(search.trim().toLowerCase());
    if (!cleanSearch) return crops;
    return crops.filter((crop) =>
      removeDiacritics(crop.name.toLowerCase()).includes(cleanSearch),
    );
  }, [crops, search]);

  return (
    <View style={captureFormStyles.cropSheetContent}>
      <View style={captureFormStyles.cropSearchWrap}>
        <InputText
          containerStyle={{ flex: 1 }}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm loại cây"
          style={captureFormStyles.cropSearchInput}
          variant="plain"
        />
        {search ? (
          <Pressable onPress={() => setSearch("")} style={{ padding: 4 }}>
            <X size={18} color="#6b7280" />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        style={captureFormStyles.cropListScroll}
        contentContainerStyle={[
          captureFormStyles.cropListContent,
          { paddingBottom: contentPaddingBottom ?? 8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filteredCrops.length > 0 ? (
          filteredCrops.map((crop) => {
            const selected = cropType === crop.name;
            const Icon = cropIcon(crop.name);
            const cropColor = getCropColor(crop.name);
            const cropBg = getCropBgColor(crop.name);
            return (
              <Pressable
                key={crop.id || crop.name}
                testID={`crop-option-${crop.id}`}
                style={[
                  captureFormStyles.cropOption,
                  selected && captureFormStyles.cropOptionSelected,
                ]}
                onPress={() => onSelect(crop.name)}
              >
                <View
                  style={[
                    captureFormStyles.cropOptionIcon,
                    { backgroundColor: selected ? cropColor : cropBg },
                  ]}
                >
                  <Icon
                    size={20}
                    color={selected ? "#fff" : cropColor}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  style={[
                    captureFormStyles.cropOptionText,
                    selected && captureFormStyles.cropOptionTextSelected,
                  ]}
                >
                  {crop.name}
                </Text>
                {selected ? (
                  <CircleCheck size={20} color={COLORS.green} />
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <View style={captureFormStyles.cropSearchEmpty}>
            <Text style={captureFormStyles.cropSearchEmptyText}>
              Không tìm thấy loại cây phù hợp
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function CaptureStageOptions({
  contentPaddingBottom,
  growthStage,
  onSelect,
}: {
  contentPaddingBottom?: number;
  growthStage?: GrowthStageId;
  onSelect: (value: GrowthStageId) => void;
}) {
  return (
    <View
      style={[
        captureFormStyles.stageSheetList,
        { paddingBottom: contentPaddingBottom ?? 0 },
      ]}
    >
      {GROWTH_STAGES.map((stage) => {
        const selected = growthStage === stage.id;
        const Icon = stageIcon(stage.id);
        return (
          <Pressable
            key={stage.id}
            testID={`stage-option-${stage.id}`}
            style={[
              captureFormStyles.stageOption,
              selected && captureFormStyles.stageOptionSelected,
            ]}
            onPress={() => onSelect(stage.id)}
          >
            <View
              style={[
                captureFormStyles.stageOptionIcon,
                selected && captureFormStyles.stageOptionIconSelected,
              ]}
            >
              <Icon
                size={20}
                color={selected ? "#fff" : COLORS.green}
                strokeWidth={2}
              />
            </View>
            <View style={captureFormStyles.stageOptionBody}>
              <Text
                style={[
                  captureFormStyles.stageOptionTitle,
                  selected && captureFormStyles.stageOptionTitleSelected,
                ]}
              >
                {stageSheetName(stage.id)}
              </Text>
              <Text style={captureFormStyles.stageOptionMeta}>
                {stageSheetDescription(stage.id, stage.description)}
              </Text>
            </View>
            {selected ? (
              <View style={captureFormStyles.selectionCheck}>
                <Check size={12} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function CaptureWeatherOptions({
  contentPaddingBottom,
  onSelect,
  weatherCode,
}: {
  contentPaddingBottom?: number;
  onSelect: (value: number) => void;
  weatherCode?: number;
}) {
  return (
    <View
      style={[
        captureFormStyles.stageSheetList,
        { paddingBottom: contentPaddingBottom ?? 0 },
      ]}
    >
      {CAPTURE_WEATHER_OPTIONS.map((option) => {
        const selected = weatherCode === option.code;
        const Icon = option.Icon;
        return (
          <Pressable
            key={option.code}
            style={[
              captureFormStyles.stageOption,
              selected && captureFormStyles.stageOptionSelected,
            ]}
            onPress={() => onSelect(option.code)}
          >
            <View
              style={[
                captureFormStyles.stageOptionIcon,
                selected && captureFormStyles.stageOptionIconSelected,
              ]}
            >
              <Icon
                size={20}
                color={selected ? "#fff" : COLORS.green}
                strokeWidth={2}
              />
            </View>
            <View style={captureFormStyles.stageOptionBody}>
              <Text
                style={[
                  captureFormStyles.stageOptionTitle,
                  selected && captureFormStyles.stageOptionTitleSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={captureFormStyles.stageOptionMeta}>
                Mã thời tiết {option.code}
              </Text>
            </View>
            {selected ? (
              <View style={captureFormStyles.selectionCheck}>
                <Check size={12} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function CaptureSeverityOptions({
  contentPaddingBottom,
  onSelect,
  severity,
}: {
  contentPaddingBottom?: number;
  onSelect: (value: SymptomSeverity) => void;
  severity?: SymptomSeverity;
}) {
  return (
    <View
      style={[
        captureFormStyles.severityList,
        { paddingBottom: contentPaddingBottom ?? 0 },
      ]}
    >
      {CAPTURE_SEVERITY_OPTIONS.map((item) => {
        const selected = severity === item.value;
        return (
          <Pressable
            key={item.value}
            style={[
              captureFormStyles.severityItem,
              selected && captureFormStyles.severityActive,
            ]}
            onPress={() => onSelect(item.value)}
          >
            <View
              style={[
                captureFormStyles.severityDot,
                { backgroundColor: item.color },
              ]}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={[
                  captureFormStyles.severityTitle,
                  selected && captureFormStyles.severityTitleSelected,
                ]}
              >
                {item.label}
              </Text>
              <Text style={captureFormStyles.stageOptionMeta}>
                {item.description}
              </Text>
            </View>
            {selected ? (
              <View style={captureFormStyles.selectionCheck}>
                <Check size={12} color="#fff" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const captureFormStyles = StyleSheet.create({
  cropSheetContent: {
    marginHorizontal: -LAYOUT.sheetX,
    flexGrow: 1,
  },
  cropSearchWrap: {
    height: 42,
    marginHorizontal: LAYOUT.sheetContentX,
    marginBottom: LAYOUT.sectionGap,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(224,224,224,0.5)",
  },
  cropSearchInput: {
    flex: 1,
    color: COLORS.body,
    fontSize: 12,
    lineHeight: 16,
    paddingVertical: 0,
  },
  cropListScroll: {
    height: 430,
  },
  cropListContent: {
    paddingHorizontal: LAYOUT.sheetContentX,
    paddingVertical: 6,
    gap: 4,
  },
  cropSearchEmpty: {
    height: 380,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  cropSearchEmptyText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
  },
  plotOption: {
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  plotOptionSelected: {
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  plotOptionBody: {
    flex: 1,
    gap: 2,
  },
  plotOptionCode: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  plotOptionCodeSelected: {
    color: COLORS.green,
  },
  plotOptionMeta: {
    color: COLORS.body,
    fontSize: 11,
    lineHeight: 15,
  },
  plotOptionCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  cropOption: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cropOptionSelected: {
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  cropOptionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.border,
  },
  cropOptionText: {
    flex: 1,
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
  },
  cropOptionTextSelected: {
    color: COLORS.green,
  },
  cropActionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: LAYOUT.sheetContentX,
    paddingTop: LAYOUT.sheetTop,
    paddingBottom: LAYOUT.sheetTop,
  },
  sheetOutlineAction: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOutlineActionText: {
    color: COLORS.green,
    fontSize: 12,
    lineHeight: 16,
  },
  stageSheetList: {
    marginHorizontal: -LAYOUT.sheetX,
    paddingHorizontal: LAYOUT.sheetContentX,
    gap: 4,
  },
  stageOption: {
    minHeight: 42,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stageOptionSelected: {
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  stageOptionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e5",
  },
  stageOptionIconSelected: {
    backgroundColor: COLORS.green,
  },
  stageOptionBody: {
    flex: 1,
  },
  stageOptionTitle: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
  },
  stageOptionTitleSelected: {
    color: COLORS.green,
  },
  stageOptionMeta: {
    color: COLORS.body,
    fontSize: 11,
    lineHeight: 15,
  },
  severityList: {
    gap: 6,
  },
  severityItem: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  severityActive: {
    backgroundColor: "rgba(234,242,157,0.5)",
    borderColor: "transparent",
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityTitle: {
    color: COLORS.body,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  severityTitleSelected: {
    color: COLORS.green,
  },
});
