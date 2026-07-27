import { LAYOUT } from "@/constants/theme";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const SORT_OPTIONS = [
  { id: "newest", label: "Mới nhất" },
  { id: "oldest", label: "Cũ nhất" },
  { id: "plotAsc", label: "Mã luồng (A - Z)" },
  { id: "plotDesc", label: "Mã luồng (Z - A)" },
  { id: "cropAsc", label: "Loại cây (A - Z)" },
  { id: "cropDesc", label: "Loại cây (Z - A)" },
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
      <View testID="post-sort-modal" style={styles.scrim}>
        <Pressable style={styles.scrimFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.title}>Sắp xếp theo</Text>

          <View style={styles.optionList}>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedSort === option.id }}
                onPress={() => {
                  onSelectSort?.(option.id);
                  onClose?.();
                }}
                style={styles.optionRow}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                <View
                  style={[
                    styles.radio,
                    selectedSort === option.id && styles.radioActive,
                  ]}
                >
                  {selectedSort === option.id ? (
                    <View style={styles.radioDot} />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  scrimFill: { flex: 1 },
  sheet: {
    width: "100%",
    alignSelf: "stretch",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    paddingHorizontal: LAYOUT.modalX,
    paddingBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handleWrap: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#d1d5db",
  },
  title: {
    color: "#1f2937",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  optionList: { width: "100%" },
  optionRow: {
    height: 42,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 17,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#848484",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  radioActive: {
    borderColor: "#31582b",
    backgroundColor: "#31582b",
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  cancelButton: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#31582b",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
});
