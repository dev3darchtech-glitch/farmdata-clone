import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const ENV_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "outdoor", label: "Ngoài trời" },
  { id: "greenhouse", label: "Nhà kính" },
];

export function FilterModal({
  visible,
  onClose,
  plots = [],
  crops = [],
  selectedPlot = "all",
  selectedCrop = "all",
  selectedEnv = "all",
  onApply,
  onReset,
}: {
  visible: boolean;
  onClose: () => void;
  plots?: string[];
  crops?: string[];
  selectedPlot?: string;
  selectedCrop?: string;
  selectedEnv?: string;
  onApply?: (filters: { plot: string; crop: string; env: string }) => void;
  onReset?: () => void;
}) {
  const [localPlot, setLocalPlot] = useState(selectedPlot);
  const [localCrop, setLocalCrop] = useState(selectedCrop);
  const [localEnv, setLocalEnv] = useState(selectedEnv);

  const handleApply = () => {
    onApply?.({ plot: localPlot, crop: localCrop, env: localEnv });
    onClose?.();
  };

  const handleReset = () => {
    setLocalPlot("all");
    setLocalCrop("all");
    setLocalEnv("all");
    onReset?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View testID="post-filter-modal" style={{ flex: 1 }}>
        <View style={{ backgroundColor: "#fff", padding: 16, margin: 20, borderRadius: 12 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>Bộ lọc</Text>

          {/* Plot chips */}
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Mã luống</Text>
          <Pressable onPress={() => setLocalPlot("all")}>
            <Text>Tất cả</Text>
          </Pressable>
          {plots.map((plot) => (
            <Pressable key={plot} onPress={() => setLocalPlot(plot)}>
              <Text>{plot}</Text>
            </Pressable>
          ))}

          {/* Crop chips */}
          <Text style={{ fontWeight: "600", marginBottom: 6, marginTop: 12 }}>Loại cây</Text>
          <Pressable onPress={() => setLocalCrop("all")}>
            <Text>Tất cả</Text>
          </Pressable>
          {crops.map((crop) => (
            <Pressable key={crop} onPress={() => setLocalCrop(crop)}>
              <Text>{crop}</Text>
            </Pressable>
          ))}

          {/* Env chips */}
          <Text style={{ fontWeight: "600", marginBottom: 6, marginTop: 12 }}>Môi trường</Text>
          {ENV_OPTIONS.map((env) => (
            <Pressable key={env.id} onPress={() => setLocalEnv(env.id)}>
              <Text>{env.label}</Text>
            </Pressable>
          ))}

          {/* Actions */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
            <Pressable onPress={handleReset} style={{ flex: 1 }}>
              <Text>Đặt lại</Text>
            </Pressable>
            <Pressable onPress={handleApply} style={{ flex: 1 }}>
              <Text>Áp dụng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
