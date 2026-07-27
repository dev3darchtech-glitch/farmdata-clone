import { COLORS } from "@/constants/theme";
import { PlantDiseaseGroup, SymptomSeverity } from "@/types";
import { severityLabel } from "@/utils/captureDisplay";
import { CaptureSectionOrder, formatSectionTitle } from "@/utils/sectionTitle";
import { Info } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";
import { InputSelection } from "../shared/InputSelection";
import { InputText } from "../shared/InputText";

const SEVERITY_OPTIONS: { value: SymptomSeverity; label: string }[] = [
  { value: "Chớm bệnh", label: "Chớm (1 - 10%)" },
  { value: "Nhẹ", label: "Nhẹ (>10 - 25%)" },
  { value: "Vừa", label: "Vừa (>25 - 50%)" },
  { value: "Nặng", label: "Nặng (>50 - 75%)" },
  { value: "Rất nặng", label: "Rất nặng (>75%)" },
];

const SEVERITY_COLORS = ["#facc15", "#fb923c", "#ea580c", "#ef4444", "#991b1b"];

export function SymptomSection({
  isEditingSymptom,
  onEditSymptom,
  onSelectSeverity,
  onOpenDiseaseGroup,
  onOpenDiseaseType,
  onOpenDiseaseName,
  onSymptomDescriptionChange,
  order,
  severity,
  diseaseGroup,
  diseaseType,
  diseaseName,
  diseaseGroupError,
  diseaseTypeError,
  diseaseNameError,
  shouldShowInlineErrors,
  shouldShowSymptomDescription,
  symptomDescription,
  symptomDescriptionError,
}: {
  isEditingSymptom: boolean;
  onEditSymptom: (editing: boolean) => void;
  onSelectSeverity: (severity: SymptomSeverity) => void;
  onOpenDiseaseGroup: () => void;
  onOpenDiseaseType: () => void;
  onOpenDiseaseName: () => void;
  onSymptomDescriptionChange: (value: string) => void;
  order?: CaptureSectionOrder;
  severity?: SymptomSeverity;
  diseaseGroup?: PlantDiseaseGroup;
  diseaseType?: string;
  diseaseName?: string;
  diseaseGroupError?: string;
  diseaseTypeError?: string;
  diseaseNameError?: string;
  shouldShowInlineErrors: boolean;
  shouldShowSymptomDescription: boolean;
  symptomDescription: string;
  symptomDescriptionError?: string;
}) {
  return (
    <View style={[symptomStyles.section, symptomStyles.sectionTopPadding]}>
      <FieldLabel required>
        {formatSectionTitle("Tình trạng", order)}
      </FieldLabel>
      <View style={symptomStyles.symptomEditStack}>
        <InputSelection
          label="Nhóm bệnh cây"
          required
          value={diseaseGroup}
          placeholder="Chọn nhóm bệnh cây"
          onPress={onOpenDiseaseGroup}
          error={shouldShowInlineErrors ? diseaseGroupError : undefined}
        />
        <InputSelection
          label="Loại bệnh cây"
          required
          value={diseaseType}
          placeholder="Chọn loại bệnh cây"
          onPress={onOpenDiseaseType}
          disabled={!diseaseGroup}
          error={shouldShowInlineErrors ? diseaseTypeError : undefined}
        />
        <InputSelection
          label="Tên bệnh cây"
          required
          value={diseaseName}
          placeholder="Chọn tên bệnh cây"
          onPress={onOpenDiseaseName}
          disabled={!diseaseGroup || !diseaseType}
          error={shouldShowInlineErrors ? diseaseNameError : undefined}
        />
        <FieldLabel required>Mức độ</FieldLabel>
        <View style={symptomStyles.severityList}>
          {SEVERITY_OPTIONS.map((item, index) => (
            <Pressable
              key={item.value}
              style={[
                symptomStyles.severityItem,
                severity === item.value && symptomStyles.severityActive,
              ]}
              onPress={() => onSelectSeverity(item.value)}
            >
              <View
                style={[
                  symptomStyles.severityDot,
                  { backgroundColor: SEVERITY_COLORS[index] },
                ]}
              />
              <Text style={symptomStyles.severityText}>{item.label}</Text>
              <View
                style={[
                  symptomStyles.radioMark,
                  severity === item.value && symptomStyles.radioMarkActive,
                ]}
              >
                {severity === item.value ? (
                  <View style={symptomStyles.radioMarkDot} />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
        {shouldShowSymptomDescription ? (
          <>
            <FieldLabel required>Mô tả triệu chứng</FieldLabel>
            {symptomDescription && !isEditingSymptom ? (
              <Pressable
                style={symptomStyles.symptomSummaryBox}
                onPress={() => onEditSymptom(true)}
              >
                <Text style={symptomStyles.symptomSummaryText}>
                  “{symptomDescription}”
                </Text>
                <Text style={symptomStyles.symptomSummaryCounter}>
                  {symptomDescription.length}/300
                </Text>
              </Pressable>
            ) : (
              <View style={symptomStyles.textAreaWrap}>
                <InputText
                  testID="symptom-description-input"
                  multiline
                  maxLength={300}
                  value={symptomDescription}
                  onChangeText={(value) => {
                    onSymptomDescriptionChange(value);
                    onEditSymptom(true);
                  }}
                  onBlur={() => {
                    if (symptomDescription.trim()) {
                      onEditSymptom(false);
                    }
                  }}
                  placeholder="Nhập triệu chứng quan sát được..."
                  placeholderTextColor={COLORS.border}
                  style={[
                    symptomStyles.textArea,
                    shouldShowInlineErrors &&
                      symptomDescriptionError &&
                      symptomStyles.invalidField,
                  ]}
                  variant="plain"
                />
                <Text style={symptomStyles.charCounter}>
                  {symptomDescription.length}/300
                </Text>
              </View>
            )}
            {shouldShowInlineErrors && symptomDescriptionError ? (
              <Text style={symptomStyles.fieldErrorText}>
                {symptomDescriptionError}
              </Text>
            ) : null}
          </>
        ) : severity ? (
          <View style={symptomStyles.severitySummaryRow}>
            <Text style={symptomStyles.severitySummaryLabel}>Mức độ:</Text>
            <View style={symptomStyles.severityPill}>
              <Text style={symptomStyles.severityPillText}>
                {severityLabel(severity)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
      <View style={symptomStyles.contextHint}>
        <Info size={10} color={COLORS.muted} />
        <Text style={symptomStyles.contextHintText}>
          Các mức tình trạng được tính theo tổng diện tích lá bị ảnh hưởng.
        </Text>
      </View>
    </View>
  );
}

const symptomStyles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTopPadding: {
    paddingTop: 4,
  },
  symptomEditStack: {
    gap: 10,
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
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  severityActive: {
    backgroundColor: "rgba(185,240,189,0.2)",
    borderColor: COLORS.green,
    borderWidth: 1.5,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityText: {
    flex: 1,
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
  },
  radioMark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioMarkActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  radioMarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  symptomSummaryBox: {
    minHeight: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    backgroundColor: "rgba(224,224,224,0.2)",
  },
  symptomSummaryText: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
  },
  symptomSummaryCounter: {
    position: "absolute",
    right: 12,
    bottom: 6,
    color: COLORS.border,
    fontSize: 11,
    lineHeight: 15,
  },
  textAreaWrap: {
    position: "relative",
    paddingBottom: 4,
  },
  textArea: {
    minHeight: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
    color: COLORS.body,
    textAlignVertical: "top",
    fontSize: 13,
    lineHeight: 17,
  },
  invalidField: {
    borderColor: COLORS.danger,
  },
  charCounter: {
    position: "absolute",
    right: 12,
    bottom: 14,
    color: COLORS.border,
    fontSize: 11,
    lineHeight: 15,
  },
  fieldErrorText: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 15,
  },
  severitySummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  severitySummaryLabel: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 17,
  },
  severityPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  severityPillText: {
    color: COLORS.green,
    fontSize: 12,
    lineHeight: 16,
  },
  contextHint: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: "rgba(224,224,224,0.5)",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextHintText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
  },
});
