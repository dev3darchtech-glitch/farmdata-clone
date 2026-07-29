import { getCaptureWeatherLabel } from "@/components/shared/CaptureFormParts";
import { COLORS, LAYOUT } from "@/constants/theme";
import { Post } from "@/types";
import { envName, formatPostDate, stageName } from "@/utils/captureDisplay";
import {
  buildPostUrl,
  downloadImageOnWeb,
  getImageDownloadName,
} from "@/utils/postImage";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system/next";
import * as MediaLibrary from "expo-media-library";
import {
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

import { BottomSheet } from "@/components/shared/BottomSheet";

export function ImageViewer({
  post,
  initialIndex,
  onClose,
  canDelete,
  onDelete,
}: {
  post: Post | null;
  initialIndex: number;
  onClose: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    const imageCount = post?.images.length || 0;
    setIndex(
      imageCount ? Math.min(Math.max(initialIndex, 0), imageCount - 1) : 0,
    );
  }, [initialIndex, post?.id, post?.images.length]);

  if (!post) return null;
  const uri = post.images[index];
  const imageCount = post.images.length;
  const diseaseDisplayName =
    post.diseaseName?.trim() || post.diseaseType?.trim() || "Bệnh cây";

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

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={imageViewerStyles.modalScrim}>
        <View style={imageViewerStyles.viewer}>
          <View style={imageViewerStyles.viewerTopControls}>
            <Pressable
              style={imageViewerStyles.viewerTopButton}
              onPress={onClose}
            >
              <X size={18} color="#ffffff" />
            </Pressable>
            <Text style={imageViewerStyles.viewerCounter}>
              {imageCount ? index + 1 : 0} / {imageCount}
            </Text>
            <Pressable
              style={imageViewerStyles.viewerTopButton}
              onPress={saveCurrentImage}
              disabled={!uri}
            >
              <Download size={16} color="#ffffff" />
            </Pressable>
          </View>
          <View style={imageViewerStyles.viewerImageStage}>
            {uri ? (
              <Image source={{ uri }} style={imageViewerStyles.viewerImage} />
            ) : (
              <View style={imageViewerStyles.viewerMissingImage}>
                <ImageIcon size={32} color={COLORS.muted} />
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
          <View style={imageViewerStyles.viewerActions}>
            <Pressable
              style={imageViewerStyles.viewerActionButton}
              onPress={copyPostUrl}
            >
              <View style={imageViewerStyles.viewerActionIcon}>
                <Share2 size={16} color={COLORS.muted} />
              </View>
              <Text style={imageViewerStyles.viewerActionText}>Chia sẻ</Text>
            </Pressable>
            {canDelete ? (
              <Pressable
                style={imageViewerStyles.viewerActionButton}
                onPress={() => {
                  Alert.alert(
                    "Xác nhận xóa bài đăng",
                    "Bạn có chắc chắn muốn xóa bài đăng này không? Thao tác này không thể hoàn tác.",
                    [
                      { text: "Hủy", style: "cancel" },
                      {
                        text: "Xóa",
                        style: "destructive",
                        onPress: () => {
                          onClose();
                          onDelete?.();
                        },
                      },
                    ],
                  );
                }}
              >
                <View
                  style={[
                    imageViewerStyles.viewerActionIcon,
                    imageViewerStyles.viewerDeleteIcon,
                  ]}
                >
                  <Trash2 size={15} color="#ef4444" />
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
            ) : null}
            <Pressable
              style={imageViewerStyles.viewerActionButton}
              onPress={() => setInfoVisible(true)}
            >
              <View style={imageViewerStyles.viewerActionIcon}>
                <Info size={16} color={COLORS.muted} />
              </View>
              <Text style={imageViewerStyles.viewerActionText}>Thông tin</Text>
            </Pressable>
          </View>
        </View>

        <BottomSheet
          visible={infoVisible}
          title="Thông tin chi tiết"
          onClose={() => setInfoVisible(false)}
        >
          <View style={imageViewerStyles.tableContainer}>
            <View style={imageViewerStyles.tableRow}>
              <Text style={imageViewerStyles.tableLabel}>Loại cây</Text>
              <Text style={imageViewerStyles.tableValue}>{post.cropType}</Text>
            </View>
            <View style={imageViewerStyles.tableRow}>
              <Text style={imageViewerStyles.tableLabel}>Giai đoạn</Text>
              <Text style={imageViewerStyles.tableValue}>
                {stageName(post.growthStage)}
              </Text>
            </View>
            <View style={imageViewerStyles.tableRow}>
              <Text style={imageViewerStyles.tableLabel}>Mã luống</Text>
              <Text style={imageViewerStyles.tableValue}>
                {post.plotId || "N/A"}
              </Text>
            </View>
            <View style={imageViewerStyles.tableRow}>
              <Text style={imageViewerStyles.tableLabel}>Thời tiết</Text>
              <Text style={imageViewerStyles.tableValue}>
                {post.stationMeasurements?.weatherCode !== undefined
                  ? getCaptureWeatherLabel(post.stationMeasurements.weatherCode)
                  : envName(post.envMode)}
              </Text>
            </View>
            <View style={imageViewerStyles.tableRow}>
              <Text style={imageViewerStyles.tableLabel}>Bệnh cây</Text>
              <Text style={imageViewerStyles.tableValue}>
                {diseaseDisplayName}
              </Text>
            </View>
            <View style={imageViewerStyles.tableRow}>
              <Text style={imageViewerStyles.tableLabel}>Mức độ</Text>
              <Text style={imageViewerStyles.tableValue}>{post.severity}</Text>
            </View>
            <View
              style={[imageViewerStyles.tableRow, { borderBottomWidth: 0 }]}
            >
              <Text style={imageViewerStyles.tableLabel}>Thời gian</Text>
              <Text style={imageViewerStyles.tableValue}>
                {formatPostDate(post.createdAt)}
              </Text>
            </View>
          </View>
        </BottomSheet>
      </View>
    </Modal>
  );
}

const imageViewerStyles = StyleSheet.create({
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewer: {
    width: "100%",
    maxWidth: 600,
    height: "100%",
    maxHeight: 850,
    backgroundColor: "#000",
    overflow: "hidden",
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
    backgroundColor: "transparent",
  },
  viewerTopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  viewerCounter: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  viewerImageStage: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
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
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  viewerDeleteIcon: {
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  viewerActionText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  viewerDeleteText: {
    color: "rgba(239,68,68,0.8)",
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#fff",
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  tableValue: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
});
