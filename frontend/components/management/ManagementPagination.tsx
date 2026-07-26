import { COLORS } from "@/constants/theme";
import { getVisibleManagementPages } from "@/utils/management";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ManagementPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1 || totalItems <= 0) {
    return null;
  }

  const pages = getVisibleManagementPages(page, totalPages);

  return (
    <View style={paginationStyles.container}>
      <Pressable
        style={[
          paginationStyles.button,
          page <= 1 && paginationStyles.buttonDisabled,
        ]}
        disabled={page <= 1}
        onPress={() => onPageChange(page - 1)}
      >
        <Text
          style={[
            paginationStyles.text,
            page <= 1 && paginationStyles.textDisabled,
          ]}
        >
          ‹
        </Text>
      </Pressable>
      {pages.map((label, index) =>
        label === "…" ? (
          <View key={`${label}-${index}`} style={paginationStyles.button}>
            <Text style={paginationStyles.text}>…</Text>
          </View>
        ) : (
          <Pressable
            key={label}
            style={[
              paginationStyles.button,
              label === page && paginationStyles.buttonActive,
            ]}
            onPress={() => onPageChange(label)}
          >
            <Text
              style={[
                paginationStyles.text,
                label === page && paginationStyles.textActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ),
      )}
      <Pressable
        style={[
          paginationStyles.button,
          (page >= totalPages || totalItems === 0) &&
            paginationStyles.buttonDisabled,
        ]}
        disabled={page >= totalPages || totalItems === 0}
        onPress={() => onPageChange(page + 1)}
      >
        <Text
          style={[
            paginationStyles.text,
            (page >= totalPages || totalItems === 0) &&
              paginationStyles.textDisabled,
          ]}
        >
          ›
        </Text>
      </Pressable>
    </View>
  );
}

const paginationStyles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 64,
    height: 65,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: COLORS.green,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  text: {
    color: COLORS.body,
    fontSize: 14,
    fontWeight: "600",
  },
  textActive: {
    color: "#fff",
  },
  textDisabled: {
    color: "#9ca3af",
  },
});
