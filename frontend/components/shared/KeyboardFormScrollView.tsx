import React, { forwardRef } from "react";
import { Platform, ScrollView, type ScrollViewProps } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type KeyboardFormScrollViewProps = ScrollViewProps & {
  bottomOffset?: number;
  disableAccessory?: boolean;
};

export const KeyboardFormScrollView = forwardRef<ScrollView, KeyboardFormScrollViewProps>(
  (
    {
      bottomOffset,
      children,
      disableAccessory,
      keyboardDismissMode,
      keyboardShouldPersistTaps,
      showsVerticalScrollIndicator,
      ...props
    },
    ref,
  ) => {
    const resolvedDismissMode =
      keyboardDismissMode ?? (Platform.OS === "ios" ? "interactive" : "on-drag");
    const resolvedPersistTaps = keyboardShouldPersistTaps ?? "handled";
    const resolvedIndicator = showsVerticalScrollIndicator ?? false;

    if (Platform.OS === "web") {
      return (
        <ScrollView
          ref={ref}
          keyboardDismissMode={resolvedDismissMode}
          keyboardShouldPersistTaps={resolvedPersistTaps}
          showsVerticalScrollIndicator={resolvedIndicator}
          {...props}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <KeyboardAwareScrollView
        ref={ref}
        bottomOffset={
          bottomOffset ?? (Platform.OS === "ios" && !disableAccessory ? 90 : 32)
        }
        keyboardDismissMode={resolvedDismissMode}
        keyboardShouldPersistTaps={resolvedPersistTaps}
        showsVerticalScrollIndicator={resolvedIndicator}
        {...props}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  },
);

KeyboardFormScrollView.displayName = "KeyboardFormScrollView";
