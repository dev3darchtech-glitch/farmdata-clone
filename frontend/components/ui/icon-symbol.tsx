import React from "react";
import { Text, TextStyle } from "react-native";

export function IconSymbol({
  name,
  color,
  size = 24,
  style,
}: {
  name: string;
  color?: string;
  size?: number;
  style?: TextStyle;
}) {
  return (
    <Text accessibilityLabel={name} style={[{ color, fontSize: size }, style]}>
      {name}
    </Text>
  );
}

export default IconSymbol;
