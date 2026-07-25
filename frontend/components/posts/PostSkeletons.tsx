import React from "react";
import { View } from "react-native";

export function PostSkeletons() {
  return (
    <View testID="post-skeletons">
      {[0, 1, 2, 3].map((item) => <View key={item} style={{ height: 96 }} />)}
    </View>
  );
}
