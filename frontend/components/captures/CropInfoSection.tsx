import { COLORS } from "@/constants/theme";
import { GrowthStageId } from "@/types";
import {
  cropIcon,
  getCropBgColor,
  getCropColor,
  stageIcon,
  stageName,
} from "@/utils/captureDisplay";
import { CaptureSectionOrder, formatSectionTitle } from "@/utils/sectionTitle";
import React from "react";
import { StyleSheet, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";
import { InputSelection } from "../shared/InputSelection";

export function CropInfoSection({
  cropType,
  cropTypeError,
  cropTypePlaceholder = "Chọn loại cây",
  growthStage,
  growthStageError,
  growthStagePlaceholder = "Chọn một trong 5 giai đoạn",
  onOpenCrop,
  onOpenPlot,
  onOpenStage,
  plotId,
  plotIdError,
  plotIdLabel = "Mã số luống (không bắt buộc)",
  plotIdRequired = false,
  order,
  title = "Thông tin cây trồng",
}: {
  cropType: string;
  cropTypeError?: string;
  cropTypePlaceholder?: string;
  growthStage?: GrowthStageId;
  growthStageError?: string;
  growthStagePlaceholder?: string;
  onOpenCrop: () => void;
  onOpenPlot: () => void;
  onOpenStage: () => void;
  plotId?: string;
  plotIdError?: string;
  plotIdLabel?: string;
  plotIdRequired?: boolean;
  order?: CaptureSectionOrder;
  title?: string;
}) {
  return (
    <View style={[cropInfoStyles.section, cropInfoStyles.sectionTopPadding]}>
      <FieldLabel required>{formatSectionTitle(title, order)}</FieldLabel>
      <InputSelection
        label={plotIdLabel}
        required={plotIdRequired}
        value={plotId}
        placeholder="Chọn mã số luống"
        error={plotIdError}
        onPress={onOpenPlot}
        testID="plot-id-input"
      />
      <InputSelection
        label="Loại cây"
        required
        value={cropType}
        placeholder={cropTypePlaceholder}
        error={cropTypeError}
        onPress={onOpenCrop}
        testID="crop-type-input"
        icon={
          cropType ? (
            <View
              style={[
                cropInfoStyles.cropIcon,
                { backgroundColor: getCropBgColor(cropType) },
              ]}
            >
              {React.createElement(cropIcon(cropType), {
                size: 14,
                color: getCropColor(cropType),
                strokeWidth: 2,
              })}
            </View>
          ) : undefined
        }
      />
      <InputSelection
        label="Giai đoạn sinh trưởng"
        required
        value={growthStage ? stageName(growthStage) : undefined}
        placeholder={growthStagePlaceholder}
        error={growthStageError}
        onPress={onOpenStage}
        testID="growth-stage-input"
        icon={
          growthStage ? (
            <View style={cropInfoStyles.stageIcon}>
              {React.createElement(stageIcon(growthStage), {
                size: 14,
                color: COLORS.green,
                strokeWidth: 2,
              })}
            </View>
          ) : undefined
        }
      />
    </View>
  );
}

const cropInfoStyles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionTopPadding: {
    paddingTop: 8,
  },
  cropIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stageIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e5",
  },
});
