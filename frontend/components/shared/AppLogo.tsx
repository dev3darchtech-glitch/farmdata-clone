import farmLogo from "@/assets/images/logo-farmdata.png";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

export function AppLogo() {
  return (
    <View style={appLogoStyles.logoMark}>
      <Image
        source={farmLogo}
        style={appLogoStyles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
}

const appLogoStyles = StyleSheet.create({
  logoMark: {
    width: 110,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 110,
    height: 104,
  },
});
