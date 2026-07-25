import { EnvMode, GrowthStageId, SymptomSeverity } from "@/types";
import React from "react";
import { Text, View } from "react-native";

const stageLabels: Record<GrowthStageId, string> = {
  newly_planted: "Mới trồng",
  vegetative: "Sinh trưởng",
  flowering: "Ra hoa",
  fruiting: "Kết trái",
  harvest: "Thu hoạch",
};

export function formatOverlayText(props: {
  cropType: string;
  plotId?: string;
  growthStage: GrowthStageId;
  envMode: EnvMode;
  symptomDescription: string;
  severity: SymptomSeverity;
}) {
  const line1 = props.plotId?.trim()
    ? `Luống ${props.plotId.trim()} · ${props.cropType}`
    : props.cropType;
  return {
    line1,
    line2: `${stageLabels[props.growthStage]} · ${props.envMode === "greenhouse" ? "Nhà kính" : "Ngoài trời"}`,
    line3: `${props.symptomDescription} · Mức độ ${props.severity.toLowerCase()}`,
  };
}

export function PhotoOverlayLabel(props: Parameters<typeof formatOverlayText>[0]) {
  const lines = formatOverlayText(props);
  return (
    <View>
      <Text>{lines.line1}</Text>
      <Text>{lines.line2}</Text>
      <Text>{lines.line3}</Text>
    </View>
  );
}
