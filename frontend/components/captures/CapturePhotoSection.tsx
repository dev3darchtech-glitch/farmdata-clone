import { COLORS } from "@/constants/theme";
import { Camera, X } from "lucide-react-native";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CaptureSectionOrder, formatSectionTitle } from "@/utils/sectionTitle";
import { FieldLabel } from "../shared/FieldLabel";

export function CapturePhotoSection({
  actionLabel = "Chụp ảnh",
  errorText,
  helpText = "Chụp ít nhất 1 ảnh",
  images,
  onAddPhoto,
  onRemovePhoto,
  order,
  title = "Ảnh cây trồng",
}: {
  actionLabel?: string;
  errorText?: string;
  helpText?: string;
  images: string[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  order?: CaptureSectionOrder;
  title?: string;
}) {
  return (
    <View style={photoSectionStyles.section}>
      <View style={photoSectionStyles.headerRow}>
        <FieldLabel required>{formatSectionTitle(title, order)}</FieldLabel>
        {images.length ? (
          <Text style={photoSectionStyles.statusText}>
            Đã thêm {images.length} ảnh
          </Text>
        ) : null}
      </View>
      <Text style={photoSectionStyles.helpText}>{helpText}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          photoSectionStyles.photoRow,
          images.length > 0 && photoSectionStyles.photoRowFilled,
        ]}
      >
        {images.map((uri, index) => (
          <View
            key={`${uri}-${index}`}
            style={[
              photoSectionStyles.photoThumb,
              photoSectionStyles.photoThumbFilled,
            ]}
          >
            <Image source={{ uri }} style={photoSectionStyles.photoImage} />
            <Pressable
              style={photoSectionStyles.removeThumb}
              onPress={() => onRemovePhoto(index)}
            >
              <X size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={[
            photoSectionStyles.addPhoto,
            images.length > 0 && photoSectionStyles.addPhotoCompact,
          ]}
          onPress={onAddPhoto}
        >
          <Camera size={images.length ? 20 : 24} color={COLORS.green} />
          <Text
            style={[
              photoSectionStyles.addPhotoText,
              images.length > 0 && photoSectionStyles.addPhotoTextCompact,
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
        {!images.length ? (
          <View style={photoSectionStyles.emptyPhotoState}>
            <Text style={photoSectionStyles.emptyPhotoText}>Chưa có ảnh</Text>
          </View>
        ) : null}
      </ScrollView>
      {errorText ? (
        <Text style={photoSectionStyles.errorText}>{errorText}</Text>
      ) : null}
    </View>
  );
}

const photoSectionStyles = StyleSheet.create({
  section: {
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 20,
  },
  helpText: {
    color: COLORS.body,
    fontSize: 16,
    lineHeight: 20,
  },
  photoRow: {
    gap: 16,
    alignItems: "center",
  },
  photoRowFilled: {
    gap: 8,
  },
  photoThumb: {
    width: 92,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.field,
  },
  photoThumbFilled: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  removeThumb: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 92,
    height: 88,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(25,87,41,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(234,242,157,0.5)",
  },
  addPhotoCompact: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  addPhotoText: {
    color: COLORS.green,
    fontSize: 16,
    lineHeight: 20,
  },
  addPhotoTextCompact: {
    color: COLORS.body,
    fontSize: 10,
    lineHeight: 15,
  },
  emptyPhotoState: {
    height: 88,
    justifyContent: "center",
  },
  emptyPhotoText: {
    color: COLORS.danger,
    fontSize: 16,
    lineHeight: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
