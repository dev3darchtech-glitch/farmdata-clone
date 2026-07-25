import { classifySymptomSeverity } from "@/services/symptomService";
import { SymptomData } from "@/types";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const PRESETS = [5, 15, 35, 75] as const;

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function SymptomEvaluator({
  value,
  onChange,
  description,
  onChangeDescription,
  percentageArea,
  onChangePercentageArea,
  errors,
}: {
  value?: Partial<SymptomData>;
  onChange?: (value: Partial<SymptomData>) => void;
  description?: string;
  onChangeDescription?: (value: string) => void;
  percentageArea?: number;
  onChangePercentageArea?: (value: number) => void;
  errors?: Record<string, string>;
}) {
  const text = description ?? value?.description ?? "";
  const percentage = clampPercentage(
    percentageArea ?? value?.percentageArea ?? 0,
  );
  const severity = classifySymptomSeverity(percentage);

  const updateDescription = (next: string) => {
    onChange?.({ ...value, description: next, percentageArea: percentage });
    onChangeDescription?.(next);
  };

  const updatePercentage = (next: number) => {
    const normalized = clampPercentage(next);
    onChange?.({
      ...value,
      description: text,
      percentageArea: normalized,
      severity: classifySymptomSeverity(normalized),
    });
    onChangePercentageArea?.(normalized);
  };

  return (
    <View testID="symptom-evaluator">
      <Text>Triệu chứng</Text>

      <TextInput
        testID="symptom-description-input"
        value={text}
        multiline
        maxLength={300}
        onChangeText={updateDescription}
        placeholder="Nhập triệu chứng quan sát được..."
      />
      {errors?.description ? (
        <Text testID="symptom-description-error">{errors.description}</Text>
      ) : null}

      <View testID="symptom-severity-badge">
        <Text>Mức độ: {severity}</Text>
      </View>
      <Text>{percentage}% diện tích bị ảnh hưởng</Text>

      <View>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset}
            testID={`symptom-preset-${preset}`}
            onPress={() => updatePercentage(preset)}
          >
            <Text>{preset}%</Text>
          </Pressable>
        ))}
      </View>

      <View>
        <Pressable
          testID="symptom-step-minus"
          onPress={() => updatePercentage(percentage - 5)}
        >
          <Text>-5%</Text>
        </Pressable>
        <Pressable
          testID="symptom-step-minus-one"
          onPress={() => updatePercentage(percentage - 1)}
        >
          <Text>-1%</Text>
        </Pressable>
        <Pressable
          testID="symptom-step-plus-one"
          onPress={() => updatePercentage(percentage + 1)}
        >
          <Text>+1%</Text>
        </Pressable>
        <Pressable
          testID="symptom-step-plus"
          onPress={() => updatePercentage(percentage + 5)}
        >
          <Text>+5%</Text>
        </Pressable>
      </View>

      {errors?.percentageArea ? (
        <Text testID="symptom-percentage-error">
          {errors.percentageArea}
        </Text>
      ) : null}
    </View>
  );
}
