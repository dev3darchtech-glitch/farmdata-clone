import React from "react";
import { Pressable } from "react-native";

export function HapticTab(props: React.ComponentProps<typeof Pressable>) {
  return <Pressable {...props} />;
}

export default HapticTab;
