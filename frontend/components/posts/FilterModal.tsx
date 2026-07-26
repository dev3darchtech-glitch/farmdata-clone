import { Calendar, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LAYOUT, TYPOGRAPHY } from "@/constants/theme";

const ENV_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "outdoor", label: "Ngoài trời" },
  { id: "greenhouse", label: "Nhà kính" },
];

const SEVERITY_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "Chớm bệnh", label: "Chớm" },
  { id: "Nhẹ", label: "Nhẹ" },
  { id: "Vừa", label: "Vừa" },
  { id: "Nặng", label: "Nặng" },
  { id: "Rất nặng", label: "Rất nặng" },
];

export function FilterModal({
  visible,
  onClose,
  selectedPlot = "all",
  selectedCrop = "all",
  selectedEnv = "all",
  selectedSeverity = "all",
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
  selectedSeverity?: string;
  onApply?: (filters: {
    plot: string;
    crop: string;
    env: string;
    severity: string;
  }) => void;
  onReset?: () => void;
}) {
  const [localPlot, setLocalPlot] = useState(selectedPlot);
  const [localCrop, setLocalCrop] = useState(selectedCrop);
  const [localEnv, setLocalEnv] = useState(selectedEnv);
  const [localSeverity, setLocalSeverity] = useState(selectedSeverity);

  useEffect(() => {
    if (!visible) return;
    setLocalPlot(selectedPlot);
    setLocalCrop(selectedCrop);
    setLocalEnv(selectedEnv);
    setLocalSeverity(selectedSeverity);
  }, [selectedCrop, selectedEnv, selectedPlot, selectedSeverity, visible]);

  const handleApply = () => {
    onApply?.({
      plot: localPlot,
      crop: localCrop,
      env: localEnv,
      severity: localSeverity,
    });
    onClose?.();
  };

  const handleReset = () => {
    setLocalPlot("all");
    setLocalCrop("all");
    setLocalEnv("all");
    setLocalSeverity("all");
    onReset?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View testID="post-filter-modal" style={styles.scrim}>
        <Pressable style={styles.scrimFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Bộ lọc</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color="#848484" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <FilterSection title="Môi trường">
              <View style={styles.row}>
                {ENV_OPTIONS.map((env) => (
                  <FilterChip
                    key={env.id}
                    label={env.label}
                    selected={localEnv === env.id}
                    onPress={() => setLocalEnv(env.id)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Mức độ triệu chứng">
              <View style={styles.grid}>
                {SEVERITY_OPTIONS.map((severity) => (
                  <FilterChip
                    key={severity.id}
                    label={severity.label}
                    selected={localSeverity === severity.id}
                    onPress={() => setLocalSeverity(severity.id)}
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Khoảng thời gian">
              <Pressable accessibilityRole="button" style={styles.dateInput}>
                <Calendar size={20} color="#b3b3b3" />
                <Text style={styles.dateText}>Chọn khoảng thời gian</Text>
              </Pressable>
            </FilterSection>
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Áp dụng</Text>
            </Pressable>
            <Pressable style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Xóa bộ lọc</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
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
    minHeight: 629,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: -12 },
    elevation: 16,
  },
  header: {
    height: 73,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: LAYOUT.modalX,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#111827",
    fontSize: TYPOGRAPHY.title,
    lineHeight: TYPOGRAPHY.titleLine,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: LAYOUT.modalY,
    gap: LAYOUT.screenGap,
  },
  section: { gap: LAYOUT.sectionGap },
  sectionTitle: {
    color: "#111827",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
    fontWeight: "500",
  },
  row: { flexDirection: "row", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, rowGap: 15 },
  chip: {
    width: 101,
    height: 41,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: "#31582b",
    backgroundColor: "#31582b",
  },
  chipText: {
    color: "#565656",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  chipTextActive: { color: "#fff" },
  dateInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
  },
  dateText: {
    color: "#b3b3b3",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
  footer: {
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: LAYOUT.sectionGap,
    paddingBottom: LAYOUT.modalY,
    gap: 12,
  },
  applyButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dcfce7",
    shadowOpacity: 1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  applyText: {
    color: "#fff",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
    fontWeight: "500",
  },
  resetButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    color: "#31582b",
    fontSize: TYPOGRAPHY.body,
    lineHeight: TYPOGRAPHY.bodyLine,
  },
});
