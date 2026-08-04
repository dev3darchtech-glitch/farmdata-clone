import { getCaptureWeatherLabel } from "@/components/shared/CaptureFormParts";
import { COLORS, LAYOUT } from "@/constants/theme";
import { Post } from "@/types";
import {
  envName,
  formatMetric,
  formatPostDate,
  stageName,
} from "@/utils/captureDisplay";
import { formatVietnamDateTime } from "@/utils/dateHelper";
import {
  buildPostUrl,
  downloadImageOnWeb,
  getImageDownloadName,
} from "@/utils/postImage";
import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system/next";
import * as MediaLibrary from "expo-media-library";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Info,
  Pencil,
  Share2,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BottomSheet } from "@/components/shared/BottomSheet";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <View style={imageViewerStyles.tableRow}>
      <Text style={imageViewerStyles.tableLabel}>{label}</Text>
      <Text style={imageViewerStyles.tableValue}>{value}</Text>
    </View>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={imageViewerStyles.infoSection}>
      <Text style={imageViewerStyles.infoSectionTitle}>{title}</Text>
      <View style={imageViewerStyles.tableContainer}>{children}</View>
    </View>
  );
}

export function ImageViewer({
  post,
  initialIndex,
  onClose,
  canEdit,
  onEdit,
  canDelete,
  onDelete,
}: {
  post: Post | null;
  initialIndex: number;
  onClose: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const imageScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const imageCount = post?.images.length || 0;
    setIndex(
      imageCount ? Math.min(Math.max(initialIndex, 0), imageCount - 1) : 0,
    );
  }, [initialIndex, post?.id, post?.images.length]);

  useEffect(() => {
    if (!post || !stageWidth) return;
    imageScrollRef.current?.scrollTo({
      x: initialIndex * stageWidth,
      animated: false,
    });
  }, [initialIndex, post, post?.id, stageWidth]);

  const imageCount = post?.images.length || 0;
  const uri = post?.images[index];
  const canGoPrevious = index > 0;
  const canGoNext = index < imageCount - 1;
  const showNavControls = imageCount > 1;
  const weatherLabel = (weatherCode?: number | null, isRaining?: boolean) =>
    typeof weatherCode === "number"
      ? getCaptureWeatherLabel(weatherCode, isRaining)
      : "--";
  const weatherSnapshots = post
    ? [
        { label: "T0", measurement: post.stationMeasurements },
        { label: "T12", measurement: post.stationMeasurementsT12 },
        { label: "T24", measurement: post.stationMeasurementsT24 },
        { label: "T48", measurement: post.stationMeasurementsT48 },
      ]
    : [];

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

  const showPreviousImage = () => {
    if (!canGoPrevious) return;
    const nextIndex = Math.max(0, index - 1);
    imageScrollRef.current?.scrollTo({
      x: nextIndex * stageWidth,
      animated: true,
    });
    setIndex(nextIndex);
  };

  const showNextImage = () => {
    if (!canGoNext) return;
    const nextIndex = Math.min(imageCount - 1, index + 1);
    imageScrollRef.current?.scrollTo({
      x: nextIndex * stageWidth,
      animated: true,
    });
    setIndex(nextIndex);
  };

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!stageWidth) return;
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / stageWidth,
    );
    setIndex(Math.min(Math.max(nextIndex, 0), imageCount - 1));
  };

  if (!post) return null;

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
          <View
            style={imageViewerStyles.viewerImageStage}
            onLayout={(event) => {
              const nextWidth = event.nativeEvent.layout.width;
              if (!nextWidth || nextWidth === stageWidth) return;
              setStageWidth(nextWidth);
            }}
          >
            {uri ? (
              <ScrollView
                ref={imageScrollRef}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentOffset={
                  stageWidth ? { x: index * stageWidth, y: 0 } : undefined
                }
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
                style={imageViewerStyles.viewerPager}
              >
                {post.images.map((imageUri, imageIndex) => (
                  <View
                    key={`${imageUri}-${imageIndex}`}
                    style={[
                      imageViewerStyles.viewerImagePage,
                      stageWidth ? { width: stageWidth } : null,
                    ]}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={imageViewerStyles.viewerImage}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={imageViewerStyles.viewerMissingImage}>
                <ImageIcon size={32} color={COLORS.muted} />
                <Text style={imageViewerStyles.viewerMissingText}>
                  Không có ảnh
                </Text>
              </View>
            )}
            {showNavControls ? (
              <>
                <Pressable
                  style={[
                    imageViewerStyles.viewerNavButton,
                    imageViewerStyles.viewerNavButtonLeft,
                    !canGoPrevious && imageViewerStyles.viewerNavButtonDisabled,
                  ]}
                  disabled={!canGoPrevious}
                  onPress={showPreviousImage}
                >
                  <ChevronLeft size={22} color="#ffffff" />
                </Pressable>
                <Pressable
                  style={[
                    imageViewerStyles.viewerNavButton,
                    imageViewerStyles.viewerNavButtonRight,
                    !canGoNext && imageViewerStyles.viewerNavButtonDisabled,
                  ]}
                  disabled={!canGoNext}
                  onPress={showNextImage}
                >
                  <ChevronRight size={22} color="#ffffff" />
                </Pressable>
              </>
            ) : null}
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
            {canEdit ? (
              <Pressable
                style={imageViewerStyles.viewerActionButton}
                onPress={() => {
                  onClose();
                  onEdit?.();
                }}
              >
                <View style={imageViewerStyles.viewerActionIcon}>
                  <Pencil size={16} color={COLORS.muted} />
                </View>
                <Text style={imageViewerStyles.viewerActionText}>
                  Chỉnh sửa
                </Text>
              </Pressable>
            ) : null}
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
          full
        >
          <ScrollView
            contentContainerStyle={imageViewerStyles.infoContent}
            showsVerticalScrollIndicator={false}
          >
            <InfoSection title="Thông tin cây trồng & bệnh">
              <InfoRow label="Farm" value={post.farmName || "N/A"} />
              <InfoRow label="Loại cây" value={post.cropType} />
              <InfoRow label="Mã luống" value={post.plotId} />
              <InfoRow label="Giai đoạn" value={stageName(post.growthStage)} />
              <InfoRow label="Môi trường" value={envName(post.envMode)} />
              <InfoRow label="Nhóm bệnh" value={post.diseaseGroup} />
              <InfoRow label="Loại bệnh" value={post.diseaseType} />
              <InfoRow label="Tên bệnh" value={post.diseaseName} />
              <InfoRow label="Bộ phận bị bệnh" value={post.diseasedPart} />
              <InfoRow label="Mức độ" value={post.severity} />
              <InfoRow
                label="Mô tả triệu chứng"
                value={post.symptomDescription}
              />
              <InfoRow
                label="Thời gian"
                value={formatPostDate(post.createdAt)}
              />
            </InfoSection>

            {weatherSnapshots.map(({ label, measurement }) => (
              <InfoSection
                key={label}
                title={`Dữ liệu trạm thời tiết (${label})`}
              >
                <InfoRow
                  label="Thời điểm"
                  value={
                    measurement?.updatedAt
                      ? formatVietnamDateTime(measurement.updatedAt)
                      : "--"
                  }
                />
                <InfoRow
                  label="Thời tiết"
                  value={weatherLabel(
                    measurement?.weatherCode,
                    measurement?.isRaining,
                  )}
                />
                <InfoRow
                  label="Nhiệt độ"
                  value={
                    measurement?.temperature !== undefined
                      ? `${formatMetric(measurement.temperature, 1)}°C`
                      : "--"
                  }
                />
                <InfoRow
                  label="Độ ẩm"
                  value={
                    measurement?.humidity !== undefined
                      ? `${measurement.humidity}%`
                      : "--"
                  }
                />
                <InfoRow
                  label="Ánh sáng"
                  value={
                    Number.isFinite(measurement?.lightUvIndex)
                      ? `${measurement?.lightUvIndex} W/m²`
                      : "--"
                  }
                />
                <InfoRow
                  label="Gió"
                  value={
                    measurement?.windSpeed !== undefined
                      ? `${measurement.windSpeed} km/h`
                      : "--"
                  }
                />
                <InfoRow
                  label="CO₂"
                  value={
                    Number.isFinite(measurement?.co2Level)
                      ? `${measurement?.co2Level} ppm`
                      : "--"
                  }
                />
              </InfoSection>
            ))}

            {post.localMeasurements ? (
              <InfoSection title="Số đo tại nơi">
                <InfoRow
                  label="Nhiệt độ"
                  value={
                    post.localMeasurements.temperature !== undefined
                      ? `${post.localMeasurements.temperature}°C`
                      : undefined
                  }
                />
                <InfoRow
                  label="Độ ẩm"
                  value={
                    post.localMeasurements.humidity !== undefined
                      ? `${post.localMeasurements.humidity}%`
                      : undefined
                  }
                />
                <InfoRow
                  label="Ánh sáng"
                  value={
                    post.localMeasurements.lightUvIndex !== undefined
                      ? `${post.localMeasurements.lightUvIndex} lux`
                      : undefined
                  }
                />
                <InfoRow
                  label="Tốc độ gió"
                  value={
                    post.localMeasurements.windSpeed !== undefined
                      ? `${post.localMeasurements.windSpeed} m/s`
                      : undefined
                  }
                />
                <InfoRow
                  label="CO2"
                  value={
                    post.localMeasurements.co2Level !== undefined
                      ? `${post.localMeasurements.co2Level} ppm`
                      : undefined
                  }
                />
                <InfoRow label="pH đất" value={post.localMeasurements.soilPh} />
                <InfoRow label="EC đất" value={post.localMeasurements.soilEc} />
                <InfoRow label="DO đất" value={post.localMeasurements.soilDo} />
                <InfoRow
                  label="Độ ẩm đất"
                  value={post.localMeasurements.soilHumidity}
                />
              </InfoSection>
            ) : null}

            {post.captureLocation ? (
              <InfoSection title="Vị trí GPS">
                <InfoRow
                  label="Vĩ độ"
                  value={String(post.captureLocation.latitude)}
                />
                <InfoRow
                  label="Kinh độ"
                  value={String(post.captureLocation.longitude)}
                />
                <InfoRow
                  label="Địa chỉ"
                  value={post.captureLocation.formattedAddress}
                />
              </InfoSection>
            ) : null}
          </ScrollView>
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
  viewerPager: {
    width: "100%",
    height: "100%",
  },
  viewerImagePage: {
    height: "100%",
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
  viewerNavButton: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.36)",
    zIndex: 2,
  },
  viewerNavButtonLeft: {
    left: 14,
  },
  viewerNavButtonRight: {
    right: 14,
  },
  viewerNavButtonDisabled: {
    opacity: 0.35,
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
  },
  infoContent: {
    paddingVertical: 10,
    paddingBottom: 24,
  },
  infoSection: {
    marginBottom: 18,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
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
    textAlign: "right",
  },
});
