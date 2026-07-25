import { SymptomData } from "@/types";
import React from "react";
import { Text, TextInput, View } from "react-native";

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
  return (
    <View testID="symptom-evaluator">
      <Text>Triệu chứng</Text>
      <TextInput value={text} onChangeText={(next) => { onChange?.({ ...value, description: next }); onChangeDescription?.(next); }} />
      {errors?.description ? <Text>{errors.description}</Text> : null}
    </View>
  );
}
