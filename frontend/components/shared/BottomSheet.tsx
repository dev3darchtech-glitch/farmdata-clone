import { DrawerSheet } from "@/components/shared/DrawerSheet";
import React from "react";

export function BottomSheet({
  visible,
  title,
  children,
  onClose,
  full,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  full?: boolean;
}) {
  return (
    <DrawerSheet visible={visible} title={title} onClose={onClose} full={full}>
      {children}
    </DrawerSheet>
  );
}
