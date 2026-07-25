import { StorageDestination } from "@/types";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function StorageDestinationPicker({ value, destination, onChange, onSelectDestination }: { value?: StorageDestination; destination?: StorageDestination | string; onChange?: (value: StorageDestination) => void; onSelectDestination?: (value: StorageDestination) => void }) {
  return (
    <View testID="storage-destination-picker">
      {(["local", "gdrive"] as StorageDestination[]).map((item) => (
        <Pressable key={item} onPress={() => { onChange?.(item); onSelectDestination?.(item); }}>
          <Text>{item === "local" ? "Thiết bị" : "Google Drive"}</Text>
        </Pressable>
      ))}
    </View>
  );
}
