import { getCaptureWeatherLabel } from "@/components/shared/CaptureFormParts";
import { COLORS, LAYOUT } from "@/constants/theme";
import { Post } from "@/types";
import {
  envName,
  formatPostDate,
  severityDotColor,
  stagePostName,
} from "@/utils/captureDisplay";
import {
  buildPostUrl,
  downloadImageOnWeb,
  getImageDownloadName,
} from "@/utils/postImage";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system/next";
import * as MediaLibrary from "expo-media-library";
import {
  Calendar,
  Download,
  Image as ImageIcon,
  Info,
  Share2,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function ImageViewer({
  post,
  initialIndex,
  onClose,
}: {
  post: Post | null;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const imageCount = post?.images.length || 0;
    setIndex(
      imageCount ? Math.min(Math.max(initialIndex, 0), imageCount - 1) : 0,
    );
  }, [initialIndex, post?.id, post?.images.length]);
  if (!post) return null;
  const uri = post.images[index];
  const imageCount = post.images.length;
  const currentDriveFile = post.driveFiles?.[index];
  const saveCurrentImage = async () => {
    if (!uri) return;
    try {
      const fileName = getImageDownloadName(post, index, uri);

      if (Platform.OS === "web") {
        downloadImageOnWeb(uri, fileName);
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(
          "Không thể tải ảnh",
          "Ứng dụng cần quyền lưu ảnh vào thư viện.",
        );
        return;
      }

      const localUri = uri.startsWith("file://")
        ? uri
        : (
            await File.downloadFileAsync(uri, new File(Paths.cache, fileName), {
              idempotent: true,
            })
          ).uri;

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert("Đã tải ảnh", "Ảnh đã được lưu vào thư viện.");
    } catch {
      Alert.alert("Không thể tải ảnh", "Vui lòng thử lại sau.");
    }
  };
  const copyPostUrl = async () => {
    try {
      await Clipboard.setStringAsync(buildPostUrl(post));
      Alert.alert("Đã copy URL", "URL bài đã được copy vào clipboard.");
    } catch {
      Alert.alert("Không thể copy URL", "Vui lòng thử lại sau.");
    }
  };
  const showInfo = () => {
    Alert.alert(
      `${post.cropType} - ${stagePostName(post.growthStage)}`,
      currentDriveFile?.description ||
        [
          post.plotId ? `Mã luống: ${post.plotId}` : undefined,
          post.stationMeasurements?.weatherCode !== undefined
            ? `Thời tiết: ${getCaptureWeatherLabel(post.stationMeasurements.weatherCode)}`
            : `Môi trường: ${envName(post.envMode)}`,
          `Tình trạng: ${post.symptomDescription} - Mức độ ${post.severity}`,
          `Thời gian: ${formatPostDate(post.createdAt)}`,
        ]
          .filter(Boolean)
          .join("\n"),
    );
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={imageViewerStyles.viewer}>
        <View style={imageViewerStyles.viewerTopControls}>
          <Pressable
            style={imageViewerStyles.viewerTopButton}
            onPress={onClose}
          >
            <X size={24} color="#111827" />
          </Pressable>
          <Text style={imageViewerStyles.viewerCounter}>
            {imageCount ? index + 1 : 0} / {imageCount}
          </Text>
          <Pressable
            style={imageViewerStyles.viewerTopButton}
            onPress={saveCurrentImage}
            disabled={!uri}
          >
            <Download size={21} color="#111827" />
          </Pressable>
        </View>
        <View style={imageViewerStyles.viewerImageStage}>
          {uri ? (
            <Image source={{ uri }} style={imageViewerStyles.viewerImage} />
          ) : (
            <View style={imageViewerStyles.viewerMissingImage}>
              <ImageIcon size={42} color={COLORS.muted} />
              <Text style={imageViewerStyles.viewerMissingText}>
                Không có ảnh
              </Text>
            </View>
          )}
          <Pressable
            style={[
              imageViewerStyles.viewerNavHit,
              imageViewerStyles.viewerNavHitLeft,
            ]}
            disabled={index === 0}
            onPress={() => setIndex((value) => Math.max(0, value - 1))}
          />
          <Pressable
            style={[
              imageViewerStyles.viewerNavHit,
              imageViewerStyles.viewerNavHitRight,
            ]}
            disabled={index >= imageCount - 1}
            onPress={() =>
              setIndex((value) => Math.min(imageCount - 1, value + 1))
            }
          />
        </View>
        <View style={imageViewerStyles.viewerInfoCard}>
          <Text style={imageViewerStyles.viewerPlotText}>
            {post.plotId || "Không có mã luống"}
          </Text>
          <Text style={imageViewerStyles.viewerTitleText}>
            {post.cropType} - {stagePostName(post.growthStage)}
          </Text>
          <Text style={imageViewerStyles.viewerEnvironmentText}>
            {post.stationMeasurements?.weatherCode !== undefined
              ? getCaptureWeatherLabel(post.stationMeasurements.weatherCode)
              : envName(post.envMode)}
          </Text>
          <View style={imageViewerStyles.viewerSymptomRow}>
            <View
              style={[
                imageViewerStyles.viewerSymptomDot,
                { backgroundColor: severityDotColor(post.severity) },
              ]}
            />
            <Text style={imageViewerStyles.viewerSymptomText}>
              {post.symptomDescription} - Mức độ {post.severity}
            </Text>
          </View>
          <View style={imageViewerStyles.viewerDateRow}>
            <Calendar size={14} color="rgba(255,255,255,0.6)" />
            <Text style={imageViewerStyles.viewerDateText}>
              {formatPostDate(post.createdAt)}
            </Text>
          </View>
        </View>
        <View style={imageViewerStyles.viewerActions}>
          <Pressable
            style={imageViewerStyles.viewerActionButton}
            onPress={copyPostUrl}
          >
            <View style={imageViewerStyles.viewerActionIcon}>
              <Share2 size={22} color={COLORS.muted} />
            </View>
            <Text style={imageViewerStyles.viewerActionText}>Chia sẻ</Text>
          </Pressable>
          <Pressable
            style={imageViewerStyles.viewerActionButton}
            onPress={() =>
              Alert.alert(
                "Chưa hỗ trợ xoá ảnh",
                "Ảnh đang được quản lý từ bài đăng.",
              )
            }
          >
            <View
              style={[
                imageViewerStyles.viewerActionIcon,
                imageViewerStyles.viewerDeleteIcon,
              ]}
            >
              <Trash2 size={20} color="#ef4444" />
            </View>
            <Text
              style={[
                imageViewerStyles.viewerActionText,
                imageViewerStyles.viewerDeleteText,
              ]}
            >
              Xóa
            </Text>
          </Pressable>
          <Pressable
            style={imageViewerStyles.viewerActionButton}
            onPress={showInfo}
          >
            <View style={imageViewerStyles.viewerActionIcon}>
              <Info size={22} color={COLORS.muted} />
            </View>
            <Text style={imageViewerStyles.viewerActionText}>Thông tin</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const imageViewerStyles = StyleSheet.create({
  viewer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  viewerTopControls: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 110,
    zIndex: 5,
    paddingHorizontal: LAYOUT.screenX,
    paddingTop: LAYOUT.screenTop,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  viewerTopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCounter: {
    color: "#2b2b2b",
    fontSize: 16,
    lineHeight: 23,
  },
  viewerImageStage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 110,
    height: 613,
    overflow: "hidden",
    backgroundColor: COLORS.field,
  },
  viewerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  viewerMissingImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  viewerMissingText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "700",
  },
  viewerNavHit: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "38%",
  },
  viewerNavHitLeft: {
    left: 0,
  },
  viewerNavHitRight: {
    right: 0,
  },
  viewerInfoCard: {
    position: "absolute",
    left: 16,
    right: 24,
    top: 520,
    minHeight: 185,
    borderRadius: 16,
    padding: 17,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 8,
    overflow: "hidden",
  },
  viewerPlotText: {
    color: "#b1f2b5",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
  },
  viewerTitleText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  viewerEnvironmentText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
  },
  viewerSymptomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  viewerSymptomDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  viewerSymptomText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
  },
  viewerDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  viewerDateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
  viewerActions: {
    position: "absolute",
    left: LAYOUT.screenX,
    right: LAYOUT.screenX,
    bottom: 28,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerActionButton: {
    alignItems: "center",
    gap: 4,
    minWidth: 58,
  },
  viewerActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,24,39,0.04)",
  },
  viewerDeleteIcon: {
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  viewerActionText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  viewerDeleteText: {
    color: "rgba(239,68,68,0.8)",
  },
});
