import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

export function ImageViewerModal({
  visible,
  images = [],
  initialIndex = 0,
  onClose,
}: {
  visible: boolean;
  images?: string[];
  initialIndex?: number;
  onClose?: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  if (!visible || !images || images.length === 0) return null;

  return (
    <View testID="image-viewer-modal" style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Close button */}
      <Pressable onPress={onClose} style={{ position: "absolute", top: 40, right: 20, zIndex: 10 }}>
        <Text style={{ color: "#fff", fontSize: 24 }}>✕</Text>
      </Pressable>

      {/* Image */}
      <Image
        source={{ uri: images[index] }}
        style={{ flex: 1, width: "100%" }}
        resizeMode="contain"
      />

      {/* Counter: "X / Y" */}
      <View style={{ alignItems: "center", padding: 16 }}>
        <Text style={{ color: "#fff" }}>{index + 1}{" / "}{images.length}</Text>
      </View>

      {/* Navigation */}
      {index > 0 ? (
        <Pressable onPress={() => setIndex(index - 1)} style={{ position: "absolute", left: 20, top: "50%" }}>
          <Text style={{ color: "#fff", fontSize: 30 }}>‹</Text>
        </Pressable>
      ) : null}
      {index < images.length - 1 ? (
        <Pressable onPress={() => setIndex(index + 1)} style={{ position: "absolute", right: 20, top: "50%" }}>
          <Text style={{ color: "#fff", fontSize: 30 }}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
