import { GardenPalette } from "@/constants/theme";
import { AlertTriangle } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

export function MultiPhotoPicker({ images = [], onChangeImages, error }: { images?: string[]; onChangeImages?: (images: string[]) => void; error?: string }) {
  return (
    <View testID="multi-photo-picker">
      <View>
        {images.map((uri, index) => (
          <Image key={`${uri}-${index}`} source={{ uri }} style={{ width: 64, height: 64 }} />
        ))}
      </View>
      <Pressable onPress={() => onChangeImages?.([...images, `file:///photo-${images.length + 1}.jpg`])}>
        <Text>Chụp ảnh</Text>
      </Pressable>
      {error ? (
        <View>
          <AlertTriangle color={GardenPalette.error} size={16} />
          <Text>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
