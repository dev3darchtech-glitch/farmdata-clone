import { GROWTH_STAGES } from "@/constants/growthStages";
import { GardenPalette } from "@/constants/theme";
import { GrowthStageId } from "@/types";
import { AlertTriangle } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function GrowthStagePicker({ selectedStage, onSelectStage, error }: { selectedStage?: GrowthStageId | null; onSelectStage?: (stage: GrowthStageId) => void; error?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View testID="growth-stage-picker">
      <Pressable 
        accessibilityLabel="Chọn giai đoạn sinh trưởng" 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text>{selectedStage ? GROWTH_STAGES.find(s => s.id === selectedStage)?.nameVi : "Chọn giai đoạn sinh trưởng"}</Text>
      </Pressable>
      
      {isOpen && (
        <View>
          {GROWTH_STAGES.map((stage) => (
            <Pressable 
              key={stage.id} 
              testID={`growth-stage-option-${stage.id}`}
              onPress={() => {
                onSelectStage?.(stage.id);
                setIsOpen(false);
              }}
            >
              <Text>{stage.nameVi}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {error ? (
        <View testID="growth-stage-picker-error">
          <AlertTriangle color={GardenPalette.error} size={16} />
          <Text>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
