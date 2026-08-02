import { getCaptureWeatherLabel } from "@/components/shared/CaptureFormParts";
import { COLORS } from "@/constants/theme";
import { Post } from "@/types";
import {
  envName,
  formatPostDate,
  severityDotColor,
  stageName,
} from "@/utils/captureDisplay";
import {
  Calendar,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function PostCard({
  post,
  admin,
  canDelete,
  canEdit,
  onImage,
  onDelete,
  onEdit,
}: {
  post: Post;
  admin?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  onImage: (index?: number) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const imageCount = post.images.length;
  const visibleImages = post.images.slice(0, Math.min(imageCount, 4));
  const extraImageCount = Math.max(imageCount - 4, 0);
  const diseaseDisplayName =
    post.diseaseName?.trim() || post.diseaseType?.trim() || "Bệnh cây";

  const handleConfirmDelete = () => {
    Alert.alert(
      "Xác nhận xóa bài đăng",
      "Bạn có chắc chắn muốn xóa bài đăng này không? Thao tác này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => onDelete?.(),
        },
      ],
    );
  };

  return (
    <View style={postCardStyles.postCard} testID={`post-card-${post.id}`}>
      <View
        style={[
          postCardStyles.postImageGrid,
          imageCount <= 1 && postCardStyles.postImageGridSingle,
        ]}
      >
        {visibleImages.length > 0 ? (
          visibleImages.map((image, index) => (
            <Pressable
              key={`${image}-${index}`}
              onPress={() => onImage(index)}
              style={[
                postCardStyles.postImageCell,
                imageCount === 1 && postCardStyles.postImageCellSingle,
                imageCount === 2 && postCardStyles.postImageCellHalf,
              ]}
            >
              <Image
                source={{ uri: image }}
                style={postCardStyles.postThumbImage}
              />
              {index === 3 && extraImageCount > 0 ? (
                <View style={postCardStyles.imageCountBadge}>
                  <Text style={postCardStyles.imageCountText}>
                    +{extraImageCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))
        ) : (
          <View
            style={[
              postCardStyles.postThumbPlaceholder,
              postCardStyles.postImageCellSingle,
            ]}
          >
            <ImageIcon size={20} color={COLORS.muted} />
          </View>
        )}
      </View>
      <View style={postCardStyles.postInfo}>
        <View style={postCardStyles.postTitleRow}>
          {post.plotId ? (
            <View style={postCardStyles.plotBadge}>
              <Text style={postCardStyles.plotBadgeText}>{post.plotId}</Text>
            </View>
          ) : null}
          <Text style={postCardStyles.postTitle} numberOfLines={1}>
            {post.cropType} - {stageName(post.growthStage)}
          </Text>
          {canEdit ? (
            <Pressable
              style={postCardStyles.editCardButton}
              onPress={onEdit}
              hitSlop={8}
            >
              <Pencil size={15} color={COLORS.green} />
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable
              style={postCardStyles.deleteCardButton}
              onPress={handleConfirmDelete}
              hitSlop={8}
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          ) : null}
        </View>
        <Text style={postCardStyles.postMeta} numberOfLines={1}>
          {post.stationMeasurements?.weatherCode !== undefined
            ? getCaptureWeatherLabel(
                post.stationMeasurements.weatherCode,
                post.stationMeasurements.isRaining,
              )
            : envName(post.envMode)}
        </Text>
        <View style={postCardStyles.symptomRow}>
          <View
            style={[
              postCardStyles.symptomDot,
              { backgroundColor: severityDotColor(post.severity) },
            ]}
          />
          <Text style={postCardStyles.symptomText} numberOfLines={1}>
            {diseaseDisplayName} - Mức độ {post.severity}
          </Text>
        </View>
        {admin ? (
          <Text style={postCardStyles.postMeta} numberOfLines={1}>
            Người gửi: {post.user.name}
          </Text>
        ) : null}
        <View style={postCardStyles.postDateRow}>
          <Calendar size={12} color="#9ca3af" />
          <Text style={postCardStyles.postDate}>
            {formatPostDate(post.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const postCardStyles = StyleSheet.create({
  postCard: {
    minHeight: 124,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 0 8px rgba(0, 0, 0, 0.14)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.14,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        }),
    elevation: 4,
  },
  postImageGrid: {
    width: 96,
    height: 100,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  postImageGridSingle: {
    flexWrap: "nowrap",
  },
  postImageCell: {
    width: 46,
    height: 48,
    borderRadius: 6,
    overflow: "hidden",
  },
  postImageCellSingle: {
    width: 96,
    height: 100,
  },
  postImageCellHalf: {
    width: 46,
    height: 100,
  },
  postThumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: COLORS.field,
  },
  postThumbPlaceholder: {
    width: 96,
    height: 100,
    borderRadius: 6,
    backgroundColor: COLORS.field,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCountBadge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  postInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  postTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plotBadge: {
    height: 21,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  plotBadgeText: {
    color: "#6b7280",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },
  postTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  postMeta: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 15,
  },
  symptomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  symptomDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  symptomText: {
    flex: 1,
    color: "#374151",
    fontSize: 11,
    lineHeight: 15,
  },
  postDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postDate: {
    color: "#9ca3af",
    fontSize: 10,
    lineHeight: 14,
  },
  deleteCardButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  editCardButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
});
