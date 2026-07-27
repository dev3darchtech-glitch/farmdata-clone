import { BottomSheet } from "@/components/shared/BottomSheet";
import { InputSelection } from "@/components/shared/InputSelection";
import { InputText } from "@/components/shared/InputText";
import { COLORS, LAYOUT } from "@/constants/theme";
import { PLOT_ZONE_OPTIONS } from "@/utils/management";
import { Check } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type PlotFormValue = {
  code: string;
  zone: string;
  area: string;
  status: string;
};

export function PlotFormSheet({
  visible,
  value,
  onChange,
  onClose,
  onSubmit,
  editing,
}: {
  visible: boolean;
  value: PlotFormValue;
  onChange: (value: PlotFormValue) => void;
  onClose: () => void;
  onSubmit: () => void;
  editing?: boolean;
}) {
  const [zoneOpen, setZoneOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setZoneOpen(false);
    }
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      title={`${editing ? "Chỉnh sửa" : "Thêm"} mã số luống`}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={plotSheetStyles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <InputText
          label="Mã số luống"
          required
          value={value.code}
          onChangeText={(code) => onChange({ ...value, code })}
          style={plotSheetStyles.input}
          placeholder="Nhập mã số luống"
        />
        <View style={plotSheetStyles.field}>
          <InputSelection
            fieldStyle={plotSheetStyles.select}
            label="Khu vực"
            onPress={() => setZoneOpen((current) => !current)}
            placeholder="Chọn khu vực"
            value={value.zone}
          />
          {zoneOpen ? (
            <View style={plotSheetStyles.zoneOptionList}>
              {PLOT_ZONE_OPTIONS.map((zone) => {
                const selected = value.zone === zone;
                return (
                  <Pressable
                    key={zone}
                    style={[
                      plotSheetStyles.zoneOptionRow,
                      selected && plotSheetStyles.zoneOptionActive,
                    ]}
                    onPress={() => {
                      onChange({ ...value, zone });
                      setZoneOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        plotSheetStyles.zoneOptionText,
                        selected && plotSheetStyles.zoneOptionTextActive,
                      ]}
                    >
                      {zone}
                    </Text>
                    {selected ? <Check size={18} color={COLORS.green} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <InputText
          keyboardType="numeric"
          label="Diện tích (m²)"
          value={value.area}
          onChangeText={(area) => onChange({ ...value, area })}
          style={plotSheetStyles.input}
          placeholder="Nhập diện tích"
        />
        <InputSelection
          fieldStyle={plotSheetStyles.select}
          label="Trạng thái"
          onPress={() => {}}
          placeholder="Chọn trạng thái"
          value={value.status}
        />
      </ScrollView>
      <View style={plotSheetStyles.footer}>
        <Pressable style={plotSheetStyles.cancelButton} onPress={onClose}>
          <Text style={plotSheetStyles.cancelText}>Hủy</Text>
        </Pressable>
        <Pressable
          style={[
            plotSheetStyles.saveButton,
            !value.code.trim() && plotSheetStyles.disabledButton,
          ]}
          disabled={!value.code.trim()}
          onPress={onSubmit}
        >
          <Text style={plotSheetStyles.saveText}>Lưu</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const plotSheetStyles = StyleSheet.create({
  body: {
    paddingTop: 4,
    paddingBottom: LAYOUT.sheetTop,
    gap: LAYOUT.sectionGap,
  },
  field: {
    gap: 10,
  },
  input: {
    borderRadius: 8,
  },
  select: {
    borderRadius: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingBottom: 12,
  },
  cancelButton: {
    width: 100,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.green,
    fontSize: 12,
    lineHeight: 16,
  },
  saveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  zoneOptionList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  zoneOptionRow: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  zoneOptionActive: {
    backgroundColor: "#f0f8ed",
  },
  zoneOptionText: {
    color: COLORS.body,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  zoneOptionTextActive: {
    color: COLORS.green,
  },
});
