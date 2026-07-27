import { LAYOUT } from "@/constants/theme";
import { Calendar, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { IOS_KEYBOARD_ACCESSORY_ID } from "../shared/KeyboardAccessory";
import { KeyboardFormScrollView } from "../shared/KeyboardFormScrollView";

export type DateRangePreset = "all" | "today" | "7days" | "30days" | "custom";

export type DateRangeFilter = {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
};

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

const DATE_PRESET_OPTIONS: { id: DateRangePreset; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "today", label: "Hôm nay" },
  { id: "7days", label: "7 ngày qua" },
  { id: "30days", label: "30 ngày qua" },
  { id: "custom", label: "Tùy chọn" },
];

export function FilterModal({
  visible,
  onClose,
  selectedPlot = "all",
  selectedCrop = "all",
  selectedEnv = "all",
  selectedSeverity = "all",
  selectedDateRange = { preset: "all" },
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
  selectedDateRange?: DateRangeFilter;
  onApply?: (filters: {
    plot: string;
    crop: string;
    env: string;
    severity: string;
    dateRange: DateRangeFilter;
  }) => void;
  onReset?: () => void;
}) {
  const [localPlot, setLocalPlot] = useState(selectedPlot);
  const [localCrop, setLocalCrop] = useState(selectedCrop);
  const [localEnv, setLocalEnv] = useState(selectedEnv);
  const [localSeverity, setLocalSeverity] = useState(selectedSeverity);
  const [localDatePreset, setLocalDatePreset] = useState<DateRangePreset>(
    selectedDateRange.preset || "all",
  );
  const [localStartDate, setLocalStartDate] = useState(
    selectedDateRange.startDate || "",
  );
  const [localEndDate, setLocalEndDate] = useState(
    selectedDateRange.endDate || "",
  );

  useEffect(() => {
    if (!visible) return;
    setLocalPlot(selectedPlot);
    setLocalCrop(selectedCrop);
    setLocalEnv(selectedEnv);
    setLocalSeverity(selectedSeverity);
    setLocalDatePreset(selectedDateRange.preset || "all");
    setLocalStartDate(selectedDateRange.startDate || "");
    setLocalEndDate(selectedDateRange.endDate || "");
  }, [
    selectedCrop,
    selectedDateRange,
    selectedEnv,
    selectedPlot,
    selectedSeverity,
    visible,
  ]);

  const handleApply = () => {
    onApply?.({
      plot: localPlot,
      crop: localCrop,
      env: localEnv,
      severity: localSeverity,
      dateRange: {
        preset: localDatePreset,
        startDate: localStartDate,
        endDate: localEndDate,
      },
    });
    onClose?.();
  };

  const handleReset = () => {
    setLocalPlot("all");
    setLocalCrop("all");
    setLocalEnv("all");
    setLocalSeverity("all");
    setLocalDatePreset("all");
    setLocalStartDate("");
    setLocalEndDate("");
    onReset?.();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View testID="post-filter-modal" style={styles.scrim}>
          <Pressable style={styles.scrimFill} onPress={onClose} />
          <View style={{ width: "100%" }}>
            <View style={styles.sheet}>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>
              <View style={styles.header}>
                <Text style={styles.title}>Bộ lọc bài đăng</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X size={18} color="#6b7280" />
                </Pressable>
              </View>

              <KeyboardFormScrollView
                style={{ maxHeight: 380 }}
                contentContainerStyle={styles.content}
              >
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
                  <View style={styles.grid}>
                    {DATE_PRESET_OPTIONS.map((preset) => (
                      <FilterChip
                        key={preset.id}
                        label={preset.label}
                        selected={localDatePreset === preset.id}
                        onPress={() => setLocalDatePreset(preset.id)}
                      />
                    ))}
                  </View>

                  {localDatePreset === "custom" ? (
                    <View style={styles.customDateRow}>
                      <View style={styles.customDateField}>
                        <Text style={styles.customDateLabel}>Từ ngày:</Text>
                        <Pressable style={styles.dateInput}>
                          <Calendar size={16} color="#4b5563" />
                          <TextInput
                            inputAccessoryViewID={
                              Platform.OS === "ios"
                                ? IOS_KEYBOARD_ACCESSORY_ID
                                : undefined
                            }
                            style={styles.dateTextInput}
                            value={localStartDate}
                            onChangeText={setLocalStartDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9ca3af"
                          />
                        </Pressable>
                      </View>
                      <View style={styles.customDateField}>
                        <Text style={styles.customDateLabel}>Đến ngày:</Text>
                        <Pressable style={styles.dateInput}>
                          <Calendar size={16} color="#4b5563" />
                          <TextInput
                            inputAccessoryViewID={
                              Platform.OS === "ios"
                                ? IOS_KEYBOARD_ACCESSORY_ID
                                : undefined
                            }
                            style={styles.dateTextInput}
                            value={localEndDate}
                            onChangeText={setLocalEndDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9ca3af"
                          />
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </FilterSection>
              </KeyboardFormScrollView>

              <View style={styles.footer}>
                <Pressable style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetText}>Xóa bộ lọc</Text>
                </Pressable>
                <Pressable style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function FilterSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
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
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
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
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
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
  header: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: LAYOUT.modalX,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  content: {
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
  section: { gap: 8 },
  sectionTitle: {
    color: "#111827",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  row: { flexDirection: "row", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, rowGap: 8 },
  chip: {
    paddingHorizontal: 12,
    height: 34,
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
    fontSize: 12,
    lineHeight: 16,
  },
  chipTextActive: { color: "#fff" },
  dateInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },
  dateTextInput: {
    flex: 1,
    fontSize: 12,
    color: "#111827",
    padding: 0,
  },
  customDateRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  customDateField: {
    flex: 1,
    gap: 4,
  },
  customDateLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  dateText: {
    color: "#b3b3b3",
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: LAYOUT.modalX,
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: "row",
    gap: 10,
  },
  applyButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#31582b",
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  resetButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c0c9bd",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    color: "#414940",
    fontSize: 13,
    lineHeight: 17,
  },
});
