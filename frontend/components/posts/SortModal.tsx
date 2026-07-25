import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

const SORT_OPTIONS = [
  { id: "newest", label: "Mới nhất" },
  { id: "oldest", label: "Cũ nhất" },
  { id: "severity", label: "Mức độ nặng nhất" },
];

export function SortModal({
  visible,
  onClose,
  selectedSort,
  onSelectSort,
}: {
  visible: boolean;
  onClose?: () => void;
  selectedSort?: string;
  onSelectSort?: (sort: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View testID="post-sort-modal" style={{ flex: 1 }}>
        <View style={{ backgroundColor: "#fff", padding: 16, margin: 20, borderRadius: 12 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>Sắp xếp</Text>

          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => {
                onSelectSort?.(option.id);
                onClose?.();
              }}
              style={{ paddingVertical: 10 }}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
