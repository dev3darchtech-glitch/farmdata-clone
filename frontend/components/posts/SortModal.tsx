import { LAYOUT, TYPOGRAPHY } from "@/constants/theme";
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
          <View style={styles.handle} />
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
    height: 616,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#fff",
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: LAYOUT.modalY,
    gap: LAYOUT.screenGap,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
  },
  title: {
    color: "#1f2937",
    fontSize: TYPOGRAPHY.title,
    lineHeight: TYPOGRAPHY.titleLine,
    fontWeight: "700",
  },
  optionList: { width: "100%" },
  optionRow: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    color: "#374151",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 16,
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
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: LAYOUT.sectionGap,
  },
  cancelButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#31582b",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
});
