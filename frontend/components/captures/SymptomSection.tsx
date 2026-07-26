import { COLORS } from "@/constants/theme";
import { SymptomSeverity } from "@/types";
import { severityLabel } from "@/utils/captureDisplay";
import { CaptureSectionOrder, formatSectionTitle } from "@/utils/sectionTitle";
import { Info } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FieldLabel } from "../shared/FieldLabel";
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
  onSymptomDescriptionChange,
  order,
  severity,
  shouldShowInlineErrors,
  shouldShowSymptomDescription,
  symptomDescription,
  symptomDescriptionError,
}: {
  isEditingSymptom: boolean;
  onEditSymptom: (editing: boolean) => void;
  onSelectSeverity: (severity: SymptomSeverity) => void;
  onSymptomDescriptionChange: (value: string) => void;
  order?: CaptureSectionOrder;
  severity?: SymptomSeverity;
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
    gap: 16,
  },
  sectionTopPadding: {
    paddingTop: 8,
  },
  symptomEditStack: {
    gap: 16,
  },
  severityList: {
    gap: 8,
  },
  severityItem: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  severityActive: {
    backgroundColor: "rgba(185,240,189,0.2)",
    borderColor: COLORS.green,
    borderWidth: 2,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityText: {
    flex: 1,
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  radioMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioMarkActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  radioMarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  symptomSummaryBox: {
    minHeight: 130,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 9,
    backgroundColor: "rgba(224,224,224,0.2)",
  },
  symptomSummaryText: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  symptomSummaryCounter: {
    position: "absolute",
    right: 15,
    bottom: 8,
    color: COLORS.border,
    fontSize: 12,
    lineHeight: 16,
  },
  textAreaWrap: {
    position: "relative",
    paddingBottom: 7,
  },
  textArea: {
    minHeight: 136,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 36,
    color: COLORS.body,
    textAlignVertical: "top",
    fontSize: 16,
  },
  invalidField: {
    borderColor: COLORS.danger,
  },
  charCounter: {
    position: "absolute",
    right: 16,
    bottom: 23,
    color: COLORS.border,
    fontSize: 16,
    lineHeight: 20,
  },
  fieldErrorText: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  severitySummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  severitySummaryLabel: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  severityPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  severityPillText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 20,
  },
  contextHint: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "rgba(224,224,224,0.5)",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
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
