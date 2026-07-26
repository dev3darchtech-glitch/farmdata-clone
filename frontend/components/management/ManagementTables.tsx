import { COLORS } from "@/constants/theme";
import { CropTypeInfo, PlotInfo, User } from "@/types";
import { cropIcon, getCropBgColor, getCropColor } from "@/utils/captureDisplay";
import { formatPlotMeta, getFarmerDisplayCode } from "@/utils/management";
import { MoreVertical } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ManagementStatus } from "./ManagementStatus";

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
      <View style={tableStyles.plainTable}>
        <View style={tableStyles.plotHeader}>
          <View style={tableStyles.headerCell}>
            <Text style={tableStyles.headerText}>Mã số luống</Text>
          </View>
          <View style={tableStyles.headerCellRight}>
            <Text style={tableStyles.headerText}>Trạng thái</Text>
          </View>
        </View>
        {rows.map((item) => (
          <View key={item.id || item.code} style={tableStyles.plotRow}>
            <View style={tableStyles.plotCell}>
              <Text style={tableStyles.rowPrimary}>{item.code}</Text>
              <Text style={tableStyles.rowMeta}>{formatPlotMeta(item)}</Text>
            </View>
            <ManagementStatus item={item} />
            <Pressable
              style={tableStyles.moreButton}
              onPress={() => onAction(item)}
            >
              <MoreVertical size={20} color={COLORS.text} />
            </Pressable>
          </View>
        ))}
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
      <Text style={tableStyles.summary}>Tổng số: {total}</Text>
      <View style={tableStyles.cardTable}>
        <View style={tableStyles.cropHeader}>
          <Text style={tableStyles.headerText}>TÊN LOẠI CÂY</Text>
          <Text style={tableStyles.headerText}>TRẠNG THÁI</Text>
        </View>
        {rows.map((item) => {
          const Icon = cropIcon(item.name);
          return (
            <View key={item.id || item.name} style={tableStyles.cropRow}>
              <View style={tableStyles.cropIdentity}>
                <View
                  style={[
                    tableStyles.cropAvatar,
                    { backgroundColor: getCropBgColor(item.name) },
                  ]}
                >
                  <Icon size={20} color={getCropColor(item.name)} />
                </View>
                <Text style={tableStyles.cropName}>{item.name}</Text>
              </View>
              <ManagementStatus item={item} />
              <Pressable
                style={tableStyles.moreButton}
                onPress={() => onAction(item)}
              >
                <MoreVertical size={20} color={COLORS.text} />
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
  pageStart,
  onAction,
}: {
  rows: User[];
  total: number;
  pageStart: number;
  onAction: (item: User) => void;
}) {
  return (
    <View>
      <Text style={tableStyles.summary}>Tổng số: {total}</Text>
      <View style={tableStyles.accountTable}>
        <View style={tableStyles.accountHeader}>
          <Text style={tableStyles.headerText}>MÃ CẤP</Text>
          <Text style={tableStyles.headerText}>USERNAME</Text>
          <Text style={tableStyles.headerText}>TRẠNG THÁI</Text>
        </View>
        {rows.map((item, index) => (
          <View
            key={item.id || item.username || String(index)}
            style={tableStyles.accountRow}
          >
            <Text style={tableStyles.accountCell}>
              {getFarmerDisplayCode(item, pageStart + index)}
            </Text>
            <Text style={tableStyles.accountCell} numberOfLines={1}>
              {item.username || item.name}
            </Text>
            <View style={tableStyles.accountStatusCell}>
              <ManagementStatus item={item} />
            </View>
            <Pressable
              style={tableStyles.accountMoreCell}
              onPress={() => onAction(item)}
            >
              <MoreVertical size={20} color={COLORS.text} />
            </Pressable>
          </View>
        ))}
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
    minHeight: 36,
    paddingHorizontal: 16,
    color: COLORS.body,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  plainTable: {
    width: "100%",
  },
  cardTable: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#fff",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 0 8px rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 2,
      },
    }),
  },
  plotHeader: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  cropHeader: {
    height: 46,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerCell: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerCellRight: {
    width: 150,
    paddingLeft: 16,
  },
  headerText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  plotRow: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    ...sharedRowBorder,
  },
  plotCell: {
    flex: 1,
    minWidth: 0,
  },
  rowPrimary: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  rowMeta: {
    marginTop: 2,
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
  },
  moreButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cropRow: {
    minHeight: 72,
    paddingHorizontal: 16,
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
    gap: 12,
  },
  cropAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cropName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  accountTable: {
    width: "100%",
  },
  accountHeader: {
    minHeight: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accountRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    ...sharedRowBorder,
  },
  accountCell: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  accountStatusCell: {
    flex: 1.28,
  },
  accountMoreCell: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
