import { StorageDestination } from "@/types";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function StorageDestinationPicker({
  value,
  destination,
  onChange,
  onSelectDestination,
}: {
  value?: StorageDestination;
  destination?: StorageDestination | string;
  onChange?: (value: StorageDestination) => void;
  onSelectDestination?: (value: StorageDestination) => void;
}) {
  const selected = (destination ?? value ?? "local") as StorageDestination;

  const choose = (next: StorageDestination) => {
    onChange?.(next);
    onSelectDestination?.(next);
  };

  return (
    <View testID="storage-destination-picker">
      {(["local", "gdrive"] as StorageDestination[]).map((item) => (
        <Pressable
          key={item}
          testID={`destination-${item}-btn`}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === item }}
          onPress={() => choose(item)}
        >
          <Text>{item === "local" ? "Thiết bị" : "Google Drive"}</Text>
        </Pressable>
      ))}
    </View>
  );
}
