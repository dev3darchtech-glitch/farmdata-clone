import { COLORS } from "@/constants/theme";
import { CropTypeInfo, PlantDiseaseInfo, PlotInfo, User } from "@/types";
import { cropIcon, getCropBgColor, getCropColor } from "@/utils/captureDisplay";
import { isManagementItemInactive } from "@/utils/management";
import { MoreVertical } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export function PlotManagementTable({
  rows,
  total,
  onAction,
}: {
  rows: PlotInfo[];
  total: number;
  onAction: (item: PlotInfo) => void;
}) {
  return (
    <View>
      <Text style={tableStyles.summary}>TỔNG SỐ: {total}</Text>
      <View style={tableStyles.cardTable}>
        <View style={tableStyles.plotHeader}>
          <Text style={[tableStyles.headerText, tableStyles.plotCodeCell]}>
            MÃ LUỐNG
          </Text>
          <Text style={[tableStyles.headerText, tableStyles.plotZoneCell]}>
            KHU VỰC
          </Text>
          <Text style={[tableStyles.headerText, tableStyles.plotAreaCell]}>
            DIỆN TÍCH
          </Text>
          <View style={tableStyles.moreCell} />
        </View>
        {rows.map((item) => {
          const inactive = isManagementItemInactive(item);
          return (
            <View
              key={item.id || item.code}
              style={[
                tableStyles.plotRow,
                inactive && tableStyles.rowInactive,
              ]}
            >
              <Text
                style={[
                  tableStyles.plotCodeCell,
                  tableStyles.rowPrimary,
                  inactive && tableStyles.textInactive,
                ]}
                numberOfLines={1}
              >
                {item.code}
              </Text>
              <Text
                style={[
                  tableStyles.plotZoneCell,
                  tableStyles.rowSecondary,
                  inactive && tableStyles.textInactive,
                ]}
                numberOfLines={1}
              >
                {item.name || "-"}
              </Text>
              <Text
                style={[
                  tableStyles.plotAreaCell,
                  tableStyles.rowSecondary,
                  inactive && tableStyles.textInactive,
                ]}
                numberOfLines={1}
              >
                {item.areaSquareMeters ? `${item.areaSquareMeters} m²` : "-"}
              </Text>
              <Pressable
                style={tableStyles.moreCell}
                onPress={() => onAction(item)}
              >
                <MoreVertical
                  size={16}
                  color={inactive ? "#9ca3af" : COLORS.text}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function CropManagementTable({
  rows,
  total,
  onAction,
}: {
  rows: CropTypeInfo[];
  total: number;
  onAction: (item: CropTypeInfo) => void;
}) {
  return (
    <View>
      <Text style={tableStyles.summary}>TỔNG SỐ: {total}</Text>
      <View style={tableStyles.cardTable}>
        <View style={tableStyles.cropHeader}>
          <Text style={[tableStyles.headerText, tableStyles.flexCell]}>
            TÊN LOẠI CÂY
          </Text>
          <View style={tableStyles.moreCell} />
        </View>
        {rows.map((item) => {
          const Icon = cropIcon(item.name);
          const inactive = isManagementItemInactive(item);
          return (
            <View
              key={item.id || item.name}
              style={[
                tableStyles.cropRow,
                inactive && tableStyles.rowInactive,
              ]}
            >
              <View style={tableStyles.cropIdentity}>
                <View
                  style={[
                    tableStyles.cropAvatar,
                    { backgroundColor: getCropBgColor(item.name) },
                    inactive && { opacity: 0.5 },
                  ]}
                >
                  {item.icon ? (
                    <Text style={tableStyles.cropIconText}>{item.icon}</Text>
                  ) : (
                    <Icon size={16} color={getCropColor(item.name)} />
                  )}
                </View>
                <Text
                  style={[
                    tableStyles.cropName,
                    inactive && tableStyles.textInactive,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              <Pressable
                style={tableStyles.moreCell}
                onPress={() => onAction(item)}
              >
                <MoreVertical
                  size={16}
                  color={inactive ? "#9ca3af" : COLORS.text}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function AccountManagementTable({
  rows,
  total,
  onAction,
}: {
  rows: User[];
  total: number;
  onAction: (item: User) => void;
}) {
  return (
    <View>
      <Text style={tableStyles.summary}>TỔNG SỐ: {total}</Text>
      <View style={tableStyles.cardTable}>
        <View style={tableStyles.accountHeader}>
          <Text style={[tableStyles.headerText, tableStyles.accountUserCell]}>
            USERNAME / HỌ TÊN
          </Text>
          <Text style={[tableStyles.headerText, tableStyles.accountRoleCell]}>
            VAI TRÒ
          </Text>
          <View style={tableStyles.moreCell} />
        </View>
        {rows.map((item, index) => {
          const inactive = Boolean(item.isRevoked);
          return (
            <View
              key={item.id || item.username || String(index)}
              style={[
                tableStyles.accountRow,
                inactive && tableStyles.rowInactive,
              ]}
            >
              <View style={tableStyles.accountUserCell}>
                <Text
                  style={[
                    tableStyles.rowPrimary,
                    inactive && tableStyles.textInactive,
                  ]}
                  numberOfLines={1}
                >
                  {item.username || item.name}
                </Text>
                {item.name && item.name !== item.username ? (
                  <Text
                    style={[
                      tableStyles.rowSubText,
                      inactive && tableStyles.textInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  tableStyles.accountRoleCell,
                  tableStyles.rowSecondary,
                  inactive && tableStyles.textInactive,
                ]}
              >
                {item.role === "ADMIN" ? "Quản trị viên" : "Nông dân"}
              </Text>
              <Pressable
                style={tableStyles.moreCell}
                onPress={() => onAction(item)}
              >
                <MoreVertical
                  size={16}
                  color={inactive ? "#9ca3af" : COLORS.text}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PlantDiseaseManagementTable({
  rows,
  total,
  onAction,
}: {
  rows: PlantDiseaseInfo[];
  total: number;
  onAction: (item: PlantDiseaseInfo) => void;
}) {
  return (
    <View>
      <Text style={tableStyles.summary}>TỔNG SỐ: {total}</Text>
      <View style={tableStyles.cardTable}>
        <View style={tableStyles.diseaseHeader}>
          <Text style={[tableStyles.headerText, tableStyles.diseaseTypeCell]}>
            LOẠI BỆNH CÂY
          </Text>
          <Text style={[tableStyles.headerText, tableStyles.diseaseNameCell]}>
            TÊN BỆNH CÂY
          </Text>
          <View style={tableStyles.moreCell} />
        </View>
        {rows.map((item) => {
          const inactive = isManagementItemInactive(item);
          return (
            <View
              key={item.id || `${item.group}-${item.type}-${item.name}`}
              style={[
                tableStyles.diseaseRow,
                inactive && tableStyles.rowInactive,
              ]}
            >
              <Text
                style={[
                  tableStyles.diseaseTypeCell,
                  tableStyles.rowSecondary,
                  inactive && tableStyles.textInactive,
                ]}
                numberOfLines={1}
              >
                {item.type || "-"}
              </Text>
              <Text
                style={[
                  tableStyles.diseaseNameCell,
                  tableStyles.rowPrimary,
                  inactive && tableStyles.textInactive,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Pressable
                style={tableStyles.moreCell}
                onPress={() => onAction(item)}
              >
                <MoreVertical
                  size={16}
                  color={inactive ? "#9ca3af" : COLORS.text}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const sharedRowBorder = {
  borderBottomWidth: 1,
  borderBottomColor: "#f3f4f6",
} as const;

const tableStyles = StyleSheet.create({
  summary: {
    minHeight: 24,
    paddingHorizontal: 12,
    color: COLORS.body,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTable: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 0 6px rgba(0,0,0,0.05)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
        elevation: 2,
      },
    }),
  },
  plotHeader: {
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cropHeader: {
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  accountHeader: {
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  diseaseHeader: {
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerText: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  plotRow: {
    minHeight: 38,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    ...sharedRowBorder,
  },
  plotCodeCell: {
    flex: 1.1,
    paddingRight: 4,
  },
  plotZoneCell: {
    flex: 1.2,
    paddingRight: 4,
  },
  plotAreaCell: {
    flex: 0.9,
    paddingRight: 4,
  },
  cropRow: {
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    ...sharedRowBorder,
  },
  cropIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cropAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cropIconText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
  },
  cropName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  accountRow: {
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    ...sharedRowBorder,
  },
  accountUserCell: {
    flex: 1,
    paddingRight: 4,
  },
  accountRoleCell: {
    width: 90,
    paddingRight: 4,
  },
  diseaseRow: {
    minHeight: 40,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    ...sharedRowBorder,
  },
  diseaseTypeCell: {
    flex: 1,
    paddingRight: 4,
  },
  diseaseNameCell: {
    flex: 1.3,
    paddingRight: 4,
  },
  flexCell: {
    flex: 1,
  },
  moreCell: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  rowPrimary: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  rowSecondary: {
    color: "#4b5563",
    fontSize: 11,
    lineHeight: 15,
  },
  rowSubText: {
    color: "#9ca3af",
    fontSize: 10,
    lineHeight: 14,
  },
  rowInactive: {
    backgroundColor: "#f9fafb",
  },
  textInactive: {
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
});
